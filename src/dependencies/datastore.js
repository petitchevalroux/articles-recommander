"use strict";
var path = require("path");
var Adapter = require(path.join(__dirname, "..", "libraries",
    "datastore-loopback-adapter"));
var Datastore = require(path.join(__dirname, "..", "libraries", "datastore"));
module.exports = new Datastore(new Adapter("http://0.0.0.0:3000/api"));
