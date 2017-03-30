"use strict";
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var Promise = require("bluebird");
var stream = require("stream");

function ArticlesStatsModel() {}

ArticlesStatsModel.prototype.redisDisplayArticles = "asmdas";

ArticlesStatsModel.prototype.update = function() {
    return this.updateDisplay()
        .then(function(updated) {
            return {
                "display": updated
            };
        });
};

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
 * Update articles display date
 * @returns {Promise}
 */
ArticlesStatsModel.prototype.updateDisplay = function() {
    var self = this;
    var updated = 0;
    return new Promise(function(resolve) {
        di.lock("lock:" + self.redisDisplayArticles, 3600000)
            .then(function(lock) {
                di.datastore
                    .getFindStream("articles")
                    .on("error", function(err) {
                        di.log.error(new di.Error(err));
                    })
                    .pipe(self.getAddDisplayStream())
                    .on("data", function() {
                        updated++;
                    })
                    .pipe(self.getWriteDisplayStream())
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
        di.redis.zrange(self.redisDisplayArticles, 0, count,
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
 * Return a stream adding score to article
 * @returns {Stream}
 */
ArticlesStatsModel.prototype.getAddDisplayStream = function() {
    var self = this;
    return new stream
        .Transform({
            "writableObjectMode": true,
            "readableObjectMode": true,
            "transform": function(article, encoding, callback) {
                self.getDisplayByUrl(article.url)
                    .then(function(score) {
                        article.display = score;
                        callback(null, article);
                        return score;
                    })
                    .catch(function(err) {
                        di.log.error(new di.Error(err));
                        article.score = 0;
                        callback(null, article);
                    });
            }
        })
        .on("error", function(err) {
            di.log.error(new di.Error(err));
        });
};

/**
 * Return a stream writing article score
 * @returns {Stream}
 */
ArticlesStatsModel.prototype.getWriteDisplayStream = function() {
    var self = this;

    return new stream
        .Writable({
            "objectMode": true,
            "write": function(article, encoding, callback) {
                var s = this;
                di.redis.zadd(
                    self.redisDisplayArticles,
                    article.id,
                    article.display,
                    function(err) {
                        if (err) {
                            s.emit("error", err);
                        }
                        callback();
                    });
            }
        })
        .on("error", function(err) {
            di.log.error(new di.Error(err));
        });
};

module.exports = ArticlesStatsModel;
