"use strict";
var Promise = require("bluebird");
var querystring = require("qs");
var url = require("url");

function LogParser(options) {
    this.eventsEndPoint = options.eventsEndPoint || "";
    this.redirectHost = options.redirectHost || "";
    this.hosts = [this.redirectHost, url.parse(this.eventsEndPoint)
        .host
    ];
}

LogParser.prototype.getEvents = function(log) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            var events = [];
            if (log.request && log.request.uri &&
                typeof(log.request.uri) === "string") {
                var uriData = url.parse(log.request.uri);
                if (uriData.query && self.hosts.indexOf(uriData.host) !==
                    -1) {
                    var query;
                    if (uriData.host === self.redirectHost &&
                        uriData.pathname === "/redirect") {
                        query = querystring.parse(uriData.query);
                        if (query.to) {
                            events.push({
                                "date": log.date,
                                "action": "click",
                                "value": query.to ? query.to
                                    .toString() : "",
                                "source": log.referer ? log
                                    .referer.toString() : ""
                            });
                        }
                    } else if (log.request.uri.indexOf(self.eventsEndPoint) ===
                        0) {
                        query = querystring.parse(uriData.query);
                        if (query.e && Array.isArray(query.e)) {
                            query.e.forEach(function(e) {
                                events.push({
                                    "date": log.date,
                                    "action": e.action ?
                                        e.action.toString() :
                                        "",
                                    "value": e.value ?
                                        e.value.toString() :
                                        "",
                                    "source": e.label ?
                                        e.label.toString() :
                                        ""
                                });
                            });
                        }
                    }
                }
            }
            resolve(events.filter(e => {
                return e.date && e.action && e.value &&
                    e.source;
            }));
        } catch (err) {
            reject(err);
        }
    });
};


module.exports = LogParser;
