"use strict";
var assert = require("assert");
var sinon = require("sinon");
var path = require("path");
var di = require(path.join(__dirname, "..", "..", "..", "src", "di"));
var Promise = require("bluebird");
var articlesModel = di.articlesModel;
var toRestore = [];
describe("Articles model", function() {
    before(function() {
        var RedisClient = require("redis")
            .RedisClient;
        // Avoid redis connection
        RedisClient.prototype.create_stream = function() {};
        di.redis = new RedisClient();
        toRestore.push(sinon.stub(di.config, "get"));
        toRestore[0].withArgs("log")
            .returns({
                "level": "error"
            });
    });
    after(function() {
        toRestore.forEach(function(stub) {
            stub.restore();
        });
    });
    describe("getByIds", function() {
        it(
            "Should not query store for articles found in cache when ids have mixed type",
            function(done) {
                toRestore.push(
                    sinon.stub(di.redis, "mget",
                        function(keys, cb) {
                            cb(null, [
                                JSON.stringify({
                                    "id": "1"
                                }),
                                JSON.stringify({
                                    "id": "2"
                                })
                            ]);
                        }),
                    sinon.stub(di.datastore, "find",
                        function() {
                            return new Promise(function(
                                resolve) {
                                resolve([]);
                            });
                        }),
                    sinon.stub(di.redis, "multi",
                        function(cb) {
                            cb();
                        })
                );
                articlesModel.getByIds([1, 2, 3, 4])
                    .then(function() {
                        var ids = di.datastore.find.getCall(
                                0)
                            .args[1].filter.id;
                        assert.equal(ids.indexOf(1), -1);
                        assert.equal(ids.indexOf(2), -1);
                        done();
                        return ids;
                    })
                    .catch(function(err) {
                        throw new di.Error("error test",
                            err);
                    });
            });
    });
});
