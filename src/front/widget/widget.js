/* eslint-env browser */
/* eslint no-console: 0 */
"use strict";

(function artRecLib(window) {
    var lib = {
        "slots": [],
        "addSlot": function(target, count) {
            console.log(target, count);
        },
        "start": function() {
            this.fetchRecommendations(document.location.href);
        },
        "fetchRecommendations": function(to) {
            var script = document.createElement("script");
            script.setAttribute(
                "src",
                this.getRecommendationsUrl(to)
            );
            document.head.appendChild(script);
        },
        "loadRecommendations": function() {},
        "getRecommendationsUrl": function(to) {
            return "/recommendations.js?to=" + encodeURIComponent(
                to);
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
