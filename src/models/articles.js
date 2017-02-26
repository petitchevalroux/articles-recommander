"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var Promise = require("bluebird");

function ArticlesModel() {}


ArticlesModel.prototype.randomArticleIdsSet = "raais";

/**
 * Return count random ids
 * @param {Integer} count
 * @returns {Promise}
 */
ArticlesModel.prototype.getRandomIds = function(count) {
    var self = this;
    return new Promise(function(resolve) {
        if (!count) {
            resolve([]);
            return;
        }
        di.redis.srandmember(self.randomArticleIdsSet, count,
            function(err, result) {
                if (err) {
                    di.log.error(new di.Error(
                        "Unable to fetch ids from redis",
                        err));
                    resolve([]);
                    return;
                }
                if (!result || !result.length) {
                    di.log.info(
                        "ArticlesModel.getRandomIds building redis"
                    );
                    di.datastore.find("articles", {
                        "page": {
                            "limit": 1000
                        },
                        "sort": "-created"
                    }, function(err, articles) {
                        if (err) {
                            di.log.error(new di.Error(
                                "Unable to find articles",
                                err));
                            resolve([]);
                            return;
                        }
                        var cmds = [];
                        var articleIds = [];
                        articles.forEach(function(
                            article) {
                            article = article.toJSON();
                            if (articleIds.length <
                                count) {
                                articleIds.push(
                                    article
                                    .id);
                            }
                            cmds.push(["sadd",
                                self.randomArticleIdsSet,
                                article
                                .id
                            ]);
                        });
                        di.redis.multi(cmds)
                            .exec(function(err) {
                                if (err) {
                                    di.log.error(
                                        new di.Error(
                                            "Unable to add ids to random set",
                                            err
                                        ));
                                }
                                resolve(articleIds);
                            });
                    });
                } else {
                    di.log.info(
                        "ArticlesModel.getRandomIds from redis"
                    );
                    resolve(result);
                }
            });
    });
};

/**
 * Retourne les informations des articles à partir de leurs ids
 * @param {Array} ids
 * @returns {Promise}
 */
ArticlesModel.prototype.getByIds = function(ids) {
    return new Promise(function(resolve, reject) {
        if (!ids || ids.length < 1) {
            resolve([]);
            return;
        }
        di.datastore.find("articles", {
            "filter": {
                "id": ids.join(",")
            }
        }, function(err, result) {
            if (err) {
                reject(new di.Error(
                    "Unable to fetch articles by ids",
                    err));
                return;
            }
            var articles = [];
            result.forEach(function(article) {
                articles.push(article.toJSON());
            });
            resolve(articles);
        });
    });
};
module.exports = ArticlesModel;
