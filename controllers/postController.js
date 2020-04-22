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
        let post = await Post.findSingleById(req.params.id, req.visitorId); // urli post id leidmiseks
        res.render("single-post-screen", {post: post});
    } catch {
        res.render("404");
    }
};

// ----------------------------------------------- VIEW EDIT POST PAGE --------------------------------------------------------------
exports.viewEditScreen = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id)
        res.render("edit-post", {post: post});
    } catch {
        res.render("404");
    }
};

// ----------------------------------------------- EDIT THE POST --------------------------------------------------------------
exports.edit = function(req, res) {
    let post = new Post(req.body, req.visitorId, req.params.id);
    post.update().then((status) => {
        // the post was successfully updated in the database
        // or user had permission, but there were validation errors
        if (status == "success") {
            // post was updated in db
            req.flash("success", "Post successfully updated");
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`);
            })
        } else {
            post.errorsforEach(function(error) {
                req.flash("errors", error);
            });
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`);
            })
        }
    }).catch(() => {
        // if post with a requested id doesnt exist
        // or if the current visitor is not the owner of the current post
        req.flash("errors", "You do not have permission to perform that action.");
        req.session.save(function() {
            res.redirect("/");  
        });
    });
}
