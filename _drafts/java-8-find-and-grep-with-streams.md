---
layout: post
title: "Writing find and grep commands in Java 8 with streams"
date: 2015-07-21
categories: tutorial java8
---

## Intro
We're going to write our very own `find` and `grep` commands using Java 8 streams. This turns out to be a very intuitive exercise, with each command taking no more than a few lines of code.

## Pre-reqs
This post assumes you have some familiarity with Java 8 streams. We're actually going to review `find` and `grep`, so it's ok if you do not know those.

## What is grep?
[According to wikipedia][grep-wiki], "grep is a command-line utility for searching plain-text data sets for lines matching a regular expression." And if you were wondering, grep stands for **g**lobally search a **r**egular **e**xpression and **print**.

For example,

{% highlight bash %}
grep public MyJavaClass.java 
{% endhighlight %}

might yield

{%highlight bash %}
public class MyJavaClass {
public static void main(String[] args) {
public static final int MY_INT_CONST = 3;
...
{%endhighlight%}

As input, `grep` takes a pattern and some text to search (maybe a file, maybe the output of another program). As output, it then prints out all lines of the input text that match the pattern.

Not so bad, right?

## What is find?
[According to wikipedia][find-wiki], "find is a command-line utility that searches through one or more directory trees of a file system, locates files based on some user-specified criteria and applies a user-specified action on each matched file."

So if we wanted to find all the markdown files in the kahlil.me directory, we could run:

{% highlight bash %}
find . -name "\*.md"
{% endhighlight %}

and we would get as a result:

{% highlight bash %}
./_posts/2015-07-18-hello-world.md
./_posts/2015-07-18-java-8-stream-sql.md
./_posts/2015-07-21-java-8-find-and-grep-with-streams.md
./about.md
./archive.md
./LICENSE.md
./README.md
{% endhighlight %}



To keep things simple, our `find` won't be able to perform any user-specified actions on the files it finds. Instead, it will simply take a starting directory and a pattern, then print out the full paths of any files that match the pattern and are somewhere in that directory.

[grep-wiki]: https://en.wikipedia.org/wiki/Grep
[find-wiki]: https://en.wikipedia.org/wiki/Find

