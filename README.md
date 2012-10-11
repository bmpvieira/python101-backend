Python 101: for biologists, by biologists
=========================================
The code of this project is not yet public, please do not share.
Some commits were made under pressure and/or lack of sleep (added to the fact that I knew Python but not Javascript), so some code might not make sense or needs some serious cleanup! (-_-;)

Purpose
-------
Get markdown files from Dropbox and/or Github and render them to HTML5 presentations with interactive Python code examples.

[Slides example](http://bmpvieira.com/py101)

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