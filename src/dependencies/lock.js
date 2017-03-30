"use strict";
var Redlock = require("redlock");
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var redlock = new Redlock([di.redis], {
    "retryCount": 0
});
module.exports = function() {
    return redlock.lock.apply(redlock, arguments);
};
