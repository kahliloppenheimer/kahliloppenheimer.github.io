---
layout: post
title: "Ray Tracing in Java"
date: 2015-09-16
categories: projects java graphics
banner_image: graphics_banner.jpeg
---
# Preamble
I'm going to talk about what a ray tracer is and how to implement some cool features for one. I'm not going to talk about any of the math (though it's basically nothing more than adding, subtracting, and taking the dot/cross products of vectors).

If you'd like to check out, play around with, or even modify the Ray Tracer I describe, feel free to [fork my current implementation on Github][ray-tracer-code]--it's completely open source!

# What is Ray Tracing?
Ray tracing is a computer graphics method for rendering images. It's very simple to explain/implement, which makes it a great choice to implement to learn about computer graphics.

Take a look at a sample image created by my current ray tracer:

![Ray Tracing Image](https://github.com/kahliloppenheimer/Java-Ray-Tracer/raw/master/demo_image.png?raw=true)

# How does it work?
Imagine you setup a camera looking through a cut-out rectangle (which we'll call a *frame*) at a real 3D scene. Ray tracing first takes the frame and divides it into a finite number of points (which we'll call *pixels*). A pixel is just the minimal unit that our computer monitors can color in. The sample image above, for instance, is 800 pixels wide and 800 pixels tall, meaning it contains 6400 pixels total.

Here is a helpful image from [Wikipedia's Ray Tracing page][ray-tracing-wiki]:

![Wikipedia Ray-Tracing image](https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Ray_trace_diagram.svg/600px-Ray_trace_diagram.svg.png)

Once we have our frame divided up, we follow a [ray][ray-definition] from the camera through each pixel in our frame and see what the ray hits in our scene. Our goal is to determine the color for each pixel based on how the ray interacts with our scene.

Maybe the ray hits nothing and goes off into space. But maybe the ray hits an object in our scene, like a sphere.

We check what the closest object the ray hits is, then check how lit the object is at that point (based on the lights in the scene). Finally, we use some fancy equations to determine the final color value at that point, and color in the pixel in our frame.

We do this for each and every pixel in our screen until the whole image is colored in. Pretty neat, right?

# Anti-aliasing
In the early stages of a ray tracer, you might notice jagged/blocky edges. This can be remedied by a technique called *anti-aliasing*.

Remember how we divided our frame up into some number of pixels? Well, our frame actually contains an infinite number of points, so our pixels are just an approximation. We can make our approximation better, however, by tracing more than ray per pixel.

Imagine that each pixel represents a small square in our frame, making the whole frame look like a grid. We can trace multiple randomly distributed rays throughout the square that our pixel represents. Then, we see what color value each returns, and average the values.

Here is an image with no anti-aliasing (i.e. 1 ray per pixel):
![aliased-image](/assets/images/aliased-image.png)

And here is the same image with 300x anti-aliasing (i.e. 300 rays per pixel):
![anti-aliased-image](https://github.com/kahliloppenheimer/Java-Ray-Tracer/raw/master/demo_image.png?raw=true)

Immediately, we can see the difference in smoothness.

# Lighting

# Shadows

# Translations

# Multi-threading

[ray-tracing-wiki]: https://en.wikipedia.org/wiki/Ray_tracing_(graphics)
[ray-tracer-code]: https://github.com/kahliloppenheimer/Java-Ray-Tracer
[ray-definition]: https://www.mathsisfun.com/definitions/ray.html
