/* eslint-env browser */
/* eslint no-console: 0 */
/* global doT:false */
"use strict";

(function artRecLib(window) {
    var lib = {
        "slots": [],
        "recommendationsCount": 0,
        "addSlot": function(target, count) {
            this.recommendationsCount = this.recommendationsCount +
                Math.max(0, parseInt(count));
            this.slots.push({
                "target": target,
                "count": count
            });
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
        "loadRecommendations": function(recommendations) {
            var start = 0;
            var self = this;
            this.slots.forEach(function(slot) {
                var slotRecommendations = [];
                while (slotRecommendations.length < slot.count) {
                    var end = Math.min(start + slot.count,
                        recommendations.length);
                    recommendations.slice(start, end)
                        .forEach(function(r) {
                            slotRecommendations.push(r);
                            start = (start + 1) %
                                recommendations.length;
                        });
                }
                self.renderSlot(
                    slot.target,
                    self.getSlotTemplate(slot),
                    slotRecommendations
                );
            });

        },
        "getRecommendationsUrl": function(to, count) {
            return "/recommendations.js?" +
                "to=" + encodeURIComponent(to) +
                "&count=" + encodeURIComponent(count);
        },
        "getRecommendationsCount": function() {
            return this.recommendationsCount;
        },
        "renderSlot": function(target, template, recommendations) {
            document.getElementById(target)
                .innerHTML = template(recommendations);
        },
        "getSlotTemplate": function(slot) {
            var tpl = "";
            if (!slot.template) {
                tpl = "<table>{{~it :recommendation:index}}<tr>" +
                    "<td><a href=\"{{=recommendation.url}}\"><img src=\"{{=recommendation.image}}\"></a></td>" +
                    "<td><a href=\"{{=recommendation.url}}\">{{=recommendation.title}}</a></td></tr>{{~}}</table>";
            } else {
                tpl = slot.template;
            }
            return doT.template(tpl);
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
