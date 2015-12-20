---
layout: post
title: "Topical web-page classification"
date: 2015-12-20
categories: nlp classification web-page
---
Predicting the topics of web-pages based on their textual content turns is interesting and difficult. There is a lot of existing research giving [broad overviews][overview] of what has been done, as well as specifics of particular techniques(i.e. [document summarization techniques][summarization] or [page hierarchy inference][neighbors]).

I attempted to reproduce and combine many of these results from existing literature. You can [read the full paper here][full-paper].

### Setup
I worked with a subset of the [DMOZ dataset][dmoz], which is an XML document containing over 3,600,000 web pages labeled with their topic (i.e. Arts/Anime/Japanese) and a short description of the website. I used an [open-source parser][dmoz-parser] to convert the data to a nicer JSON format. Then I trained a classifier using [Mallet][mallet], an open-source language toolkit.

### Goals
My goal was to look at existing techniques in web-page classification and run them myself to see how they compared. I was also interested in comparing the difference in classification performance on web-pages and on summarized versions of the web-pages.

Working with summaries offers two key benefits:

    - More condensed and relevant language
    - Less space required to represent a web-page

I ended up evaluating the effects of varying n-gram sizes and information-gain on both web-pages and descriptions of web-pages. I also experimented with various web-page summarization techniques.

### N-gram features
The most basic way to represent a document is as a bag of words. This means you just store the words that appear in the document without preserving the order they appeared in. For example, "Apples to Apples is fun" might get converted to `{to: 1, Apples: 2, fun: 1, is:1}`.

Bag of words is simple, intuitive, and occupies a relatively small feature space (proportional to the size of your vocabulary).

An n-gram is a document featurization that chains together every n consecutive items in a sequence. For example, a 2-gram (often called bigram) representation of "Apples to Apples is fun" might be `{"Apples to": 1, "to Apples": 1, "Apples is": 1, "is fun": 1}`.

The n-gram feature space grows exponentially with n, meaning that training a classifier takes a lot longer.

In my experiments, I found **no accuracy benefit** for using n-gram analysis, though I did find that training time more than doubled.

### Information gain
Information-gain is the technique of taking highly dimensional vectors and projecting them into a lower dimensional space, while preserving as much of the information as possible. This turns out to be very useful for very sparse, high-dimensional vectors that come up frequently when modeling the features of text documents.

With information gain, I reduced training time for my classifier by over 80% while preserving near-equivalent accuracy results. This is super cool because it means you're representing the same amount of real information with less actual space.

### Web-page summarization techniques
The first technique, that vastly outperformed all others, was handwritten summaries (provided in the dataset). These achieved a maximum 79.129% accuracy across all experiments.

I compared seven automated summarization techniques to see how each performed. None exceeded the accuracy of no-summarization, but some came reasonably close (i.e. Luhn and lexical semantic analysis). The best summarization technique was still around 3% less accurate than no summarization, and around 8% less accurate than handwritten summarization.  All summarization techniques cut training time by around 80%.

### Conclusions
I found that some results stated in literature can be quite hard to reproduce. I did not manage to increase baseline accuracy via applying any of the techniques I read about. I did, however, manage to preserve equivalent accuracy, while cutting training time by several orders of magnitude.

You can [read the full paper here][full-paper].

[overview]: https://www.cs.ucf.edu/~dcm/Teaching/COT4810-Fall%202012/Literature/WebPageClassification.pdf
[summarization]: http://research.microsoft.com/pubs/67806/18.pdf
[neighbors]: http://www.cse.lehigh.edu/~brian/pubs/2006/CIKM/knowing.pdf
[full-paper]: https://github.com/kahliloppenheimer/Web-page-classification/blob/master/paper.pdf
[dmoz]: https://www.dmoz.org/
[dmoz-parser]: https://github.com/kremso/dmoz-parser
[mallet]: http://mallet.cs.umass.edu/
