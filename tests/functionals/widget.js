/* eslint-env browser */
"use strict";
var assert = require("assert");
var sinon = require("sinon");
var path = require("path");
var di = require(path.join(__dirname, "..", "..", "src", "di"));
var phantom = require("phantom");
var Promise = require("bluebird");
var phInstance, phPage;

function getFragmentById(id) {
    return new Promise(function(resolve, reject) {
        function checkReady() {
            setTimeout(function() {
                phPage.evaluate(
                        function(id) {
                            if (document.readyState !==
                                "complete") {
                                return "";
                            }
                            var content = document.querySelector(
                                id);
                            if (!content) {
                                return "";
                            }
                            return document.querySelector(
                                    id)
                                .outerHTML;
                        },
                        id
                    )
                    .then(function(html) {
                        if (html) {
                            phInstance.createPage()
                                .then(function(
                                    page) {
                                    page.setContent(
                                        html,
                                        "http://example.com/"
                                    );
                                    resolve(page);
                                    return page;
                                })
                                .catch(function(
                                    e) {
                                    reject(
                                        e
                                    );
                                });
                        } else {
                            checkReady();
                        }
                        return html;
                    })
                    .catch(function(err) {
                        di.log.error(
                            new di.Error(
                                "error evaluating page",
                                err
                            )
                        );
                    });
            });
        }
        checkReady();
    });
}
describe("Functional widget", function() {
    var toRestore = [];
    before(function() {
        toRestore.push(sinon.stub(di.config, "get"));
        toRestore[0].withArgs("widgetServer")
            .returns({
                "port": 7001
            });
        toRestore[0].withArgs("log")
            .returns({
                "level": "error"
            });
        return require(path.join(__dirname, "..", "..", "src",
                "servers", "widget"))
            .then(function() {
                return phantom.create(["--load-images=no"]);
            })
            .then(function(instance) {
                phInstance = instance;
                return instance.createPage();
            })
            .then(function(page) {
                phPage = page;
                return phPage.open(
                    "http://127.0.0.1:7001/sample.html"
                );
            })
            .catch(function(err) {
                di.log.error(
                    new di.Error(
                        "error loading page",
                        err
                    )
                );
            });
    });

    after(function() {
        toRestore.forEach(function(stub) {
            stub.restore();
        });
        phInstance.exit();
        di.widgetServer.server.close();
    });

    it("#content have 10 rows", function() {
        return getFragmentById("#content")
            .then(function(fragment) {
                return fragment.evaluate(function() {
                    return document
                        .querySelectorAll(
                            "table tr")
                        .length;
                });
            })
            .then(function(length) {
                return assert.equal(length, 10);
            })
            .catch(function(err) {
                throw new di.Error("error test", err);
            });
    });

    it("#content have 20 links", function() {
        return getFragmentById("#content")
            .then(function(fragment) {
                return fragment.evaluate(function() {
                    return document
                        .querySelectorAll("a")
                        .length;
                });
            })
            .then(function(length) {
                return assert.equal(length, 20);
            })
            .catch(function(err) {
                throw new di.Error("error test", err);
            });
    });

    it("#content have 10 images", function() {
        return getFragmentById("#content")
            .then(function(fragment) {
                return fragment.evaluate(function() {
                    return document
                        .querySelectorAll("img")
                        .length;
                });
            })
            .then(function(length) {
                return assert.equal(length, 10);
            })
            .catch(function(err) {
                throw new di.Error("error test", err);
            });
    });
});
