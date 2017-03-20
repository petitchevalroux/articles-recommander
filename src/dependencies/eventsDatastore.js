"use strict";
var path = require("path");
var Adapter = require(path.join(__dirname, "..", "libraries",
    "datastore-influx-adapter"));
var Datastore = require(path.join(__dirname, "..", "libraries", "datastore"));
module.exports = new Datastore(new Adapter({
    "host": "127.0.0.1",
    "database": "articles-recommender"
}));
