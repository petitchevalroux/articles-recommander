"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var Tracker = require(path.join(__dirname, "..", "libraries", "events-tracker"));
module.exports = new Tracker(di.config.get("eventsTracker"));
