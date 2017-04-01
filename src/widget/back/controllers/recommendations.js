"use strict";

module.exports = {
    "getJs": function(req, res, next) {
        var fs = require("fs");
        var path = require("path");
        var di = require(path.join(__dirname, "..", "..", "..", "di"));
        var recommendationsFilePath = path.join(
            __dirname,
            "..",
            "..",
            "front",
            "recommendations-loader.js"
        );
        fs.readFile(recommendationsFilePath, "utf8", function(err, data) {
            try {
                if (err) {
                    throw err;
                }
                var limit = Math.min(20, parseInt(req.query.count));
                if (isNaN(limit)) {
                    limit = 0;
                }
                var pos = data.indexOf(
                    "(function artRecLoader(window) {");
                if (pos < 0) {
                    throw new Error(
                        "Unable to find from where removing headers"
                    );
                }
                di.recommendations
                    .getArticlesIds(limit)
                    .then(function(ids) {
                        return di
                            .articlesModel
                            .getByIds(ids);
                    })
                    .then(function(articles) {
                        res.set(
                            "Content-Type",
                            "application/javascript"
                        );
                        res.set(
                            "Cache-Control",
                            "public, max-age=3600, s-maxage=60"
                        );
                        res.set(
                            "Last-Modified",
                            (new Date())
                            .toUTCString()
                        );
                        var result = [];
                        articles = articles.slice(0, limit);
                        var events = [];
                        var articleDisplayIds = [];
                        articles.forEach(function(article) {
                            var event = {
                                "action": "display",
                                "value": article
                                    .url
                            };
                            if (req.query && typeof(
                                    req.query.to) ===
                                "string") {
                                event.label = req.query
                                    .to;
                            }
                            events.push(event);
                            articleDisplayIds.push(
                                article.id);
                            result.push({
                                "url": di.urlHelper
                                    .getRedirectUrl(
                                        article[
                                            "url"
                                        ]),
                                "title": article[
                                    "title"
                                ],
                                "image": article[
                                    "image"
                                ]
                            });
                        });
                        res.send(
                            data
                            .substring(pos)
                            .replace(
                                "RECOMMENDATIONS",
                                JSON.stringify(result)
                            )
                        );
                        if (events.length > 0) {
                            di.tracker.send(events)
                                .then(function() {
                                    di.log.info(
                                        "tracked events: %j",
                                        events);
                                    return events;
                                })
                                .catch(function(err) {
                                    di.log.error(
                                        new di.Error(
                                            "error tracking events: %j",
                                            events,
                                            err
                                        ));
                                });
                        }
                        if (articleDisplayIds.length > 0) {
                            di
                                .articlesStatsModel
                                .incrementDisplayByIds(
                                    articleDisplayIds)
                                .then(function(ids) {
                                    di.log.info(
                                        "Incremented display stats for: %j",
                                        ids);
                                    return ids;
                                })
                                .catch(function(err) {
                                    di.log.error(
                                        new di.Error(
                                            "error incrementing display stats: %j",
                                            articleDisplayIds,
                                            err
                                        ));
                                });
                        }
                        return result;
                    })
                    .catch(function(err) {
                        next(new di.Error(err));
                    });
            } catch (err) {
                next(new di.Error(err));
            }
        });
    }
};
