"use strict";
var util = require("util");
var RedisClient = require("redis")
    .RedisClient;

function RedisMock() {
    RedisClient.call(this);
}

util.inherits(RedisMock, RedisClient);
// Avoid redis connection
RedisMock.prototype.create_stream = function() {};
module.exports = new RedisMock();
