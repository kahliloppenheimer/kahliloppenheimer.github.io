---
layout: post
title: "Writing grep with Java 8 streams"
date: 2015-07-22
categories: tutorial java8
banner_image: grep.png
---

## Intro
We're going to write our very own `grep` command using Java 8 streams. By the end, we will be able to run it on the command line, just like the normal unix grep program.

## Pre-reqs
This post assumes you have some familiarity with Java 8 streams and a basic understanding of regular expressions. We're actually going to review `grep`, so it's ok if you do not yet know it.

## What is grep?
[According to wikipedia][grep-wiki], "grep is a command-line utility for searching plain-text data sets for lines matching a regular expression." And if you were wondering, grep stands for **g**lobally search a **r**egular **e**xpression and **print**.

For example,

{% highlight bash %}
grep .*public.* MyJavaClass.java 
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

## Grep implementation

### The `grep` method
This is where we will write the bulk of the logic of our program. With streams, the method body is just one line, styled across two. (_note: I omitted the_ `throws` _clause to keep the code clean_).

{% highlight java %}

public static Stream<String> grep (String pattern, String fileName) {
    return Files.lines(getPath(fileName))
                .filter(line -> line.matches(pattern));
}

{% endhighlight %}

Fortunately, Java 8 streams shipped with some pretty sweet I/O functions, like `java.nio.Files::lines()`. This function takes a file name and returns a stream of the lines of that file.

All we need to do after that is filter those lines by matching on our pattern (built into Java.lang.String), and we're done!

### The `getPath` method
I also called a `getPath` function, which is simply defined as:

{% highlight java %}
public static Path getPath(String fileName) throws IOException {
    String homeDir = System.getProperty("user.home");
    return Paths.get(fileName.replaceFirst("~", homeDir));
}
{% endhighlight %}

This lets people pass in paths like `~/Desktop`, where `~` makes the path relative to your home directory. It also constructs and returns a `java.nio.path` object, which `java.nio.Files::lines` requires.

### The `main` method
Finally, we can give our Grep class a main method so that we can call it from the command line.

{% highlight java %}

public static void main(String[] args) throws IOException {
    grep(args[0], args[1]).forEach(System.out::println);
}

{% endhighlight %}

### The whole program
Putting it all back together, our grep program in its entirety looks like:

{% highlight java %}

public class Grep {

    public static void main(String[] args) throws IOException {
        grep(args[0], args[1]).forEach(System.out::println);
    }

    public static Path getPath(String fileName) throws IOException {
        String homeDir = System.getProperty("user.home");
        return Paths.get(fileName.replaceFirst("~", homeDir));
    }

    public static Stream<String> grep(String pattern, String fileName)
            throws IOException {
        return Files.lines(getPath(fileName))
                    .filter(line -> line.matches(pattern));
    }

}

{% endhighlight %}

## Running our grep program

Now, we can find all the lines that have the word 'public' in Grep.java, using Grep.java.

{% highlight bash %}

java Grep ".*public.*" Grep.java

{% endhighlight %}

and see as output:

{% highlight bash %}

public class Grep {
    public static void main(String[] args) throws IOException {
    public static Path getPath(String fileName) throws IOException {
    public static Stream<String> grep(String pattern, String fileName)

{% endhighlight %}

[grep-wiki]: https://en.wikipedia.org/wiki/Grep
[find-wiki]: https://en.wikipedia.org/wiki/Find

