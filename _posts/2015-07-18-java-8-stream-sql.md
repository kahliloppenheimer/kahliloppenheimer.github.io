---
layout: post
title: "SQL on Java Collections with streams"
date: 2015-07-18
categories: guide java
banner_image: xkcd_streams.png
---

## Intro
We're going to look at an example of how to represent SQL queries over java collections using streams from Java 8. Pretty cool right?

## Pre-reqs
This post assumes you have some familiarty with basic SQL and Java 8 lambda expressions and streams.

## Getting our hands dirty
Let's say we have a list of key-value pairs defined to mark the number of bugs that each team member has squashed. Think of it like a map that can contain duplicate key values. We can define it and initialize it as such:

{% highlight java %}
// Lets use a stream in an SQL-esque kind of way
        List<SimpleEntry<String, Integer>> bugTable = 
new ArrayList<SimpleEntry<String, Integer>>();
        bugTable.add(new SimpleEntry<>("Arthur", 2));
        bugTable.add(new SimpleEntry<>("Kahlil", 8));
        bugTable.add(new SimpleEntry<>("Tom", 5));
        bugTable.add(new SimpleEntry<>("Gyula", 20));
        bugTable.add(new SimpleEntry<>("Arthur", 25));
        bugTable.add(new SimpleEntry<>("Jeff", 17));
        bugTable.add(new SimpleEntry<>("Jeff", 18));
        bugTable.add(new SimpleEntry<>("Tom", 15));
{% endhighlight %}

Now, let's say we want to retrieve the names of the team members and the total number of bugs they have squashed. But let's add two constraints:

1. We only sum up entries that have less than 25 bugs squashed, because 25 or higher seems suspiciously high.

2. We only report team member names with a total of 5 or more bugs squashed.

We can express this fairly easily in SQL:

{% highlight sql %}
SELECT name, SUM(bugs_squashed)
FROM bugTable
WHERE bugs_squashed < 25
GROUP BY bugs_squashed
HAVING bugs_squashed >= 5;
{% endhighlight %}

We can express this same logic with Java 8 streams.

{% highlight java %}
bugTable.stream()
.filter(se -> se.getValue() < 25)
.collect(Collectors.groupingBy(
        SimpleEntry<String, Integer>::getKey,
        Collectors.summingInt(SimpleEntry<String, Integer>::getValue)))
.entrySet().stream()
.filter(entry -> entry.getValue() >= 5)
.forEach(System.out::println);
{% endhighlight %}

You're probably either thinking that Java 8 streams are amazing, or that you have no idea why anyone would want to use them. Either way, we'll now go into more details about what's actually happening.

## Detailed explanation
Let's break it down.

{% highlight java %}
bugTable.stream()
.filter(se -> se.getValue() < 25)
{% endhighlight %}

We create a stream from our list of pairs. Then, we filter out all the pairs that have 25 or more bugs squashed.

{% highlight java %}
.collect(collectors.groupingby(
        simpleentry<string, integer>::getkey,
        collectors.summingint(simpleentry<string, integer>::getvalue)))
.entryset().stream()
{% endhighlight %}

While seemingly tricky, this isn't so bad if we look at it piece by piece.

First, `collect` lets us store our stream back into a Java collections object. By passing in `Collectors.groupingBy`, we are storing our stream into a map, where we smoosh all pairs with common keys into aggregated entries in our map.

{% highlight java %}
        SimpleEntry<String, Integer>::getKey,
{% endhighlight %}

This first argument to `Collectors.groupingBy` is a function (via Java 8 named function syntax) that defines the grouping key for our final aggregated hash-map as the result of calling `getKey` on each entry in our stream.

{% highlight java %}
        collectors.summingint(simpleentry<string, integer>::getvalue)))
{% endhighlight %}

This second argument to `Collectors.groupingBy` describes how to aggregate each set of entries in our map that has the same key.

We are saying that we want to add up the number of bugs squashed. And we pass the function `SimpleEntry<String, Integer>::getValue` to say that the values of our key-value pairs are what we want to sum up.

{% highlight java %}
.entryset().stream()
{% endhighlight %}

Finally, this takes our aggregate result map, and turns it back into a stream for further processing.

Admittedly, it's unfortunate that we have to store our data into a map, then read it back into a stream mid-way through our calculation, but that's a necessary limitation of using `.collect()`.

{% highlight java %}
.filter(entry -> entry.getValue() >= 5)
.forEach(System.out::println);
{% endhighlight %}

The last step straightforward. It filters out any aggregated entries that have less than 5 squashed bugs, then prints each remaining entry out.

## Conclusion
Do not worry if some of the details (like collectors) seem confusing. The takeaway here is that Java 8 streams are extremely powerful and versatile.

Feel free to check out the entire example [on github][java-8-sql-code].

[java-8-sql-code]: https://github.com/kahliloppenheimer/Java8StreamDemo/blob/master/StreamPresentation/src/SQL.java
