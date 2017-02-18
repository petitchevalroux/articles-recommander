/* eslint-env browser */
/* eslint no-console: 0 */
"use strict";

(function artRecLib(window) {
    var lib = {
        "slots": [],
        "recommendationsCount": 0,
        "addSlot": function(target, count) {
            this.recommendationsCount = this.recommendationsCount +
                Math.max(0, parseInt(count));
        },
        "start": function() {
            this.fetchRecommendations(document.location.href);
        },
        "fetchRecommendations": function(to) {
            var script = document.createElement("script");
            script.setAttribute(
                "src",
                this.getRecommendationsUrl(
                    to,
                    this.getRecommendationsCount()
                )
            );
            document.head.appendChild(script);
        },
        "loadRecommendations": function() {},
        "getRecommendationsUrl": function(to, count) {
            return "/recommendations.js?" +
                "to=" + encodeURIComponent(to) +
                "&count=" + encodeURIComponent(count);
        },
        "getRecommendationsCount": function() {
            return this.recommendationsCount;
        }
    };
    try {
        var slots = window.artRecSlots;
        slots.forEach(function(options) {
            lib.addSlot(options.target, options.count);
        });
        window.artRecLib = lib;
        window.artRecLib.start();
    } catch (e) {
        console.log("artrec error: " + e);
    }

})(window);
