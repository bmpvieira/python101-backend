// CodeMirror2 editor initializer
function editorInit(idnum) {
    // Init code folding helper for CodeMirror2
    var foldFunc = CodeMirror.newFoldFunction(CodeMirror.indentRangeFinder);
    // Get code textarea id
    var codetextarea = document.getElementById('code' + idnum);
    // Init editor
    var editor = CodeMirror.fromTextArea(codetextarea, {
        mode: { 
            name: "python", 
            version: 2, 
            singleLineStringErrors: false 
        }
        , lineNumbers: true 
        , lineWrapping: true 
        , indentUnit: 4
        , theme: "rubyblue"
        , readOnly: false
        , onGutterClick: function(cm, line) {
            var cmOrigHeight = $(cm.getScrollerElement()).height();
            foldFunc(cm, line);
            cm.refresh();
            checkEditorHeight(cm, cmOrigHeight);
        }
        , onKeyEvent: function(cm, key) {
            if((key.keyCode == 13) || (key.keyCode == 8)) {
                var cmOrigHeight = $(cm.getScrollerElement()).height();
                checkEditorHeight(cm, cmOrigHeight);
            };
        }
        //, keyMap: "vim"
        , extraKeys: {
            "Shift-Enter": function(cm) {
                runit(cm);
            },
            "Ctrl-q": function(cm) {
                foldFunc_html(cm, cm.getCursor().line);
            },
            "F11": function() {
              var scroller = editor.getScrollerElement();
              if (scroller.className.search(/\bCodeMirror-fullscreen\b/) === -1) {
                scroller.className += " CodeMirror-fullscreen";
                scroller.style.height = "100%";
                scroller.style.width = "100%";
                editor.refresh();
              } else {
                scroller.className = scroller.className.replace(" CodeMirror-fullscreen", "");
                scroller.style.height = '';
                scroller.style.width = '';
                editor.refresh();
              }
            },
            "Esc": function() {
              var scroller = editor.getScrollerElement();
              if (scroller.className.search(/\bCodeMirror-fullscreen\b/) !== -1) {
                scroller.className = scroller.className.replace(" CodeMirror-fullscreen", "");
                scroller.style.height = '';
                scroller.style.width = '';
                editor.refresh();
              }
            }
        }
        // fix for python.js bug with 1st lines, see editorFixes()
        , firstLineNumber: 0
        // current line highlight
        , onCursorActivity: function(cm) {
            cm.setLineClass(cm.hlLine, null, null);
            cm.hlLine = cm.setLineClass(cm.getCursor().line, null, "activeline");
        }
    });
    // Set idnum for reference in skulpt
    editor.idnum = idnum;
    // Set default highlight line
    editor.hlLine = editor.setLineClass(0, "activeline");
    // Replace slashes from escaped char or comments
    var value = editor.getValue().replace(/\\/g, "");
    editor.setValue(value);
    // BUG workaround: CodeMirror2's python.js mode crashes with some first lines (like assigments), so mdfilter adds a hashbang that is hidden here.
    editor.hideLine(0);
    // Run code to set code output size
    runit(editor, idnum);
    // Fold editor
    var lines = value.split('\n');
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].match(/.*\#folded$/) != null) {
            foldFunc(editor, i);
        };
    };
    return editor
}

// Skulpt output formating
function outf(text) {
    var cm = currentcm;
    var output = document.getElementById("codeout"+cm.idnum);
    text = text.replace(/</g, '&lt;');
    output.innerHTML = output.innerHTML + text;
}

// Skulpt run code from CodeMirror2 editor
function runit(cm) {
    currentcm = cm;
    var code = cm.getValue();
    var output = document.getElementById("codeout"+cm.idnum);
    output.innerHTML = '';
    Sk.configure({output:outf});
    try {
        eval(Sk.importMainWithBody("<stdin>", false, code));
    } catch (e) {
        output.innerHTML = e;
    }
}

// Check if CodeMirror2 autoresize is out of page and needs scroll
function checkEditorHeight(cm, cmOrigHeight) {
    $('.CodeMirror-scroll').css({'overflow-y': 'hidden'});
    $(cm.getScrollerElement()).height('auto');
    cm.refresh();
    var windowHeight = $(window).height();
    var slideHeight = $('.deck-current').height();
    if (slideHeight > windowHeight) {
        $('.CodeMirror-scroll').css({'overflow-y': 'scroll'});
        $(cm.getScrollerElement()).height(cmOrigHeight);
        cm.refresh();
    }
};