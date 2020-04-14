const User = require("../models/User");

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) { // if promise is successful
        req.session.user = {username: user.data.username};
        req.session.save(function() {
            res.redirect("/");
        });
    }).catch(function(e) { // e -> error (if promise is unsuccessful)
        req.flash("errors", e); // req.session.flash.errors = [e]
        req.session.save(function() {
            res.redirect("/");
        });
    });
};

exports.logout = function(req, res) {
    req.session.destroy(function() { // lõpeta sessioon
        res.redirect("/"); // kui sessioon on lõpetatud, suuna tagasi kodulehele
    });
};

exports.register = function(req, res) {
    let user = new User(req.body);
    user.register();
    if (user.errors.length) {
        res.send(user.errors);
    } else {
        res.send("Congrats, no errors");
    }
};

exports.home = function(req, res) {
    if (req.session.user) {
        res.render("home-dashboard", {username: req.session.user.username}); // muudab kasutajanime antud ejs failile dünaamiliselt kättesaaadavaks
    } else {
        res.render("home-guest", {errors: req.flash("errors")}); // ejs method for template rendering + flash package adding extra message
    }
};
