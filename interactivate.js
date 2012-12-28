"use strict";

var diff = require("diffpatcher/diff")
var patch = require("diffpatcher/patch")
var render = require("./render")
var CodeMirror = require("./code-mirror")
var shoe = require("./shoe")

CodeMirror.defaults.interactiveEnabled = true
CodeMirror.defaults.interactiveSpeed = 300
CodeMirror.defaults.interactiveSeparator = /^\/\/ \=\>[^\n]*$/m


var makeView = (function() {
  var uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAMCAYAAABBV8wuAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGpJREFUeNpi/P//PwM2wMSAA7CACEYggLKZgfgvEP8BCYAwKxALAjEPEH8B4g9MUI5IWlqayevXr9eCaCBfGGSSVnJysu/Xr1+fAx3y/9u3by9BfIb29vZCmCAMgCQZ/+NwL07nUlECIMAAMr41sxvv6oEAAAAASUVORK5CYII="
  var template = document.createElement("div")

  template.style.marginLeft = "-10px"
  template.style.padding = "0"
  template.style.position = "relative"
  template.style.marginRight = "-10px"
  template.style.whiteSpace = "normal"

  template.innerHTML = [
    "  <div class='cm-live-output-border-top'> </div>",
    "  <div class='cm-live-output-box'>",
    "    <h1 class='cm-live-output-head'>Out[0]</h1>",
    "    <pre class='cm-live-output-body'>Hello output</pre>",
    "  </div>",
    "  <div class='cm-live-output-border-bottom'></div>",
  ].join("\n")

    template.querySelector(".cm-live-output-border-top").setAttribute("style", [
    "position: relative",
    "z-index: 2",
    "height: 12px",
    "background-clip: padding-box",
    "background: url('" + uri + "') top right repeat-x"
  ].join(";"))

  template.querySelector(".cm-live-output-border-bottom").setAttribute("style", [
    "position: relative",
    "z-index: 2",
    "height: 12px",
    "background-clip: padding-box",
    "background: url('" + uri + "') top left repeat-x",
    "-webkit-transform: rotate(180deg)",
    "-o-transform: rotate(180deg)",
    "transform: rotate(180deg)"
  ].join(";"))

  template.querySelector(".cm-live-output-box").setAttribute("style", [
    "-moz-box-shadow: 0 0 30px -2px #000",
    "-webkit-box-shadow: 0 0 30px -2px #000",
    "box-shadow: 0 0 30px -2px #000",
    "color: black",
    "background: white",
    "position: relative",
    "padding: 10px",
    "margin: 0px",
    "width: 100%"
  ].join(";"))

  template.querySelector(".cm-live-output-head").setAttribute("style", [
    "display: table-cell",
    "margin: 0 10px 0 0",
    "white-space: pre",
    "color: white",
    "text-shadow: 0px 1px 5px #000",
    "vertical-align: top"
  ].join(";"))
  template.querySelector(".cm-live-output-body").setAttribute("style", [
    "display: table-cell",
    "padding-right: 30px",
    "width: 100%"
  ].join(";"))

  return function makeView(id) {
    var view = template.cloneNode(true)
    view.id = "interactivate-out-" + id
    var label = view.querySelector(".cm-live-output-head")
    label.textContent = "Out[" + id + "] = "

    return view
  }
})()

var slicer = Array.prototype.slice
function throttle(f, delay) {
  var id = 0
  var params = [f, delay].concat(slicer.call(arguments, 2))
  return function throttled() {
    clearTimeout(id, throttled)
    id = setTimeout.apply(this, params.concat(slicer.call(arguments)))
  }
}

function markOnMove(editor, line, view) {
  editor.on("cursorActivity", function move(editor) {
    if (line !== editor.getCursor().line) {
      editor.off("cursorActivity", move)
      editor.markText({ line: line, ch: 0 }, { line: line },
                      { replacedWith: view, atomic: true })
    }
  })
}

function mark(editor, line, id, content) {
  var cursor = editor.getCursor()
  var doc = editor.getDoc()
  var view = document.getElementById("interactivate-out-" + id) || makeView(id)
  var body = view.querySelector(".cm-live-output-body")
  body.innerHTML = ""
  if (content instanceof Element) body.appendChild(content)
  else body.textContent = content

  if (cursor.line === line) return markOnMove(editor, line, view)

  var marker = doc.findMarksAt({ line: line })[0]
  if (marker) marker.clear()
  doc.markText({ line: line, ch: 0 }, { line: line },
               { atomic: true, replacedWith: view })
}

module.exports = function interactive(editor) {
  var state = {}
  var Out = {}
  var id = -1

  window.Out = Out
  var host = shoe('http://localhost:9999/')

  function apply(delta) {
    Object.keys(delta).sort().reduce(function(_, id) {
      editor.operation(function() {
        var In = delta[id]
        var out = void(0)
        if (In === null) {
          Out[id] = null
        }
        // If upper sections are modified delta will contain updated line
        // number but source will be unchanged in such case nothing changed
        // so just skip the line.
        else if (In.source) {
          host.write(In.source)
          host.once("data", function(out) {
            Out[id] = out
            mark(editor, In.line || state[id].line, id, Out[id])
          })
        }
      })
    }, null)
    state = patch(state, delta)
  }

  function calculate() {
    var source = editor.getValue()
    var separator = editor.getOption("interactiveSeparator")
    var sections = source.split(separator)
    sections.pop() // last section does not has execution marker so skip it.
    var update = Object.keys(sections).reduce(function(result, index) {
      var source = sections[index]
      var line = result.line + source.split("\n").length - 1
      result.line = line
      result.state[index] = { source: source, line: line }

      return result
    }, { line: 0, state: {} })

    var delta = diff(state, update.state)
    apply(delta)
  }

  editor.on("change", throttle(calculate, editor.getOption("interactiveSpeed")))

  editor.on("cursorActivity", throttle(function(editor) {
    var line = editor.getCursor().line
    var marker = editor.findMarksAt({ line: line })[0]
    if (marker) {
      marker.clear()
      markOnMove(editor, line, marker.replacedWith.firstChild)
    }
  }, 300))

  function print(editor) {
    if (!editor.getOption("interactiveEnabled")) throw CodeMirror.Pass
    editor.operation(function() {
      var cursor = editor.getCursor()
      editor.replaceSelection("\n// =>\n")
      editor.setCursor({ line: cursor.line + 2, ch: 0 })
    })
  }

  CodeMirror.keyMap.macDefault["Cmd-Enter"] = print
  CodeMirror.keyMap.pcDefault["Ctrl-Enter"] = print

}
