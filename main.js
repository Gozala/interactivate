"use strict";

var Editor = require("./core")
var persist = require("./code-mirror/persist")
var share = require("./code-mirror/share")
var server = require("./server")

var editor = Editor(document.body, {
  value: document.getElementById("intro").textContent.substr(1),
  electricChars: true,
  autofocus: true,
  theme: "solarized dark",
  mode: "javascript",
  extraKeys: {
    "Tab": function indent(editor) {
      if (!editor.getOption("indentWithTabs")) {
        var size = editor.getOption("indentUnit")
        var indentation = Array(size + 1).join(" ")
        editor.replaceSelection(indentation, "end")
      }
    }
  }
})

// Start an evaluation server
server(editor)

// Enable persistence of the editor buffer.
persist(editor)
// Enable sharing
share(editor)

global.editor = editor
