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

    describe("updateEfficiencyAndDisplay", function() {
        var findStream;
        beforeEach(function() {
            findStream = new stream.Readable({
                "objectMode": true,
                "read": function() {
                    this.push({
                        "id": 1,
                        "url": "http://example.com"
                    });
                    this.push(null);
                }
            });
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
                            "display": 42,
                            "click": 42
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
                model.updateEfficiencyAndDisplay()
                    .then(function(result) {
                        assert.equal(result.display, 1);
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

        it("Should update at least one efficiency statistics",
            function(done) {
                model.updateEfficiencyAndDisplay()
                    .then(function(result) {
                        assert.equal(result.efficiency,
                            1);
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

    describe("getLeastDisplayIds", function() {
        it(
            "Should call redis to return count least displayed ids",
            function() {
                var zrangeStub = sinon.stub(di.redis,
                    "zrange",
                    function(set, start, stop, cb) {
                        cb(null);
                    });
                toRestore.push(zrangeStub);
                return model
                    .getLeastDisplayIds(7)
                    .then(function() {
                        assert.equal(zrangeStub.getCall(
                                0)
                            .args[1], 0);
                        assert.equal(zrangeStub.getCall(
                                0)
                            .args[2], 6);
                        return null;
                    });
            });
    });

    describe("getDisplayCard", function() {
        var zcardStub;
        it("Should return display cardinality", function(done) {
            zcardStub = sinon.stub(di.redis, "zcard",
                function(set, cb) {
                    cb(null, 10);
                });
            toRestore.push(zcardStub);
            model
                .getDisplayCard()
                .then(function(card) {
                    assert.equal(card, 10);
                    done();
                    return card;
                })
                .catch(function(err) {
                    throw err;
                });
        });
    });



    describe("getEpsilon", function() {
        it("return a 0 epsilon if all set have the same value",
            function(done) {
                toRestore
                    .push(
                        sinon.stub(di.redis, "zcard",
                            function(a, cb) {
                                cb(false, 10);
                            }
                        ),
                        sinon.stub(di.redis, "zcount",
                            function(set, min, max, cb) {
                                cb(false, 0);
                            }
                        ),
                        sinon.stub(di.redis, "zrange",
                            function(a, start, stop, b, cb) {
                                cb(false, [0, 2, 1, 2, 2, 2,
                                    3, 2, 4, 2, 5,
                                    2, 6, 2, 7, 2,
                                    8, 2, 9, 2
                                ].slice(start, stop +
                                    1));
                            }
                        )
                    );
                model
                    .getEpsilon()
                    .then(function(epsilon) {
                        assert.equal(epsilon, 0);
                        done();
                        return epsilon;
                    })
                    .catch(function(err) {
                        throw err;
                    });
            });

        it("return a 0.5 epsilon", function(done) {
            toRestore
                .push(
                    sinon.stub(di.redis, "zcard",
                        function(a, cb) {
                            cb(false, 8);
                        }
                    ),
                    sinon.stub(di.redis, "zcount",
                        function(set, min, max, cb) {
                            cb(false, 2);
                        }
                    ),
                    sinon.stub(di.redis, "zrange",
                        function(a, b, c, d, cb) {
                            cb(false, [0, 1, 1, 2, 2, 7,
                                3, 7, 4, 9, 5,
                                10, 6, 10, 7,
                                10
                            ]);
                        }
                    )
                );
            model
                .getEpsilon()
                .then(function(epsilon) {
                    assert.equal(epsilon, 0.5);
                    done();
                    return epsilon;
                })
                .catch(function(err) {
                    throw err;
                });
        });

        it("return a 0.75 epsilon", function(done) {
            toRestore
                .push(
                    sinon.stub(di.redis, "zcard",
                        function(a, cb) {
                            cb(false, 8);
                        }
                    ),
                    sinon.stub(di.redis, "zcount",
                        function(set, min, max, cb) {
                            cb(false, 1);
                        }
                    ),
                    sinon.stub(di.redis, "zrange",
                        function(a, start, stop, b, cb) {
                            cb(false, [0, 0, 1, 3, 2, 2,
                                3, 2, 4, 9, 5,
                                10, 6, 10, 7,
                                10
                            ].slice(start, stop +
                                1));
                        }
                    )
                );
            model
                .getEpsilon()
                .then(function(epsilon) {
                    assert.equal(epsilon, 0.75);
                    done();
                    return epsilon;
                })
                .catch(function(err) {
                    throw err;
                });
        });

        it("return a 1 epsilon if all values are 0", function(
            done) {
            toRestore
                .push(
                    sinon.stub(di.redis, "zcard",
                        function(a, cb) {
                            cb(false, 8);
                        }
                    ),
                    sinon.stub(di.redis, "zrange",
                        function(a, start, stop, b, cb) {
                            cb(false, [0, 0, 1, 0, 2, 0,
                                3, 0, 4, 0, 5,
                                0, 6, 0, 7, 0
                            ].slice(start, stop +
                                1));
                        }
                    )
                );
            model
                .getEpsilon()
                .then(function(epsilon) {
                    assert.equal(epsilon, 1);
                    done();
                    return epsilon;
                })
                .catch(function(err) {
                    throw err;
                });
        });
    });




});
