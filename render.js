"use strict";

var method = require("method")
var util = require("util")


// Render function takes arbitrary data structure and returns something
// that can visually represent it.
var render = method("render@interactivate")

render.define(Object, function(value, view) {
  return view.textContent = util.inspect(value)
})

render.define(function(value, view) {
  return view.textContent = value
})

render.define(Error, function(error, view) {
  return view.textContent = String(error)
})

render.define(Element, function(element, view) {
  if (view.firstChild !== element) {
    view.innerHTML = ""
    view.appendChild(element)
  }
  return element
})

module.exports = render
