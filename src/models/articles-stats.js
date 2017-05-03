"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var Promise = require("bluebird");
var stream = require("stream");

function ArticlesStatsModel() {}

ArticlesStatsModel.prototype.redisDisplayArticles = "asmdas";
ArticlesStatsModel.prototype.redisQualityArticles = "asmqas";

/**
 * Update statistics
 * @returns {Promise}
 */
ArticlesStatsModel.prototype.update = function() {
    return this.updateQualityAndDisplay()
        .then(function(updated) {
            return {
                "display": updated.display,
                "quality": updated.quality
            };
        });
};

/**
 * Return display count of an article by its url
 * @param {string} url
 * @returns {unresolved}
 */
ArticlesStatsModel.prototype.getDisplayByUrl = function(url) {
    return di.eventsDatastore
        .find("articles", {
            "filter": {
                "value": url
            },
            "fields": ["sum(display) as display"]
        })
        .then(function(results) {
            if (results.length > 0 && results[0]["display"]) {
                return results[0]["display"];
            }
            return 0;
        });
};

/**
 * Update articles display statistics
 * @returns {Promise}
 */
ArticlesStatsModel.prototype.updateQualityAndDisplay = function() {
    var self = this;
    var updated = {
        "quality": 0,
        "display": 0
    };
    return new Promise(function(resolve) {
        di.lock("lock:" + self.redisDisplayArticles, 3600000)
            .then(function(lock) {
                di.datastore
                    .getFindStream("articles")
                    .on("error", function(err) {
                        di.log.error(new di.Error(err));
                    })
                    .pipe(self.getAddDisplayStream())
                    .pipe(self.getAddClickStream())
                    .pipe(self.getUpdateStream(function(article) {
                        var promises = [self
                            .setDisplay(article.id,
                                article.display)
                        ];
                        updated.display++;
                        if (article.click > 0 &&
                            article.display > 0) {
                            updated.quality++;
                            promises
                                .push(
                                    self
                                    .setQuality(
                                        article.id,
                                        article.click /
                                        article.display
                                    )
                                );
                        }
                        return Promise.all(promises);
                    }))
                    .on("finish", function() {
                        lock.unlock();
                        resolve(updated);
                    });
                return lock;
            })
            .catch(function(err) {
                di.log.error(new di.Error(err));
                resolve(updated);
            });
    });
};

/**
 * Return count least displayed ids of articles
 * @param {Integer} count
 * @returns {Promise}
 */
ArticlesStatsModel.prototype.getLeastDisplayIds = function(count) {
    var self = this;
    return new Promise(function(resolve) {
        if (count < 1) {
            resolve([]);
            return;
        }
        di.redis.zrange(self.redisDisplayArticles, 0, count - 1,
            function(err, result) {
                if (err) {
                    di.log.error(new di.Error(
                        "Unable to fetch display stats from redis",
                        err
                    ));
                    result = [];
                }
                di.log.info("Least display ids: %j", result);
                resolve(result);
            });
    });
};

/**
 * Return a stream adding a value to article
 * @returns {Stream}
 */
ArticlesStatsModel.prototype.getAddStatStream = function(getStat) {
    return new stream
        .Transform({
            "writableObjectMode": true,
            "readableObjectMode": true,
            "transform": function(article, encoding, callback) {
                getStat(article)
                    .then(function(article) {
                        callback(null, article);
                        return article;
                    })
                    .catch(function(err) {
                        di.log.error(new di.Error(err));
                        callback(null, article);
                    });
            }
        })
        .on("error", function(err) {
            di.log.error(new di.Error(err));
        });
};

/**
 * Return a stream adding display value to article
 * @returns {Stream}
 */
ArticlesStatsModel.prototype.getAddDisplayStream = function() {
    var self = this;
    return self.getAddStatStream(function(article) {
        return new Promise(function(resolve) {
            self.getDisplayByUrl(article.url)
                .then(function(display) {
                    article.display = display;
                    resolve(article);
                    return article;
                })
                .catch(function(err) {
                    di.log.error(new di.Error(err));
                    resolve(article);
                });
        });
    });
};

/**
 * Return a stream writing updating an article
 * @param {Callable} update
 * @returns {Stream}
 */
ArticlesStatsModel.prototype.getUpdateStream = function(update) {

    return new stream
        .Writable({
            "objectMode": true,
            "write": function(article, encoding, callback) {
                var s = this;
                update(article)
                    .then(function() {
                        callback();
                        return article;
                    })
                    .catch(function(err) {
                        s.emit("error", new di.Error(err));
                        callback();
                    });
            }
        })
        .on("error", function(err) {
            di.log.error(new di.Error(err));
        });
};

/**
 * Increment display stats for articles in ids
 * @param {array} ids
 * @returns {Promise}
 */
ArticlesStatsModel.prototype.incrementDisplayByIds = function(ids) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var cmds = [];
        ids.forEach(function(id) {
            cmds.push([
                "zincrby",
                self.redisDisplayArticles,
                1,
                id
            ]);
        });
        di
            .redis
            .multi(cmds)
            .exec(function(err) {
                if (err) {
                    reject(new di.Error(err));
                    return;
                }
                resolve(ids);
            });
    });
};

/**
 * Set display statistic for an article
 * @param {string} id
 * @param {number} score
 * @returns {Promise}
 */
ArticlesStatsModel.prototype.setDisplay = function(id, score) {
    var self = this;
    return new Promise(function(resolve, reject) {
        di.redis.zadd(
            self.redisDisplayArticles,
            score,
            id,
            function(err) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
    });
};


/**
 * Return click count of an article by its url
 * @param {string} url
 * @returns {Promise}
 */
ArticlesStatsModel.prototype.getClickByUrl = function(url) {
    return di.eventsDatastore
        .find("articles", {
            "filter": {
                "value": url
            },
            "fields": ["sum(click) as click"]
        })
        .then(function(results) {
            if (results.length > 0 && results[0]["click"]) {
                return results[0]["click"];
            }
            return 0;
        });
};

/**
 * Return a stream adding display value to article
 * @returns {Stream}
 */
ArticlesStatsModel.prototype.getAddClickStream = function() {
    var self = this;
    return self.getAddStatStream(function(article) {
        return new Promise(function(resolve) {
            self.getClickByUrl(article.url)
                .then(function(display) {
                    article.click = display;
                    resolve(article);
                    return article;
                })
                .catch(function(err) {
                    di.log.error(new di.Error(err));
                    article.click = 0;
                    resolve(article);
                });
        });
    });
};

/**
 * Set qualitiy statistic for an article
 * @param {string} id
 * @param {number} score
 * @returns {Promise}
 */
ArticlesStatsModel.prototype.setQuality = function(id, score) {
    var self = this;
    return new Promise(function(resolve, reject) {
        // We use all possibile range for score before rounding to keep a good
        // precision when comparing quality
        score = Math.round(score * 100000000000000);
        if (score < 1) {
            resolve();
            return;
        }
        di.redis.zadd(
            self.redisQualityArticles,
            score,
            id,
            function(err) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
    });
};
module.exports = ArticlesStatsModel;
