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
                di.articlesModel.getRandomIds(limit)
                    .then(di.articlesModel.getByIds)
                    .then(function(articles) {
                        res.set(
                            "Content-Type",
                            "application/javascript"
                        );
                        var result = [];
                        articles = articles.slice(0, limit);
                        articles.forEach(function(article) {
                            result.push({
                                "url": article[
                                    "url"
                                ],
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
