"use strict";

var method = require("method")
var util = require("util")


// Render function takes arbitrary data structure and returns something
// that can visually represent it.
var render = method("render@interactivate")

render.define(Object, function (value, view) {
  return view.textContent = util.inspect(value)
})

render.define(function (value, view) {
  if (value instanceof Node) {
    if (view.firstChild !== value) {
      view.innerHTML = ""
      view.appendChild(value)
    }
  }
  return view.textContent = value
})

render.define(Error, function (error, view) {
  return view.textContent = String(error)
})

module.exports = render
