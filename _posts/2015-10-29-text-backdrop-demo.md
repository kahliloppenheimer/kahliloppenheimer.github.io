---
layout: post
title: "Text-backdrop: contextualize any text"
categories: projects nodejs npm nlp
banner_image: graphics_banner.jpeg
---
# Intro
Text-backdrop is a tool I developed to aggregate all relevant information about a body of text.

It uses natural language processing techniques to extract relevant information of the text, then it *asynchronously* queries several APIs (wikipedia, Bing news/images, etc.) to aggregate and return all contextually relevant information in a JSON document.

# Try it out
{% include backdrop-demo.html %}

# Where to find text-backdrop
Text-backdrop is available [on npm][npm-page], so you only need to `npm install text-backdrop` and you have it! It's also entirely open source, and can be found [on github][github-repo].


[github-repo]: https://github.com/kahliloppenheimer/text-backdrop
[npm-page]: https://www.npmjs.com/package/text-backdrop
