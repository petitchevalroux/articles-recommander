"use strict";

function UrlHelper() {}
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var url = require("url");

UrlHelper.prototype.getRedirectUrl = function(to) {
    return url.format({
        "protocol": "http:",
        "host": di.redirectHost,
        "pathname": "/redirect",
        "query": {
            "to": to
        }
    });
};


module.exports = UrlHelper;
