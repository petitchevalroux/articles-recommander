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
                var recommendations = [{
                    "title": "article title",
                    "url": "article url",
                    "image": "image"
                }];
                var pos = data.indexOf(
                    "(function artRecLoader(window) {");
                if (pos < 0) {
                    throw new Error(
                        "Unable to find from where removing headers"
                    );
                }
                res.set(
                    "Content-Type",
                    "application/javascript"
                );
                res.send(
                    data
                    .substring(pos)
                    .replace(
                        "RECOMMENDATIONS",
                        JSON.stringify(recommendations)
                    )
                );
            } catch (err) {
                next(new di.Error(err));
            }
        });
    }
};
