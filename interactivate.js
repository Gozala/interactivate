"use strict";

var diff = require("diffpatcher/diff")
var patch = require("diffpatcher/patch")
var render = require("./render")

function viewMaker(document) {
  var uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAMCAYAAABBV8wuAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGpJREFUeNpi/P//PwM2wMSAA7CACEYggLKZgfgvEP8BCYAwKxALAjEPEH8B4g9MUI5IWlqayevXr9eCaCBfGGSSVnJysu/Xr1+fAx3y/9u3by9BfIb29vZCmCAMgCQZ/+NwL07nUlECIMAAMr41sxvv6oEAAAAASUVORK5CYII="
  var template = document.createElement("div")

  template.style.marginLeft = "-10px"
  template.style.padding = "0"
  template.style.position = "relative"
  template.style.marginRight = "-10px"
  template.style.whiteSpace = "normal"
  template.style.textShadow = "none"

  template.innerHTML = [
    "  <div class='cm-live-output-border-top'> </div>",
    "  <div class='cm-live-output-box'>",
    "    <h1 class='cm-live-output-head'>Out[0]</h1>",
    "    <pre class='cm-live-output-body'></pre>",
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
    view.body = view.querySelector(".cm-live-output-body")

    return view
  }
}

function makeView(editor, id) {
  return editor[MakeView](id)
}

var Out = "out@interactivate"
var In = "in@interactivate"
var Reciever = "receiver@interactivate"
var MakeView = "make-view@interactivate"

function makeOptionGetter(name) {
  return function getOption(editor) {
    return editor.getOption(name)
  }
}

var getRenderRate = makeOptionGetter("interactiveSpeed")
var getSectionSeparator = makeOptionGetter("interactiveSeparator")


var slicer = Array.prototype.slice
function throttle(f, delay) {
  /**
  Creates function that calls throttles calls to given `f` such that,
  it's only called if no further calls are made with in the time
  frame (in miliseconds) returned by given `delay.apply(this, arguments)`
  function.
  **/
  var id = 0
  return function throttled() {
    clearTimeout(id, throttled)
    var ms = delay.apply(this, arguments) || 0
    id = setTimeout.apply(this, [f, ms].concat(slicer.call(arguments)))
  }
}



function calculate(editor) {
  var state = editor[In]
  var input = editor.getValue()
  var separator = getSectionSeparator(editor)
  var sections = input.split(separator)
  var activeLine = editor.getCursor().line

  sections.pop() // last section does not has execution marker so skip it.

  var change = Object.keys(sections).reduce(function(result, index) {
    var input = sections[index]
    var line = result.line + input.split("\n").length - 1
    result.line = line
    var delta = {input: input.trim(), line: line, visible: activeLine !== line}
    result.state[index] = state[index] ? patch(state[index], delta) :
                          delta

    return result
  }, { line: 0, state: {} })

  return diff(editor[In], change.state)
}


function send(packet) {
  var event = document.createEvent("CustomEvent")
  event.initCustomEvent("server", false, true, packet)
  window.dispatchEvent(event)
}


function recieve(editor, event) {
  var packet = event.detail
  var delta = {}
  delta[packet.from] = {pending: null,
                        result: render(packet.message)}
  write(editor, delta)
}

function print(editor) {
  if (!editor.getOption("interactivate")) throw editor.constructor.Pass
  editor.operation(function() {
    var cursor = editor.getCursor()
    editor.replaceSelection("\n// =>\n")
    editor.setCursor({ line: cursor.line + 2, ch: 0 })
  })
}


function getMarkerFor(editor, view) {
  var markers = editor.getAllMarks()
  var count = markers.length
  while (count) {
    count = count - 1
    var marker = markers[count]
    if (marker.replacedWith === view) return marker
  }
  return null
}

function write(editor, changes) {
  console.log("<<<", changes)
  var doc = editor.getDoc()
  Object.keys(changes).sort().reduce(function(_, id) {
    if (!editor[Out][id]) editor[Out][id] = makeView(editor, id)

    var view = editor[Out][id]
    var change = changes[id]

    if (change === null) return editor[Out][id] = null

    if (change.pending) view.style.opacity = "0.2"
    else if (change.pending === null) view.style.opacity = ""

    if (change.result) {
      var content = change.result
      view.body.innerHTML = ""
      if (content instanceof Element) view.body.appendChild(content)
      else view.body.textContent = content
    }


    if (change.visible === true || change.line) {
      var line = change.line || editor[In][id].line

      var marker = doc.findMarksAt({line: line})[0]
      if (marker) marker.clear()

      doc.markText({line: line, ch: 0},
                   {line: line },
                   {atomic: true,
                    collapsed: true,
                    replacedWith: view,
                    className: "interactivate-output"})
      view.parentNode.style.display = "block"

      /*
      if (!view.parentNode)
        editor.addLineWidget(line - 1, view, {showIfHidden: true})
      else
        view.style.display = ""
      */
    }

    if (change.visible === false) {
      var line = change.line || editor[In][id].line
      var marker = doc.findMarksAt({line: line})[0]
      if (marker && marker.className === "interactivate-output")
        marker.clear()
      //view.style.display = "none"
    }
  }, null)
  editor[In] = patch(editor[In], changes)
}

function post(changes) {
  Object.keys(changes).reduce(function(_, id) {
    var change = changes[id]
    if (change && change.input) {
      console.log(">>", id, change)
      send({ to: id, source: change.input })
    }
  }, null)
}

// Function finds modified sections and queues up messegase to an
// eval host. In adition it also renders output views (if they
// do not exist yet) where eval results are written.
var renderOutput = throttle(function render(editor) {
  var delta = calculate(editor)
  var changes = Object.keys(delta).reduce(function(changes, id) {
    var change = delta[id]
    // Only mark change pending if there is some input to be evaled.
    if (change && change.input) change.pending = true
    return changes
  }, delta)

  write(editor, changes)
  post(changes)
}, getRenderRate)

var hideOutput = throttle(function render(editor) {
  var line = editor.getCursor().line
  var state = editor[In]
  var changes = Object.keys(state).reduce(function(delta, id) {
    var value = state[id]
    if (value.line === line) delta[id] = {visible: false}
    else if (!value.visible) delta[id] = {visible: true}

    return delta
  }, [])

  if (changes.length) write(editor, changes)
}, function() { return 200 })


function tooglePlugin(editor, value) {
  if (value) {
    editor[Reciever] = recieve.bind(recieve, editor)
    editor[MakeView] = viewMaker(editor.display.input.ownerDocument)
    editor[In] = {}
    editor[Out] = {}
    editor.on("change", renderOutput)
    editor.on("cursorActivity", hideOutput)
    window.addEventListener("client", editor[Reciever], false)
  } else {
    editor.off("change", renderOutput)
    editor.off("cursorActivity", hideOutput)
    window.removeEventListener("client", editor[Reciever], false)
    editor[Reciever] = null
    editor[MakeView] = null
    editor[In] = null
    editor[Out] = null
  }
}

function install(CodeMirror) {
  // Fix constructor property so that it could be accessed from the
  // instance.
  CodeMirror.prototype.constructor = CodeMirror;
  CodeMirror.defaults.interactiveSpeed = 300
  CodeMirror.defaults.interactiveSeparator = /^\/\/ \=\>[^\n]*$/m
  CodeMirror.keyMap.macDefault["Cmd-Enter"] = print
  CodeMirror.keyMap.pcDefault["Ctrl-Enter"] = print

  CodeMirror.defineOption("interactivate", false, tooglePlugin)
}

module.exports = install
