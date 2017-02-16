"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var express = require("express");
var app = express();
try {
    app.staticPath = path.join(__dirname, "..", "..", "static", "widget");
    app.use(express.static(app.staticPath));
    di.log.info("static path: %s", app.staticPath);
    app.start = function() {
        di.log.info("starting");
        try {
            var config = di.config.get("widgetServer");
            app.listen(config.port, function() {
                di.log.info("listening to port %s", config.port);
            });
        } catch (e) {
            di.log.error(new di.Error("starting failed", e));
        }
    };
} catch (e) {
    di.log.error(new di.Error("loading failed", e));
}
module.exports = app;
