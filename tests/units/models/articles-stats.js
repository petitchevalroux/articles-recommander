"use strict";
var assert = require("assert");
var sinon = require("sinon");
var path = require("path");
var di = require(path.join(__dirname, "..", "..", "..", "src", "di"));
var Promise = require("bluebird");
var model = di.articlesStatsModel;
var stream = require("stream");
var toRestore = [];

describe("Articles Stats model", function() {
    before(function() {
        di.redis = require(path.join(__dirname, "..", "..",
            "mocks", "redis"));
    });
    after(function() {
        toRestore.forEach(function(stub) {
            stub.restore();
        });
        delete di.redis;
    });

    describe("updateDisplay", function() {
        var findStream = new stream.Readable({
            "objectMode": true,
            "read": function() {
                this.push({
                    "id": 1,
                    "url": "http://example.com"
                });
                this.push(null);
            }
        });
        beforeEach(function() {
            di.lock = function() {
                return new Promise(function(resolve) {
                    resolve({
                        "unlock": function() {}
                    });
                });
            };

            toRestore.push(sinon.stub(di.datastore,
                "getFindStream",
                function() {
                    return findStream;
                }));

            toRestore.push(sinon.stub(di.eventsDatastore,
                "find",
                function() {
                    return new Promise(function(
                        resolve) {
                        resolve([{
                            "display": 42
                        }]);
                    });
                }));

            toRestore.push(sinon.stub(di.redis, "zadd",
                function(a, b, c, cb) {
                    cb();
                }));
        });

        it("Should update at least one display statistics",
            function(done) {
                model.updateDisplay()
                    .then(function(result) {
                        assert.equal(result, 1);
                        done();
                        return result;
                    })
                    .catch(function(err) {
                        throw new di.Error(
                            "error test",
                            err
                        );
                    });
            });
    });

});
