---
layout: post
title: "Optimizing queries by leveraging uniqueness"
date: 2017-01-15
categories: query-optimization database patent sql vertica
---

[![Image of word 'Patented'](/assets/images/patented.png)][patent]

Over the summer of 2014, I worked on the query optimizer at Vertica, which is an analytics database. The query optimizer is responsible for making queries execute faster. During my internship, I designed, implemented, and [patented][patent] several novel query optimization techniques. These techniques identify and leverage the uniqueness of attributes within the database to cut out certain expensive operations, like sorts, groups, and joins. Let's see how this all works.

## Defining and identifying uniqueness
I'll first define uniqueness and talk about how we can determine which columns are unique.

A relational database consists of *tables* (or relations), and each relation consists of *columns* (or attributes). We call a column unique if it contains no duplicate values. That is to say that a column containing the values `['cat', 'dog', 'pig']` is unique while a column containing the values `['cat', 'dog', 'cat']` is **not** unique. We call a set of columns unique if there are no two rows in the set that have the same values for all columns. As an example `[('car', 'red'), ('car', 'blue'), ('truck, brown')]` is unique, while `[('car', 'red'), ('car', 'red'), ('truck, brown')]` is not.

So how do we identify unique columns or sets of columns within our database? Our first thought might be to just write an algorithm to read through the data and check to see if a particular column contains duplicate values. This, however, will not be very performant because we're going to need to re-read all of the data every time we insert/update a row. This approach will simply not work with the majority of Vertica database instances, which tend to be on the scale of hundreds of *gigabytes* (GB) or *terabytes* (TB) in size.

Our next thought might be to look at our schema, i.e. our data definition language (DDL) constraints. We could just check for columns that are *primary keys* or are annotated with the *SQL unique constraint*. If you have a database that enforces these integrity constraints (i.e. that will throw an error if you try to insert duplicate values into one of these columns), then you are good to go. However, to increase performance, Vertica does not enforce any of these integrity constraints. For this reason, we cannot rely upon these DDL constraints.

There is one DDL constraint, however, that we can trust. Vertica supports an auto-incrementing column called an *identity* column. This column will definitely be unique because users are not allowed to modify it.

But there is another side to this. We can also determine uniqueness on a per-query, rather than per-table basis. Consider the query `SELECT DISTINCT a FROM foo;`. The result of this query is unique on the attribute `a`. Consider the query `(SELECT a, b FROM foo) UNION (SELECT a, b FROM bar);`. The result of this query is unique on the set of attributes `{a, b}`. Also consider `SELECT a, COUNT(a) FROM foo GROUP BY a;`. The result of this query is also unique on the attribute `a`.

Now, suppose we have two unique columns in separate tables and we perform an inner join between them. The query might look something like `SELECT foo.a, bar.c FROM foo INNER JOIN bar ON foo.b=bar.b;`. In this case, let's assume that we have already determined that `foo.a` and `bar.b` are unique (i.e. they are both *identity* columns, or are the results of subqueries using operators like `SELECT DISTINCT`). If both sides are unique, then this inner join will preserve uniqueness. Why? Well, the only way that an inner join *won't* preserve uniqueness is if a row from one side matches with multiple rows from the other side of the join. But since both sides of the join are unique, a row can only match with at most one row from the other side.

There are other variations of joins that preserve uniqueness as well, such as certain semi-joins and non-null preserving outer-joins. But the idea is essentially the same as inner joins.

It is worth noting that all of these techniques can be applied even in very complicated situations. Imagine a complicated nested query situation like this:

```
SELECT baz.a
FROM (
    SELECT bar.a
    FROM (
      SELECT DISTINCT foo.a
      FROM foo;
  ) bar
) baz
```
Here, we can see that the uniqueness of the attribute `a` propagates upwards all the way from the inner most `SELECT DISTINCT` to the outer `SELECT` statement. This can of course get more complicated with more layers of nesting and more complex operators like joins. But, we can just recursively apply the heuristics we defined above to determine the uniqueness at the top level of the query. We start by diving down and determining uniqueness at the innermost levels, then traversing the query and seeing (either through joins or other operators), how that uniqueness is preserved.

It takes a bit of work, but ultimately we can take an arbitrary query and annotate all the places where we have unique columns. Now, let's figure out what we can do with that uniqueness.

## Optimizing off of uniqueness

[patent]: https://www.google.com/patents/WO2016159936A1?cl=en
