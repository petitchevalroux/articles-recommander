"use strict";
var path = require("path");
var nconf = require("nconf");
nconf.file(path.join(__dirname, "..", "..", "config.json"));
module.exports = nconf;
