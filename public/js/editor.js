// Init code folding helper for CodeMirror2
var foldFunc = CodeMirror.newFoldFunction(CodeMirror.indentRangeFinder);

// CodeMirror2 editor initializer
function editorInit(idnum) {
    var id = document.getElementById('code' + idnum);
    return CodeMirror.fromTextArea(id, {
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
        , onGutterClick: foldFunc
        //, keyMap: "vim"
        , extraKeys: {
            "Shift-Enter": function(cm) {
                runit(cm);
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

// CodeMirror2 editor fixes like bugs and special situations
function editorsFixes(editors) {
    for (var i in editors) {
        var editor = editors[i];
        editors[i].idnum = i; // for easier ref in skulpt
        editors[i].hlLine = editors[i].setLineClass(1, "activeline"); // 1 because first line is hidden
        // Escape comments
        value = editor.getValue().replace(/\\/g, "");
        editor.setValue(value);
        runit(editors[i], i);
        editor.refresh();
        // Bug workaround: CodeMirror2's Python mode crashes with some first lines, so adding hidden line with hash symbol solves it.        
        editor.replaceRange('#\n', {line: 0, ch: 0});
        editor.hideLine(0);
        // Code folding
        lines = value.split('\n')
        for (var i in lines) {
            if (lines[i].match(/.*\#folded$/) != null) {
                i++; // because of hideLine
                foldFunc(editor, i); 
            }
        }
    }
}
