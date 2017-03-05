"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var Promise = require("bluebird");

function ArticlesModel() {}


ArticlesModel.prototype.randomArticleIdsSet = "raais";
ArticlesModel.prototype.redisArticleKey = "r:articles:";

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
                    di.datastore.getModel("articles")
                        .find({
                            "filter": {
                                "limit": 1000
                            }
                        })
                        .then(function(articles) {
                            var cmds = [];
                            var articleIds = [];
                            articles.forEach(function(
                                article) {
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
                            return articleIds;
                        })
                        .catch(function(err) {
                            di.log.error(new di.Error(
                                "Unable to find articles",
                                err));
                            resolve([]);
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
    var self = this;
    var results = [];
    di.log.info(
        "ArticlesModel.getByIds getting " +
        ids.length + " articles"
    );
    if (!ids.length) {
        return new Promise(function(resolve) {
            resolve([]);
        });
    }
    return this.getByIdsFromCache(ids)
        .then(function(articles) {
            di.log.info(
                "ArticlesModel.getByIds " +
                articles.length + " articles fetched from cache"
            );
            return self.mergeArticles(ids, articles, results);
        })
        .then(function(result) {
            results = result.articles;
            return self.getByIdsFromStore(result.ids);
        })
        .then(function(articles) {
            di.log.info(
                "ArticlesModel.getByIds " +
                articles.length + " articles fetched from store"
            );
            return self.saveToCache(articles);
        })
        .then(function(articles) {
            return self.mergeArticles(ids, articles, results);
        })
        .then(function(result) {
            return result.articles;
        });
};

/**
 * Return articles from cache by ids
 * @param {Array} ids
 * @returns {Promise}
 */
ArticlesModel.prototype.getByIdsFromCache = function(ids) {
    var self = this;
    return new Promise(function(resolve, reject) {
        di.log.info(
            "ArticlesModel.getByIdsFromCache getting " +
            ids.length + " articles"
        );
        if (!ids.length) {
            resolve([]);
            return;
        }
        var keys = [];
        ids.forEach(function(id) {
            keys.push(self.redisArticleKey + id);
        });
        di.redis.mget(keys, function(err, results) {
            if (err) {
                reject(new di.Error(
                    "Unable to mget articles by ids",
                    err
                ));
                return;
            }
            var articles = [];
            results.forEach(function(article) {
                if (article !== null) {
                    articles.push(JSON.parse(
                        article));
                }
            });
            resolve(articles);
        });
    });
};

/**
 * Return articles from store by ids
 * @param {Array} ids
 * @returns {Promise}
 */
ArticlesModel.prototype.getByIdsFromStore = function(ids) {
    try {
        di.log.info(
            "ArticlesModel.getByIdsFromStore getting " +
            ids.length + " articles"
        );
        var promises = [];
        ids.forEach(function(id) {
            promises.push(new Promise(function(resolve, reject) {
                di.datastore.getModel("articles")
                    .findById({
                        "id": id
                    })
                    .then(function(article) {
                        resolve(article);
                        return article;
                    })
                    .catch(function(err) {
                        reject(new di.Error(
                            "Unable to get article from datastore",
                            err
                        ));
                    });
            }));
        });
        return Promise
            .all(promises);
    } catch (err) {
        return new Promise(function(resolve, reject) {
            reject(new di.Error("Unable to get article from store",
                err));
        });
    }
};

/**
 * Append articles to results and return missing ids
 * @param {array} ids of asked ids
 * @param {type} articles ids of new articls
 * @param {type} results already fetched articles
 * @returns {Object}
 */
ArticlesModel.prototype.mergeArticles = function(ids, articles, results) {
    articles.forEach(function(article) {
        if (article !== null &&
            typeof(article.id) !== "undefined") {
            results.push(article);
        }
    });
    var missingIds = [];
    ids.forEach(function(id) {
        var found = false;
        for (var i = 0; i < results.length && !found; i++) {
            var article = results[i];
            found = article && article.id === id;
        }
        if (!found) {
            missingIds.push(id);
        }
    });
    return {
        "ids": missingIds,
        "articles": results
    };
};
/**
 * Save articles to cache
 * @param {Array} articles
 * @returns {Promise}
 */
ArticlesModel.prototype.saveToCache = function(articles) {
    var self = this;
    return new Promise(function(resolve) {
        di.log.info(
            "ArticlesModel.saveToCache saving " +
            articles.length + " articles"
        );
        var cmds = [];
        articles.forEach(function(article) {
            if (article && typeof(article.id) !== undefined) {
                cmds.push([
                    "set",
                    self.redisArticleKey + article.id,
                    JSON.stringify(article)
                ]);
            }
        });
        if (cmds.length > 0) {
            di.redis.multi(cmds)
                .exec(function(err) {
                    if (err) {
                        di.log.error(
                            new di.Error(
                                "Unable to save articles to cache",
                                err
                            ));
                    }
                    resolve(articles);
                });
        } else {
            resolve(articles);
        }
    });
};

module.exports = ArticlesModel;
