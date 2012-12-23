"use strict";

var address = window.location.href.split("#")[0]

module.exports = function persist(editor) {
  /**
  Takes editor and enables persists changes to the buffer across the sessions.
  **/

  editor.setValue(localStorage[address] || "")
  editor.on("change", function() {
    localStorage[address] = editor.getValue()
  })
}
