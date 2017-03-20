"use strict";

function DatastoreInfluxAdapter(options) {
    var Client = require("influx")
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

module.exports = DatastoreInfluxAdapter;
