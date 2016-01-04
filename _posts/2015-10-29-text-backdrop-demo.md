---
layout: post
title: "Text-backdrop: contextualize any text"
categories: projects nodejs npm nlp
banner_image: graphics_banner.jpeg
---
[Text-backdrop][github-repo] is a tool I developed as my contribution to to [Well Versed][hackdart], a hackathon project that **won third place** at Hack Dartmouth 2015. Well Versed is a browser extension that, when activated, aggregates all relevant information about the topic of the current web-page and displays it all in a sidebar. Thus, anyone can become *well versed* about any topic they are perusing--politics, science, etc.

Text-backdrop is the part of the project that analyzes the given source text and gathers additional information. It uses natural language processing techniques to extract relevant information of the text, then it *asynchronously* queries several APIs (wikipedia, Bing news/images, etc.) to aggregate and return all contextually relevant information in a single JSON document.

# Try it out
{% include backdrop-demo.html %}

# Where to find text-backdrop
Text-backdrop is available [on npm][npm-page], so you only need to `npm install text-backdrop` and you have it! It's also entirely open source, and can be found [on github][github-repo].


[github-repo]: https://github.com/kahliloppenheimer/text-backdrop
[npm-page]: https://www.npmjs.com/package/text-backdrop
[hackdart]: http://devpost.com/software/well-versed
