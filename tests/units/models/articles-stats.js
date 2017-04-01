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
        delete di.redis;
    });

    afterEach(function() {
        toRestore.forEach(function(stub) {
            stub.restore();
        });
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


    describe("setDisplay", function() {
        it(
            "Should save display stats to redis for the article id",
            function() {
                var zaddStub = sinon.stub(di.redis, "zadd",
                    function(set, score, member, cb) {
                        cb(null);
                    });
                toRestore.push(zaddStub);
                return model
                    .setDisplay("article-id", "score")
                    .then(function() {
                        assert.equal(zaddStub.getCall(0)
                            .args[1], "score");
                        assert.equal(zaddStub.getCall(0)
                            .args[2], "article-id");
                        return null;
                    });
            });
    });

});
