"use strict";
var Promise = require("bluebird");

/**
 * 
 * @param {Object} options {"endPoint":"end point url"}
 * @returns {EventsTracker}
 */
function EventsTracker(options) {
    this.options = Object.assign({}, options);
}

EventsTracker.prototype.request = require("request");

/**
 * Send events to the endpoint
 * @param {Array} array of events
 * {"category":"event category","action":"event action","label":"event label","value":"event value"}
 * @returns {Promise}
 */
EventsTracker.prototype.send = function(events) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (!self.options.endPoint) {
            reject(new Error("undefined endpoint"));
            return;
        }
        self.request({
            "url": self.options.endPoint,
            "qs": {
                "e": events
            }
        }, function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(true);
        });
    });
};

module.exports = EventsTracker;
