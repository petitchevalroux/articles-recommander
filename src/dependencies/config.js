"use strict";
var path = require("path");
var nconf = require("nconf");
nconf
    .argv()
    .env()
    .file(path.join(__dirname, "..", "..", "config.json"));
module.exports = nconf;
