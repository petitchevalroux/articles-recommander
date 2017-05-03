"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var RedisStats = require("redis-statistics");
module.exports = new RedisStats(di.redis);
