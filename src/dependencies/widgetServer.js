"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var express = require("express");
var app = express();
var Promise = require("bluebird");
try {
    di.log.info("environment: %s", di.environment);

    // Define static path
    app.staticPath = path.join(__dirname, "..", "..", "static", "widget");
    app.use(express.static(app.staticPath, {
        "etag": false
    }));
    app.set("x-powered-by", false);
    app.set("etag", false);
    di.log.info("static path: %s", app.staticPath);

    // Define path allowing to test default error handler
    if (di.environment !== "production") {
        app.get("/error", function() {
            throw new di.Error("sample error");
        });
    }

    app.controllersPath = path.join(__dirname, "..", "widget", "back",
        "controllers");

    app.get("/recommendations.js", function(req, res, next) {
        var recommendationsController = require(
            path.join(
                app.controllersPath,
                "recommendations"
            )
        );
        recommendationsController.getJs(req, res, next);
    });

    app.get("/redirect", function(req, res, next) {
        var redirectController = require(
            path.join(
                app.controllersPath,
                "redirect"
            )
        );
        redirectController.redirect(req, res, next);
    });

    // Events tracker url
    app.get("/e", function(req, res) {
        res.set(
            "Content-Type",
            "application/javascript"
        );
        // Cached to max
        res.set(
            "Cache-Control",
            "public, max-age=0, s-maxage=0"
        );
        res.set(
            "Last-Modified",
            (new Date())
            .toUTCString()
        );
        // We don't do anything as event are handled from access log
        res.send("//ok");
    });

    // Default error handler
    app.use(function(err, req, res, next) {
        if (res.headersSent) {
            return next(err);
        }
        if (!err) {
            err = new di.Error("request not handled");
        }
        di.log.error(new di.Error("internal server error", err));
        res.status(500);
        res.send("Internal server error");
    });

    app.start = function() {
        return new Promise(function(resolve, reject) {
            di.log.info("starting");
            try {
                var config = di.config.get("widgetServer");
                app.server = app.listen(config.port, function() {
                    di.log.info("listening to port %s",
                        config.port);
                });
                resolve(app);
            } catch (e) {
                di.log.error(new di.Error("starting failed", e));
                reject(e);
            }
        });
    };
} catch (e) {
    di.log.error(new di.Error("loading failed", e));
}
module.exports = app;
