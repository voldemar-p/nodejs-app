const Post = require("../models/Post");

// ----------------------------------------------- POST PAGE --------------------------------------------------------------
exports.viewCreateScreen = function(req, res) {
    res.render("create-post");
};

// ----------------------------------------------- CREATE A POST --------------------------------------------------------------
exports.create = function(req, res) {
    let post = new Post(req.body, req.session.user._id); // talleta postituse requestiga ka kasutaja _id
    post.create().then(function() {
        res.send("New post created");
    }).catch(function(errors) {
        res.send(errors);
    });
};
