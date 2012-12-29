"use strict";

function send(packet) {
  var event = document.createEvent("CustomEvent")
  event.initCustomEvent("client", false, true, packet)
  window.dispatchEvent(event)
}

function server() {
  window.addEventListener("server", function(event) {
    var packet = event.detail
    var result
    try { result = window.eval(packet.source) }
    catch (error) { result = error }
    send({ from: packet.to, message: result })
  }, false)
}
module.exports = server
