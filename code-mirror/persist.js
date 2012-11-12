"use strict";

module.exports = function persist(editor) {
  /**
  Takes editor and enables persists changes to the buffer across the sessions.
  **/

  editor.setValue(localStorage.buffer || "")
  editor.on("change", function() {
    localStorage.buffer = editor.getValue()
  })
}
