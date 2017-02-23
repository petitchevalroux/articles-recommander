"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var config = di.config.get("redis");
var redis = require("redis");
var client = redis.createClient(config);
client.on("error", function(e) {
    di.log.error(new di.Error("redis error", e));
});
module.exports = redis.createClient(config);
