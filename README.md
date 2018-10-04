Python 101: for biologists, by biologists
=========================================

Backend for course given in 2012 at the University of Lisbon.

* [Slides example (day 2 of the course)](http://bmpvieira.com/py101) - Code examples are interactive, try to modify and shift-enter.
* [Poster](https://photos.app.goo.gl/sVADvYv1KgeS3P4a7) - made in Inkscape

Purpose
-------
Get markdown files from Dropbox and/or Github and render them to HTML5 presentations with interactive Python code examples.

[Course repo](https://github.com/bmpvieira/python101)

Technologies
------------
* Node.js
* Dust.js
* [Deck.js](http://imakewebthings.com/deck.js/)
* Markdown
* [CodeMirror2](http://codemirror.net/)
* [Skulpt](skulpt.org)

How to print slides
-------------------
### Hacked way
1. Disable Deck.js scale
  In: views/tmpl/base.dust
  Replace: $(function() {$.deck('.slide');
  With: $(function() {$.deck('.slide'); $.deck('disableScale');});
2. Disable all font color black (for syntax higlight) and :after :before none (optional)
  In: public/pkg/deck.js/deck.core.css
  Comment: @media print { * {}}
3. Fix CodeMirror2 box size
  In: public/css/style.css
  AddTo: .deck-container .CodeMirror {}
  Line: font-size: 18pt !important;

### Correct way (TODO)
1. Implement everything in a print button
2. Avoid using CSS transform, footer after, print only classes, etc 
in favor of something like @page { @top-left {content: element(footer)}}
3. Disable Deck.js scale and resize CodeMirror2 font before print with button

Copyright
---------
© 2012 Bruno Vieira
