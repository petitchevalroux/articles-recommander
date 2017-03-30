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
            fetches[index]()
                .then(function(ids) {
                    ids.forEach(function(id) {
                        if (!results[id]) {
                            results[id] = true;
                            count--;
                        }
                    });
                    if (count > 0 && index < fetches.length) {
                        nextFetch(index + 1);
                    } else {
                        resolve(
                            Object.getOwnPropertyNames(
                                results)
                        );
                    }
                    return ids;
                })
                .catch(function(error) {
                    di.log.error(new di.Error(error));
                });
        };
        nextFetch(0);
    });
};

module.exports = RecommendationsModel;
