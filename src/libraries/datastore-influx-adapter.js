"use strict";
var influx = require("influx");

function DatastoreInfluxAdapter(options) {
    var Client = influx
        .InfluxDB;
    this.client = new Client(options);
}

DatastoreInfluxAdapter.prototype.insert = function(type, data) {
    var fields = {};
    var tags = {};
    var timestamp = new Date();
    Object.getOwnPropertyNames(data)
        .forEach(function(property) {
            if (data[property] instanceof Date) {
                timestamp = data[property];
            } else if (typeof data[property] === "number") {
                fields[property] = data[property];
            } else {
                tags[property] = data[property].toString();
            }
        });
    // If no numeric value add a default onegit
    if (Object.getOwnPropertyNames(fields)
        .length === 0) {
        fields.count = 1;
    }

    return this.client.writePoints([{
        "measurement": type,
        "tags": tags,
        "fields": fields,
        "timestamp": timestamp
    }]);
};

DatastoreInfluxAdapter.prototype.find = function(type, options) {
    var query = "SELECT " +
        this.getFields(options.fields) +
        " FROM " +
        influx.escape.measurement(type) +
        this.getWhere(options.filter);
    return this.client.query(query);
};

DatastoreInfluxAdapter.prototype.getFields = function(fields) {
    if (!fields || !fields.length) {
        return "*";
    }
    return fields.join(",");
};

DatastoreInfluxAdapter.prototype.getWhere = function(filter) {
    if (!filter) {
        return "";
    }
    var filters = Object.getOwnPropertyNames(filter);
    if (!filters.length) {
        return "";
    }
    var e = new influx.Expression();
    filters.forEach(function(field) {
        e.field(field)
            .equals.value(filter[field]);
    });
    return " WHERE " + e.toString();
};

module.exports = DatastoreInfluxAdapter;
