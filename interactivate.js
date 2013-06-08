"use strict";

var diff = require("diffpatcher/diff")
var patch = require("diffpatcher/patch")
var output = require("./output")
var makeOutput = output.makeOutput
var writeOutput = output.write


var Out = "out@interactivate"
var In = "in@interactivate"
var Reciever = "receiver@interactivate"

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
                        result: packet.result}
  write(editor, delta)
}

function print(editor) {
  if (!editor.getOption("interactivate")) throw editor.constructor.Pass
  editor.operation(function() {
    var cursor = editor.getCursor()
    editor.replaceSelection(editor.getOption("interactiveSection"))
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
  var doc = editor.getDoc()
  Object.keys(changes).sort().reduce(function(_, id) {
    if (!editor[Out][id]) editor[Out][id] = makeOutput(id)

    var output = editor[Out][id]
    var change = changes[id]
    if (change === null) editor[Out][id] = null

    writeOutput(output, editor, change)
  }, null)
  editor[In] = patch(editor[In], changes)
}

function post(changes) {
  Object.keys(changes).reduce(function(_, id) {
    var change = changes[id]
    if (change && change.input) {
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
    else if (!value.visible) delta[id] = {visible: true, line: value.line}

    return delta
  }, [])

  if (changes.length) write(editor, changes)
}, function() { return 200 })


function tooglePlugin(editor, value) {
  if (value) {
    editor[Reciever] = recieve.bind(recieve, editor)
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
    editor[In] = null
    editor[Out] = null
  }
}

function install(CodeMirror) {
  // Fix constructor property so that it could be accessed from the
  // instance.
  CodeMirror.prototype.constructor = CodeMirror
  CodeMirror.defaults.interactiveSpeed = 300
  CodeMirror.defaults.interactiveSeparator = /^\/\/ \=\>[^\n]*$/m
  CodeMirror.defaults.interactiveSection = "\n// =>\n"
  CodeMirror.keyMap.macDefault["Cmd-Enter"] = print
  CodeMirror.keyMap.pcDefault["Ctrl-Enter"] = print

  CodeMirror.defineOption("interactivate", false, tooglePlugin)
}

module.exports = install
