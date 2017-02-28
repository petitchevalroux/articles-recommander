"use strict";

module.exports = {
    "redirect": function(req, res) {
        if (!req.query.to || typeof(req.query.to) !== "string") {
            res.status(400);
            res.send("Bad request");
            return;
        }
        res.redirect(req.query.to);
    }
};
