"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var host = di.config.get("redirectHost");
if (!host) {
    host = "127.0.0.1:" + di.widgetServer.server.address()
        .port;
}
di.log.info("redirect host: %s", host);
module.exports = host;
