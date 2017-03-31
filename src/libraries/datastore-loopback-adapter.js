"use strict";

function DatastoreLoopbackAdapter(endPoint) {
    var Client = require("loopback-nodejs-client");
    this.client = new Client(endPoint);
}

DatastoreLoopbackAdapter.prototype.get = function(type, id) {
    return this.client.getModel(type)
        .findById({
            "id": id
        });
};

DatastoreLoopbackAdapter.prototype.update = function(type, id, data) {
    return this.client.getModel(type)
        .updateById(id, data);
};


DatastoreLoopbackAdapter.prototype.insert = function(type, data) {
    return this.client.getModel(type)
        .create(data);
};

DatastoreLoopbackAdapter.prototype.find = function(type, options) {
    if (options) {
        options = this.getFilter(options);
    }
    return this.client.getModel(type)
        .find(options);
};

DatastoreLoopbackAdapter.prototype.getFilter = function(options) {
    var filter = {};
    if (options["filter"]) {
        filter["where"] = this.getWhere(options["filter"]);
    }
    if (options["limit"]) {
        filter["limit"] = options["limit"];
    }
    if (options["offset"]) {
        filter["skip"] = options["offset"];
    }
    return {
        "filter": filter
    };
};

DatastoreLoopbackAdapter.prototype.getWhere = function(where) {
    var result = {};
    var self = this;
    Object.getOwnPropertyNames(where)
        .forEach(function(field) {
            var condition = where[field];
            // Handle multiple conditions for a field
            if (Array.isArray(condition)) {
                if (!result.hasOwnProperty("or")) {
                    result["or"] = [];
                }
                condition.forEach(function(c) {
                    var f = {};
                    f[field] = self.getCondition(c);
                    result["or"].push(f);
                });

            } else {
                result[field] = self.getCondition(condition);
            }
        });
    return result;
};

DatastoreLoopbackAdapter.prototype.getCondition = function(condition) {
    return condition;
};

module.exports = DatastoreLoopbackAdapter;
