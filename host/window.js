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
    var result = null
    try {
      Out[packet.to] = window.eval(packet.source)
      result = {result: {value: Out[packet.to]},
                error: null}
    }
    catch (error) {
      Out[packet.to] = error
      result = {result: null,
                error: {value: error}}
    }
    send({ from: packet.to, result: result })
  }, false)
}

module.exports = server
