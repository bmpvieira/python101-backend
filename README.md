# How to print slides
## Hacked way
1. Disable Deck.js scale
	In: views/tmpl/base.dust
	Replace: $(function() {$.deck('.slide');
	With: $(function() {$.deck('.slide'); $.deck('disableScale');});
2. Disable all font color black and :after :before none (optional)
	In: public/pkg/deck.js/deck.core.css
	Comment: @media print { * {}}
3. Fix CodeMirror2 box size
	In: public/css/style.css
	AddTo: .deck-container .CodeMirror {}
	Line: font-size: 18pt !important;

## Correct way
1. Implement everything in a print button
2. Avoid using CSS transform, footer after, print only classes, etc 
in favor of something like @page { @top-left {content: element(footer)}}
3. Disable Deck.js scale and resize CodeMirror2 font before print with button 