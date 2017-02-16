"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var env;
try {
    env = di.config.get("environment");
    if (!env) {
        env = di.config.get("NODE_ENV");
    }
} catch (e) {
    di.log.error(e);
}
module.exports = env === "development" ? env : "production";
