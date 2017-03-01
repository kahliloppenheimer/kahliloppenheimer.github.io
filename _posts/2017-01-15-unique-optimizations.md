---
layout: post
title: "Optimizing queries by leveraging uniqueness"
date: 2017-01-15
permalink: /unique-attributes/
categories: query-optimization database patent sql vertica
---

[![Image of word 'Patented'](/assets/images/patented.png)][patent]

During the first week of my internship at Vertica, my mentor assigned a small bug for me to fix about a set of particular SQL queries. After writing a simple fix for this bug, however, I realized something fantastic. I realized that the scope of what I was working on was much larger. This bug was just a special case of something much larger. I was captivated.

For the remainder of the summer, I expanded what I had discovered as far as I could. To make things a bit more concrete, I was trying to optimize queries that operated on unique columns (more on exactly what that means soon). By the end of the summer, I had designed, implemented, and submitted a [patent][patent] for these optimization techniques. The patent was just recently published in October 2016, over two years later.

This blog post is my best attempt to explain my work and hopefully convey some of my excitement for what I found.

## What is the idea in one sentence?

The basic idea is to take an SQL query and first identify uniqueness, then leverage that uniqueness to cut out expensive operations like sorts, groups, and joins.

Let's see how this all works.

## Defining and identifying uniqueness
I'll first define uniqueness and talk about how we can determine which columns are unique.

A relational database consists of *tables* (or relations), and each relation consists of *columns* (or attributes). We call a column unique if it contains no duplicate values. That is to say that a column containing the values `['cat', 'dog', 'pig']` is unique while a column containing the values `['cat', 'dog', 'cat']` is **not** unique. We call a set of columns unique if there are no two rows in the set that have the same values for all columns. As an example `[('car', 'red'), ('car', 'blue'), ('truck, brown')]` is unique, while `[('car', 'red'), ('car', 'red'), ('truck, brown')]` is not.

So how do we identify unique columns or sets of columns within our database? Our first thought might be to just write an algorithm to read through the data and check to see if a particular column contains duplicate values. This, however, will not be very performant because we're going to need to re-read all of the data every time we insert/update a row. This approach will simply not work for any common analytics databases, which tend to be on the scale of hundreds of *gigabytes* (GB) or *terabytes* (TB) in size.

Our next thought might be to look at our schema, i.e. our data definition language (DDL) constraints. We could just check for columns that are *primary keys* or are annotated with the *SQL UNIQUE constraint*. If you have a database that enforces these integrity constraints (i.e. that will throw an error if you try to insert duplicate values into one of these columns), then you are good to go. However, at Vertica I unfortunately had very few such guarantees. As a decision to increase performance, Vertica does not enforce the majority of these integrity constraints. For this reason, I could **not** rely upon *primary key* and *SQL UNIQUE constraints*.

There is one DDL constraint, however, I did have. Like many databases, Vertica supports an auto-incrementing column called an *identity* column. This *identity* column will definitely be unique because users are not allowed to modify it.

But, let's take a step back. Let's imagine that we did not even have this *identity* column. So our database does not enforce *primary keys* or *SQL UNIQUE constraints*, and we do not have any sort of auto-incrementing column. Can we guarantee any uniqueness at all? **Yes we can, but it depends on the query**. Let's look at how.

The first novel component of my work is how to determine uniqueness on a per-query basis, without needing to know DDL constrained uniqueness. Consider the query `SELECT DISTINCT a FROM foo;`. The result of this query is unique on the attribute `a`. Consider the query `(SELECT a, b FROM foo) UNION (SELECT a, b FROM bar);`. The result of this query is unique on the set of attributes `{a, b}`. Also consider `SELECT a, COUNT(a) FROM foo GROUP BY a;`. The result of this query is also unique on the attribute `a`.

Now, imagine that these queries are actually subqueries that feed their results into outer queries. In the simplest case, imagine something like `SELECT a FROM (SELECT DISTINCT a FROM foo)`. Here it is clear that in the outer query, `a` will be unique. But how is that uniqueness propagated through more complicated events like joins?

Consider two unique columns in separate tables between which we would like to perform an inner join. The query might look something like `SELECT foo.a, bar.c FROM foo INNER JOIN bar ON foo.b=bar.b;`. In this case, let's assume that we have already determined that `foo.a` and `bar.b` are unique (i.e. there is an enforced DDL constraint on them, or they are the results of subqueries using operators like `SELECT DISTINCT`).

If both sides of the join are unique, then this inner join will preserve uniqueness. Why? Well, the only way that an inner join *won't* preserve uniqueness is if a row from one side matches with multiple rows from the other side of the join. But since both sides of the join are unique, a row can only match with at most one row from the other side. If each row can only match with at most one row from the other side, either each row shows up one or zero times in our result. Since each of these rows were unique on these columns before, uniqueness on those columns is preserved.

There are other variations of joins that preserve uniqueness as well, such as certain semi-joins and non-null preserving outer-joins. But, the idea is essentially the same as inner joins, so to keep things simple we will focus on inner joins.

Now that we can determine some forms of uniqueness through clauses like `SELECT DISTINCT` or `UNION` or `GROUP BY`, and we can see how this uniqueness propagates through joins, let's consider a slightly more complicated situation. Consider this nested set of queries.

```
SELECT baz.a
FROM (
  SELECT bar.a
  FROM
  (
    SELECT DISTINCT foo.a
    FROM foo;
  ) foo
  INNER JOIN
  (
    SELECT DISTINCT bar.a
    FROM bar;
  ) bar
) baz
```

Let's try to analyze how the uniqueness is propagated. Starting at the innermost parts, we see that `foo.a` and `bar.a` are unique because we are using a `SELECT DISTINCT` operator. We are then performing an inner join on these attributes, which means the result is still unique on these attributes. Finally, we are just renaming our result as `baz` then selecting `baz.a`. The end result of this analysis is that we can see at each stage of our query which columns are unique, and that in this case, the uniqueness propagates all the way upwards to `baz.a`.

This might not seem particularly revolutionary yet, but knowing which columns are unique during which parts of the query is absolutely crucial for applying the optimizations I will describe shortly.

It is also worth noting that uniqueness preserved at the outermost layers is only part of what we care about. It is actually equally important to see how uniqueness is preserved in the inner layers of the query as well (i.e. `bar.a` after the join). Our optimizations are going to be applied recursively to all layers of our query, not just the outermost ones, so we may be able to optimize the inner parts of a query from knowing this uniqueness.

It takes a bit of work, but ultimately we can take an arbitrary query and annotate all the places where we have unique columns. Now, let's figure out what we can do with that uniqueness.

## Optimizing from uniqueness

During my internship, I discovered four optimizations that leverage uniqueness of columns. I suspect that my list is far from exhaustive, and that additional research could expand upon this quite significantly.

I will now describe the four optimizations I implemented.

### Order by optimization
Let's say you want to sort the results of a query. Moreover, let's say you want to sort by multiple attributes. If one of these attributes is unique, then you need not sort past it.

As an example, take the query `SELECT id, first_name, last_name, salary FROM employees ORDER BY last_name, id, salary;`. If the `id` column is unique, then the database need not sort on the `salary` column. This is easy to see because sorting on multiple attributes means that when you have rows with duplicate values of your first sort key, you defer to the next sort key (i.e. two people with the same last name are ordered by id in this case). But, if you sort on a unique column, there won't be any duplicate entries. Therefore, you can conclude that no additional sorting is necessary on any additional columns.

This idea extends to sets of columns as well. Consider the query `SELECT first_name, last_name, age, salary FROM employees ORDER BY first_name, last_name, age`. If we determined that the table is unique on the set of columns `{first_name, last_name}`, then we would not need to sort on the `age` column at all.

Thus, through leveraging our knowledge about which columns are unique, we are able to prune certain unnecessary sorting operations, which can be quite expensive.

### Group by optimization
The group by optimization is very similar. If we are grouping on multiple attributes, and some of them are unique, we do not need to group past those attributes.

Consider the query `SELECT first_name, last_name, age, AVG(salary) FROM employees GROUP BY first_name, last_name, age`. If we assume once again that the table is unique on the set of columns `{first_name, last_name}`, then we need not perform any grouping on the `age` column at all.

Once again, this is because grouping on multiple attributes deals with the situation where there are duplicates within our first grouping attribute. But if that first attribute is unique, there will not be any duplicates, In this case, there is no reason to group on any attributes past the first (i.e. any columns to its right in the query).

We can see that just like the *order by optimization*, this applies to both individual unique columns and unique sets of columns.

### Left/Right outer join optimization
This optimization is a little bit different than the previous two. Consider the following query with a `LEFT OUTER JOIN` (note that everything will be symmetrically the same for `RIGHT OUTER JOIN` as well).

```
SELECT e.name, e.car_make, e.car_model, m.annual_revenue FROM employees e LEFT OUTER JOIN manufacturer m ON e.car_make=m.make;
```

There is quite a bit happening here so let's break it down. We are selecting employees' names, the make/model of their cars, and the annual salary of the company that manufacturers the car. In this situation, assume that the `m.make` column is unique within the `manufacturer` table. We will refer to the `employee` table as the *preserving* side of the join because it is the left side of the `LEFT OUTER JOIN`. Therefore, we will refer to the `manufacturer` table as the *non-preserving* side of the join.

Let *R* denote the number of rows in the result of the query and *E* denote the number of rows in the `employee` table. and In this situation, we know two interesting things about *R*.

1) Because it is a `LEFT OUTER JOIN`, the query result will have at least as many rows as the preserving side of the join (i.e. the `employee` table). We can express this more concisely as: `R >= E`.

2) Because the join key on the non-preserving side of the join (i.e. `m.make`) is unique, each row from the preserving side of the join (i.e. `e.car_make`) will match with at most one row. Thus, the query result will have at most as many rows as the preserving side of the join (i.e. the `employee` table). We can express this more concisely as `R <= E`.

But, if `R >= E` and `R <= E`, then `R = E`.

To reiterate, this means that if we perform a left/right outer join where the join key of the non-preserving side of the join is unique, then the result of the query has the same cardinality as the preserving-side of the join.

This is an extremely useful piece of information. Cardinality estimations are essential for the query optimizer to pick the best query execution plan. But there is another potential insight we can extract from this information.

Consider this query now:
```
SELECT e.name, e.car_make, e.car_model FROM employees e LEFT OUTER JOIN manufacturer m ON e.car_make=m.make;
```

This query is almost identical to the query from before. The only difference is that we are no longer selecting `m.annual_revenue`. But, this means we are actually not selecting any attributes from the non-preserving side of the join (i.e. from `manufacturer`). If the cardinality of the query is not altered, and we are not selecting any attributes from `manufacturer`, then **we do not need to perform the join at all**. In fact, the above query is exactly equivalent to:

```
SELECT e.name, e.car_make, e.car_model FROM employees;
```

Not only is this simpler to look at, it is drastically more efficient for the database to execute. Joins are some of the most costly operations, so being able to filter these out where unnecessary is huge.

Keep in mind that if we did not know that `m.make` was unique, we would not be able to prune out this join. Even if we were not referencing the `manufacturer` table, the cardinality of our result would be different if `m.make` were not unique, thus we would still need to perform the join.

While these query examples may seem a bit contrived, the rise in popularity of business intelligence tools like Tableau often results in computer-generated SQL queries that contain these sorts of situations. Speaking from experience with examining queries from clients of Vertica, this situation occurred far more frequently than I would have expected.

Thus, having the optimizer being able to properly remove unnecessary joins is huge for performance.

### Outer-uniqueness preserving join optimization
This optimization is fairly similar to the *left/right outer join optimization*. Let us define a column as preserved by a join if all rows from that column must show up at least once in the result. The optimization lets us prune joins within queries that only reference columns on the preserved side of the join. These queries, however, must also have some guarantee of uniqueness on those preserved columns (i.e. a `SELECT DISTINCT` or `GROUP BY` clause). Let us consider an example.

Other than *left/right/full outer joins*, another preserving join is a *cross join* (more commonly thought of as a cross product). Consider the query: `SELECT employee.name FROM employee, manufacturer GROUP BY employee.name;`. In this case, because the outer result of the join is going to be unique on `employee.name`, `employee.name` is preserved by the *cross-join*, and we do not reference the `manufacturer` table, we need not perform the cross join at all.

This makes sense because preserving joins can add rows to our result, but they can not remove any. So, if all the join does is duplicate rows, and then our result will be filtered to be unique anyways, there is no need to perform the join at all.

Just like inner joins, cross joins are quite costly. Being able to prune these can drastically improve query performance.

## Conclusion
Let's summarize how these optimizations work.

First, we determine where uniqueness exists in our query. Next, we leverage that uniqueness to remove unnecessary query operations.

We analyze all levels of the query. We simply apply our logic recursively and can handle arbitrarily nested queries.

Much of the novelty of this idea is in how we consider uniqueness. We consider uniqueness not as a per-database-instance classification, but as a per-query classification. Moreover, we consider uniqueness even when the database itself does not enforce any integrity constraints (like primary keys) that might otherwise give easier knowledge of unique columns.

What started as a simple bug fix turned into a pretty fantastic summer long journey. It was a *unique* experience to say the least.

[patent]: https://www.google.com/patents/WO2016159936A1?cl=en
