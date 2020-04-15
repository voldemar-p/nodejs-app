const User = require("../models/User");


// ---------------------------------------- CHECK IF USER IS LOGGED IN -------------------------------------------------
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
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id};
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
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id};
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
        // renderdab kodulehe ejs failist
    } else {
        res.render("home-guest", {errors: req.flash("errors"), regErrors: req.flash("regErrors")});
        // adding a flash package (extra dynamic messages integrated into a home page)
    }
};
