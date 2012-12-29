"use strict";

var interactivate = require("./interactivate")
var CodeMirror = require("./code-mirror")
var activeLine = require("./code-mirror/active-line")

function editor(target, options) {
  var instance = CodeMirror(target, options || {})
  interactivate(instance)
  activeLine(instance)
  return instance
}

module.exports = editor
