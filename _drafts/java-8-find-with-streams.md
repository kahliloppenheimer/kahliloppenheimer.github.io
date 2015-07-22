---
layout: post
title: "Writing find with Java 8 streams"
date: 2015-07-23
categories: tutorial java8
banner_image: find.png
---

## Intro
In this guide, we're going to write our very own simplified `find` command using Java 8 streams. By the end we will be able to run it from the command line, just like the unix find program.

## Pre-reqs
This post assumes you at least a little familiar with Java 8 streams and a basic understanding of regular expressions. We're actually going to review `find`, so it's ok if you do not yet know it.

## What is find?
[According to wikipedia][find-wiki], "find is a command-line utility that searches through one or more directory trees of a file system, locates files based on some user-specified criteria and applies a user-specified action on each matched file."

So if we wanted to find all the markdown files in the kahlil.me directory, we could run:

{% highlight bash %}
find . -name "\*.md"
{% endhighlight %}

and we would get as a result:

{% highlight bash %}
./posts/2015-07-18-hello-world.md
./posts/2015-07-18-java-8-stream-sql.md
./posts/2015-07-21-java-8-find-and-grep-with-streams.md
./about.md
./archive.md
./LICENSE.md
./README.md
{% endhighlight %}


To keep things simple, our `find` won't be able to perform any user-specified actions on the files it finds. Instead, it will simply take a starting directory and a pattern, then print out the full paths of any files that match the pattern and are somewhere in that directory.

## Find implementation
