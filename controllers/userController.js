const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const jwt = require("jsonwebtoken");

// ---------------------------------------- GET USER POSTS THROUGH API -------------------------------------------------
exports.apiGetPostsByUsername = async function(req, res) {
    try {
        let AuthorDoc = await User.findByUsername(req.params.username);
        let posts = await Post.findByAuthorId(AuthorDoc._id);
        res.json(posts);
    } catch {
        res.json("Sorry, invalid user requested.");
    }
};

// ---------------------------------------- CHECK IF API USER IS LOGGED IN -------------------------------------------------
exports.apiMustBeLoggedIn = function(req, res, next) {
    try {
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET); // verify API token
        next();
    } catch {
        res.json("Sorry, you must provide a valid token.");
    };
};

// ---------------------------------------- CHECK IF USERNAME ALREADY EXISTS -------------------------------------------------
exports.doesUsernameExist = function(req, res) {
    User.findByUsername(req.body.username).then(function() {
        res.json(true);
    }).catch(function() {
        res.json(false);
    });
};

// ---------------------------------------- CHECK IF EMAIL ALREADY EXISTS -------------------------------------------------
exports.doesEmailExist = async function(req, res) {
    let emailBool = await User.doesEmailExist(req.body.email);
    res.json(emailBool);
};


// ---------------------------------------- SHARED PROFILE DATA -------------------------------------------------
exports.sharedProfileData = async function(req, res, next) {
    let isVisitorsProfile = false;
    let isFollowing = false;
    if (req.session.user) {
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);
    }
    req.isVisitorsProfile = isVisitorsProfile;
    req.isFollowing = isFollowing;
    // retrieve post, follower and following counts
    let postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
    let followerCountPromise = Follow.countFollowersById(req.profileUser._id);
    let followingCountPromise = Follow.countFollowingById(req.profileUser._id);
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]); // await several promises at once
    req.postCount = postCount;
    req.followerCount = followerCount;
    req.followingCount = followingCount;
    next();
};

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

// ----------------------------------------------- API LOGIN --------------------------------------------------------------
exports.apiLogin = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
        res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: "7d"}));
    }).catch(function(e) {
        res.json("nn");
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
exports.home = async function(req, res) {
    if (req.session.user) {
        // fetch posts feed of current user
        let posts = await Post.getFeed(req.session.user._id);
        res.render("home-dashboard", {posts: posts}); // renderdab kodulehe ejs failist
    } else {
        res.render("home-guest", {regErrors: req.flash("regErrors")}); // adding a flash package (extra dynamic messages integrated into a home page)
    }
};

// ----------------------------------------------- CHECK IF USER EXISTS --------------------------------------------------------------
exports.ifUserExists = function(req, res, next) {
    User.findByUsername(req.params.username).then(function(userDocument) {
        req.profileUser = userDocument;
        next(); 
    }).catch(function() {
        res.render("404");
    });
};

// ----------------------------------------------- SHOW USER POSTS --------------------------------------------------------------
exports.profilePostsScreen = function(req, res) {
    // ask our post model for posts with a certain author id
    Post.findByAuthorId(req.profileUser._id).then(function(posts) {
        res.render("profile", {
            title: `Profile for ${req.profileUser.username}`, // dynamically show username for profile
            currentPage: "posts",
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        });
    }).catch(function() {
        res.render("404");
    });
}

// ----------------------------------------------- SHOW FOLLOWERS SCREEN --------------------------------------------------------------
exports.profileFollowersScreen = async function(req, res) {
    try {
        let followers = await Follow.getFollowersById(req.profileUser._id);
        res.render("profile-followers", {
            currentPage: "followers",
            followers: followers,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        });
    } catch {
        res.render("404");
    }
};

// ----------------------------------------------- SHOW FOLLOWING SCREEN --------------------------------------------------------------
exports.profileFollowingScreen = async function(req, res) {
    try {
        let following = await Follow.getFollowingById(req.profileUser._id);
        res.render("profile-following", {
            currentPage: "following",
            following: following,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile :req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        });
    } catch {
        res.render("404");
    }
};
