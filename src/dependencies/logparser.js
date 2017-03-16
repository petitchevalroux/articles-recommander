"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var LogParser = require(path.join(__dirname, "..", "libraries", "logparser"));
module.exports = new LogParser({
    "redirectHost": di.config.get("redirectHost"),
    "eventsEndPoint": di.config.get("eventsTracker")
        .endPoint
});
