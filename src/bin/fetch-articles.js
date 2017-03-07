"use strict";
/**
 * Fetch sitemaps urls from websites and insert articles from opengraph data
 */
var path = require("path");
var di = require(path.join(__dirname, "..", "di"));
var datastore = di.datastore;
var SitemapStream = require("@petitchevalroux/sitemap-parser");
var OpengraphStream = require("@petitchevalroux/opengraph-fetcher");
var stream = require("stream");

datastore.find("websites")
    .then(function(websites) {
        var inputStream = new stream.Readable();

        var sitemapStream = new SitemapStream();
        sitemapStream.on("error", function(err) {
            di.log.error(new di.Error("Error parsing sitemap", err));
        });

        var ogStream = new OpengraphStream();
        ogStream.on("error", function(err) {
            di.log.error(new di.Error("Error fetching opengraph",
                err));
        });

        var storeStream = new stream.Writable({
            objectMode: true
        });
        storeStream._write = function(chunk, enc, cb) {
            if (typeof chunk.title === "string" && typeof chunk.url ===
                "string") {
                var data = {
                    "title": chunk.title.trim(),
                    "url": chunk.url.trim()
                };
                if (data.title !== "" && data.url !== "") {
                    if (chunk.image && typeof chunk.image.url ===
                        "string") {
                        var image = chunk.image.url.trim();
                        if (image !== "") {
                            data.image = image;
                        }
                    }
                    di.articlesModel
                        .upsertByUrl(data)
                        .then(function(article) {
                            cb();
                            return article;
                        })
                        .catch(function(err) {
                            di.log.error(err);
                            cb();
                        });
                } else {
                    cb();
                }
            }
        };

        inputStream
            .pipe(sitemapStream)
            .pipe(ogStream)
            .pipe(storeStream);
        websites.map(function(website) {
            inputStream.push(website.sitemap);
        });
        inputStream.push(null);
        return websites;
    })
    .catch(function(err) {
        di.log.error(new di.Error("Unable to find websites", err));
    });
