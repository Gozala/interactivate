"use strict";

function send(packet) {
  var event = document.createEvent("CustomEvent")
  event.initCustomEvent("client", false, true, packet)
  window.dispatchEvent(event)
}

function server() {
  var Out = window.Out = []
  window.addEventListener("server", function(event) {
    var packet = event.detail
    try { Out[packet.to] = window.eval(packet.source) }
    catch (error) { Out[packet.to] = error }
    send({ from: packet.to, message: Out[packet.to] })
  }, false)
}

module.exports = server
