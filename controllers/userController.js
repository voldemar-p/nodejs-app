const User = require("../models/User");

exports.mustBeLoggedIn = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.flash("errors", "You must be logged in to perform that action");
        req.session.save(function() {
            res.redirect("/");
        });
    }
};

// ----------------------------------------------- LOGIN --------------------------------------------------------------
exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) { // if promise is successful
        req.session.user = {avatar: user.avatar, username: user.data.username};
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

// ----------------------------------------------- LOGOUT --------------------------------------------------------------
exports.logout = function(req, res) {
    req.session.destroy(function() { // lõpeta sessioon
        res.redirect("/"); // kui sessioon on lõpetatud, suuna tagasi kodulehele
    });
};

// ----------------------------------------------- REGISTER --------------------------------------------------------------
exports.register = function(req, res) {
    let user = new User(req.body);
    user.register().then(() => {
        req.session.user = {avatar: user.avatar, username: user.data.username};
        req.session.save(function() {
            res.redirect("/");
        });
    }).catch((regErrors) => {
        regErrors.forEach(function(error) {
            req.flash("regErrors", error); // array and an item you want to push into an array
        });
        req.session.save(function() {
            res.redirect("/");
        });
    });
};

// ----------------------------------------------- HOME PAGE --------------------------------------------------------------
exports.home = function(req, res) {
    if (req.session.user) {
        res.render("home-dashboard");
        // muudab kasutajanime antud ejs failile dünaamiliselt kättesaaadavaks
    } else {
        res.render("home-guest", {errors: req.flash("errors"), regErrors: req.flash("regErrors")});
        // ejs method for template rendering + flash package adding extra message
    }
};
