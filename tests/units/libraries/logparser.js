"use strict";
var assert = require("assert");
var path = require("path");
var di = require(path.join(__dirname, "..", "..", "..", "src", "di"));

describe("libraries/logparser", function() {
    describe("getEvents", function() {
        it("filter events with missing fields", () => {
            return di.logparser.getEvents({
                    date: new Date(),
                    request: {
                        uri: "http://127.0.0.1:3001/e?e%5B0%5D%5Baction%5D=display&e%5B0%5D%5Bvalue%5D=https%3A%2F%2Facheter-une-moto.ooreka.fr%2Fastuce%2Fvoir%2F450213%2Fhousse-de-selle-de-moto&e%5B0%5D%5Blabel%5D=http%3A%2F%2Fblogopneu.fr%2Fmontage-pneu-neuf.12.html&e%5B1%5D%5Baction%5D=display&e%5B1%5"
                    }
                })
                .then(events => {
                    assert.equal(1, events.length);
                    return events;
                });

        });
    });

});
