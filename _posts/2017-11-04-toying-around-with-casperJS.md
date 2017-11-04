---
layout: post
title: Toying around with CasperJS :D
description: "Solution for NBS (neighbour-bandwidth-suc^er) problem"
author: kingspp
category: tricks
tags: js automation casperjs
finished: false
---

I have always faced the bandwidth issues during last week of the month - Similar to month-end salary issues :D. Once you go 10+Mbps, you can never use anything that has `kilo` in it, it always has to be **MEGA**!!. I hate pixels, only when it comes to streaming a video online - big ass televisions are even worse. Sshhh, Enough of whining, lets dive down to the answer -

#### Step 1: [Install CasperJS](http://docs.casperjs.org/en/latest/installation.html)

#### Step 2: Tiny piece of Code
```javascript
// Create a casper object and define its characteristics - Basics, copy without regrets.. 
var casper = require('casper').create({
    verbose: true,
    logLevel: 'debug',
    pageSettings: {
         loadImages:  false,         // The WebPage instance used by Casper will
         loadPlugins: false,         // use these settings
         userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4'
    }
});

// Define the router IP - Do not copy!! It will not work!! :P
casper.start('http://192.168.0.1');

// Everybody has their username and password - Just fill up the quotes - Check form name for your router [Hint - Use Inspect Element] 
casper.then(function() {
    this.echo('First Page: ' + this.getTitle());
    this.fill('form[name="test"]', {
        username: '',
        password:  ''
    }, true);

});

// At this stage you are prety much done and might have logged into your router settings - 
This part needs major refactoring, depending on the type of the router
casper.then(function(){
  this.open('http://192.168.0.1/ipqostc_gen_ap.htm').then(function() {

    this.then(function() {
        this.fill('form[name="qostc"]', {
            downtotal: ''+casper.cli.get(0)+''
        }, false);
    this.echo(this.getFormValues('form[name="qostc"]').downtotal);
    this.evaluate(function() {document.querySelector('input[type="submit"][name="applyItflimit"]').click()});
    // this.click('input[type="submit"][name="applyItflimit"]');
    });
});
});
casper.run();

// Save this script as router_hack.js
```

#### Step 3: Run - `casperjs router_hack.js 128`
The above command sets both upload and download limts to 128kbps
