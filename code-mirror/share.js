"use strict";

/**
Takes editor and enables persists changes to the buffer across the sessions.
**/
function share(editor) {
  var shared = window.location.hash.substr(1)
  if (shared) editor.setValue(shared)
  editor.on("change", function() {
    location.hash = encodeURIComponent(editor.getValue())
  })
}

module.exports = share
