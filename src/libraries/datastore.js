"use strict";

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

module.exports = Datastore;
