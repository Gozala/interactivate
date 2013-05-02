var makeView = require("./view").makeView

function Output(id) {
  this.id = id
}

function makeOutput(id) {
  return new Output(id)
}


function clear(output) {
  output.marker.clear()
  output.widget.clear()
}

function mark(output, editor, line) {
  output.marker = editor.markText({line: line, ch: 0},
                                  {line: line},
                                  {collapsed: true,
                                   inclusiveLeft: false,
                                   inclusiveRight: true,
                                   })

  output.widget = editor.addLineWidget(line,
                                       output.view,
                                       {showIfHidden: true,
                                        noHScroll:true})
}

function move(output, editor, line) {
  var position = output.marker.find()
  if (!position || position.line !== line) {
    clear(output)
    mark(output, editor, line)
  }
}

function write(output, editor, state) {
  var view = output.view || (output.view = makeView(editor, output.id))
  if (state === null) return clear(output)

  if (state.pending) output.view.style.opacity = "0.2"
  else if (state.pending === null) output.view.style.opacity = ""

  if (state.result) {
    var content = state.result
    view.body.innerHTML = ""
    if (content instanceof Element) view.body.appendChild(content)
    else view.body.textContent = content
  }

  if (state.visible === true) mark(output, editor, state.line)
  if (state.visible === false) clear(output)
  if (state.line) move(output, editor, state.line)
}

exports.makeOutput = makeOutput
exports.write = write