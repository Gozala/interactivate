var TEAR_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAMCAYAAABBV8wuAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGpJREFUeNpi/P//PwM2wMSAA7CACEYggLKZgfgvEP8BCYAwKxALAjEPEH8B4g9MUI5IWlqayevXr9eCaCBfGGSSVnJysu/Xr1+fAx3y/9u3by9BfIb29vZCmCAMgCQZ/+NwL07nUlECIMAAMr41sxvv6oEAAAAASUVORK5CYII="

var OUTPUT_STYLE = [
  "margin-left: -10px",
  "padding: 0",
  "whitespace: normal",
  "text-shadow: none"
].join(";")

var TOP_STYLE = [
  "position: relative",
  "z-index: 2",
  "height: 12px",
  "background-clip: padding-box",
  "background: url('" + TEAR_IMAGE + "') top right repeat-x"
].join(";")

var BOTTOM_STYLE = [
  "position: relative",
  "z-index: 2",
  "height: 12px",
  "background-clip: padding-box",
  "background: url('" + TEAR_IMAGE + "') top left repeat-x",
  "-webkit-transform: rotate(180deg)",
  "-o-transform: rotate(180deg)",
  "transform: rotate(180deg)"
].join(";")

var BOX_STYLE = [
  "-moz-box-shadow: 0 0 30px -2px #000",
  "-webkit-box-shadow: 0 0 30px -2px #000",
  "box-shadow: 0 0 30px -2px #000",
  "color: black",
  "background: white",
  "position: relative",
  "margin: 0px",
  "width: 100%",
  "overflow: auto"
].join(";")

var HEAD_STYLE = [
  "display: table-cell",
  "padding: 10px",
  "padding-left: 20px",
  "white-space: pre",
  "color: white",
  "text-shadow: 0px 1px 5px #000",
  "vertical-align: top"
].join(";")

var BODY_STYLE = [
  "display: table-cell",
  "padding: 10px",
  "width: 100%"
].join(";")

var TEMPLATE = [
  "<div style=\"" + OUTPUT_STYLE + "\">",
  "  <div class='cm-live-output-border-top' style=\"" + TOP_STYLE + "\"> </div>",
  "  <div class='cm-live-output-box' style=\"" + BOX_STYLE + "\">",
  "    <h1 class='cm-live-output-head' style=\"" + HEAD_STYLE + "\">Out[0]</h1>",
  "    <pre class='cm-live-output-body' style=\"" + BODY_STYLE + "\"></pre>",
  "  </div>",
  "  <div class='cm-live-output-border-bottom' style=\"" + BOTTOM_STYLE + "\"></div>",
  "</div>"
 ].join("\n")

function makeView(editor, id) {
  var document = editor.display.input.ownerDocument
  var container = document.createElement("section")
  container.innerHTML = TEMPLATE
  var view = container.firstChild
  view.id = "interactivate-out-" + id
  view.label = view.querySelector(".cm-live-output-head")
  view.label.textContent = "Out[" + id + "] = "
  view.body = view.querySelector(".cm-live-output-body")
  return view
}

exports.makeView = makeView