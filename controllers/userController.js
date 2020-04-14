const User = require("../models/User");

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) { // if promise is successful
        req.session.user = {username: user.data.username};
        res.send(result);
    }).catch(function(e) { // e -> error (if promise is unsuccessful)
        res.send(e);
    });
};

exports.logout = function() {
    
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
        res.render("home-guest"); // ejs method for template rendering
    }
};
