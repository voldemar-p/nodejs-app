const Post = require("../models/Post");

// ----------------------------------------------- CREATE POST PAGE --------------------------------------------------------------
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

// ----------------------------------------------- VIEW SINGLE POST --------------------------------------------------------------
exports.viewSingle = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id); // urli post id leidmiseks
        res.render("single-post-screen", {post: post});
    } catch {
        res.render("404");
    }
};
