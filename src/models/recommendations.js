"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var Promise = require("bluebird");

function RecommendationsModel() {}

/**
 * Return count recommendations ids
 * @param {Integer} count
 * @returns {Promise}
 */
RecommendationsModel.prototype.getArticlesIds = function(count) {
    var fetches = [
        function() {
            return di
                .articlesStatsModel
                .getEpsilon()
                .then(function(epsilon) {
                    var mode, result, random = Math.random();
                    if (epsilon < random) {
                        result = di
                            .articlesStatsModel
                            .getMostEfficientIds(count);
                        mode = "exploit";
                    } else {
                        result = [];
                        mode = "explore";
                    }
                    di.log.info(
                        "RecommendationsModel.getArticlesIds epsilon: %s, random: %s, mode: %s",
                        epsilon, random, mode);
                    return result;
                });
        },
        function() {
            return di
                .articlesStatsModel
                .getLeastDisplayIds(count);
        },
        function() {
            return di
                .articlesModel
                .getRandomIds(count);
        }
    ];
    var results = {};
    return new Promise(function(resolve) {
        var nextFetch = function(index) {
            if (index >= fetches.length) {
                resolve(
                    Object.getOwnPropertyNames(results)
                );
                return;
            }
            fetches[index]()
                .then(function(ids) {
                    ids.forEach(function(id) {
                        if (!results[id]) {
                            results[id] = true;
                            count--;
                        }
                    });
                    nextFetch(index + 1);
                    return ids;
                })
                .catch(function(error) {
                    di.log.error(new di.Error(error));
                    nextFetch(index + 1);
                });
        };
        nextFetch(0);
    });
};

module.exports = RecommendationsModel;
