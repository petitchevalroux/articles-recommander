/* eslint-env browser */
/* eslint no-console: 0 */
"use strict";

(function artRecLib(window) {
    var lib = {
        "addSlot": function(target, count) {
            console.log(target, count);
        },
        "start": function() {}
    };
    try {
        var slots = window.artRecSlots;
        slots.forEach(function(options) {
            lib.addSlot(options.target, options.count);
        });
        lib.start();
    } catch (e) {
        console.log("artrec error: " + e);
    }

})(window);
