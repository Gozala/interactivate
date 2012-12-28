"use strict";

var shoe = require("shoe")
var http = require("http")
var repl = require("repl")
var vm = require("vm");
var util = require("util")
var Require = require("require-like")
var path = require("path")

var server = http.createServer()
var host = shoe(function(client) {
  var module = { filename: path.join(process.cwd(), "interactive") }
  var context = vm.createContext(global)
  context.require = Require(module.filename)
  context.module = module;

  client.on("data", function(code) {
    console.log(">>", code)
    var result
    try {
      result = vm.runInContext(code, context)
    } catch (error) {
      result = error
    }
    console.log("<<", util.inspect(result))
    client.write(util.inspect(result))
  })
})

host.install(server)
server.listen(9999)
