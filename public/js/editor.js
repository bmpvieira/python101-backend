// CodeMirror2 editor generator
function geneditor(idnum) {
  var id = document.getElementById('code' + idnum);
  return CodeMirror.fromTextArea(id, {
    mode: { 
      name: "python", 
      version: 2, 
      singleLineStringErrors: false 
    },
    lineNumbers: true, 
    lineWrapping: true, 
    indentUnit: 4,
    theme: "ambiance",
    readOnly: false,
    //keyMap: "vim",
    extraKeys: {
      "Shift-Enter": function(cm) {
        runit(cm);
      }
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