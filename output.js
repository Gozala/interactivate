var makeView = require("./view").makeView
var render = require("./render")

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

function makeSection(body, type) {
  var view = document.createElement("section")
  view.className = "section-" + type
  view.setAttribute("style", "width: 100%; float: left;")

  view.innerHTML = "<h3 class=section-head></h3>" +
                   "<div class=section-body></div>"
  body.appendChild(view)
  return view
}

function write(output, editor, state) {
  var view = output.view || (output.view = makeView(editor, output.id))
  if (state === null) return clear(output)

  if (state.pending) output.view.style.opacity = "0.2"
  else if (state.pending === null) output.view.style.opacity = ""

  if (state.result) {
    var result = state.result
    Object.keys(result).reduce(function(view, type) {
      var section = view.querySelector(".section-" + type) ||
                    makeSection(view, type)

      var output = result[type]

      if (output) {
        var body = section.querySelector(".section-body")
        var head = section.querySelector(".section-head")

        head.textContent = output.title
        head.style.display = output.title ? "" : "none"

        render(output.value, body)

        section.style.display = ""
      } else {
        section.style.display = "none"
      }

      return view
    }, view.body)
  }

  if (state.visible === true) mark(output, editor, state.line)
  if (state.visible === false) clear(output)
  if (state.line) move(output, editor, state.line)
}

exports.makeOutput = makeOutput
exports.write = write