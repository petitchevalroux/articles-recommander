"use strict";
var stream = require("stream");
var process = require("process");

function Datastore(adapter) {
    this.adapter = adapter;
}

/**
 * Get object by id, if not found object is null 
 * @param {String} type
 * @param {String} id
 * @returns {Promise}
 */
Datastore.prototype.get = function(type, id) {
    return this.adapter.get(type, id);
};

/**
 * Update object
 * @param {String} type
 * @param {String} id
 * @param {Object} data
 * @returns {Promise}
 */
Datastore.prototype.update = function(type, id, data) {
    return this.adapter.update(type, id, data);
};

/**
 * Insert object and return id
 * @param {String} type
 * @param {Object} data
 * @returns {Promise}
 */
Datastore.prototype.insert = function(type, data) {
    return this.adapter.insert(type, data);
};

/**
 * Find multiple objects
 * @param {String} type
 * @param {Object} options
 * @returns {Promise}
 */
Datastore.prototype.find = function(type, options) {
    return this.adapter.find(type, options);
};

/**
 * Return a readable object stream listing all objects of one type
 * @param {String} type
 * @param {Object} options
 * @returns {Stream}
 */
Datastore.prototype.getFindStream = function(type, options) {
    var self = this;
    options = options || {};
    var offset = options.offset || 0;
    var limit = options.limit;
    var fetching = false;
    return new stream.Readable({
        "objectMode": true,
        "highWaterMark": options.highWaterMark || 16,
        "read": function() {
            var rStream = this;
            var queue = function() {
                // Not fetching and internal buffer empty
                var toFetch = rStream._readableState.highWaterMark -
                    rStream._readableState.buffer.length;
                if (!fetching && toFetch > 0) {
                    fetching = true;
                    options.offset = offset;
                    options.limit = toFetch;
                    if (limit) {
                        // Should we stop
                        if (offset >= limit) {
                            fetching = false;
                            offset = 0;
                            return;
                        }
                        // Limit next fetch to missing objects
                        if (options.limit + options.offset >
                            limit) {
                            options.limit = Math.max(limit -
                                options.offset, 0);
                        }
                    }
                    self.find(type, options)
                        .then(function(objects) {
                            if (!objects.length) {
                                rStream.push(null);
                                fetching = false;
                                offset = 0;
                            } else {
                                for (var i = 0; i <
                                    objects.length; i++
                                ) {
                                    offset++;
                                    if (!rStream.push(
                                            objects[i])) {
                                        i = objects.length;
                                    }
                                }
                                fetching = false;
                                process.nextTick(queue);
                            }
                            return objects;
                        })
                        .catch(function(err) {
                            fetching = false;
                            process.nextTick(queue);
                            rStream.emit("error", err);
                        });
                }
            };
            process.nextTick(queue);
        }
    });
};

module.exports = Datastore;
