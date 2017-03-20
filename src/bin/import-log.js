"use strict";
var process = require("process");
var fs = require("fs");
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var file = process.argv[2] || "";
var inStream = fs.createReadStream(file);
var stream = require("stream");
inStream.on("error", function(e) {
    di.log.error(new di.Error("unable to open file: %s", file, e));
    process.exit(1);
});
var Clf = require("ncsa-combined-log-format");
var clf = new Clf({
    "dateFormat": "DD/MMM/YYYY:HH:mm:ss ZZ"
});
var output = new stream.Writable({
    objectMode: true
});
output._write = function(event, enc, cb) {
    di.eventsDatastore.insert("events", event)
        .then(function(result) {
            di.log.info("event inserted: %j", event);
            cb();
            return result;
        })
        .catch(function(err) {
            di.log.error("unable to insert event: %j", event, err);
            cb();
        });
};

inStream.pipe(clf)
    .pipe(new stream.Transform({
        "readableObjectMode": true,
        "writableObjectMode": true,
        "transform": function(chunk, enc, cb) {
            var stream = this;
            di.logparser.getEvents(chunk)
                .then(function(events) {
                    events.forEach(function(event) {
                        if (event !== null) {
                            stream.push(event);
                        }
                    });
                    cb();
                    return events;
                })
                .catch(function(err) {
                    stream.emit("error", err);
                    cb();
                });
        }
    }))
    .pipe(output);
