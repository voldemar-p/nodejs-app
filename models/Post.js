const postsCollection = require("../db").db().collection("posts"); // muutuja postsCollection = mongodb andmebaasi kollektsioon "posts"
const followsCollection = require("../db").db().collection("follows");
const ObjectID = require("mongodb").ObjectID; // mongodb viis kasutajanime salvestamiseks objektina
const User = require("./User");
const sanitizeHTML = require("sanitize-html");

let Post = function(data, userid, requestedPostId) {
    this.data = data;
    this.errors = [];
    this.userid = userid;
    this.requestedPostId = requestedPostId;
};

// ----------------------------------------------- CLEAN INPUT --------------------------------------------------------------
Post.prototype.cleanUp = function() {
    if (typeof(this.data.title) != "string") {this.data.title = ""}; // kui create posti sisestatud pealkiri ei ole string, siis ära aktsepteeri seda
    if (typeof(this.data.body) != "string") {this.data.body = ""};
    // TAGA, ET KASUTAJA OLEKS SISESTANUD VAID KAKTSEPTEERITAVAD VÄÄRTUSED
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}), // allowed tags: 0, attributes: 0
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
        createdDate: new Date(),
        author: ObjectID(this.userid)
    };
};

// ----------------------------------------------- VALIDATE --------------------------------------------------------------
Post.prototype.validate = function() {
    if (this.data.title == "") {this.errors.push("You must provide a title.")};
    if (this.data.body == "") {this.errors.push("You must provide post content.")};
};

// ----------------------------------------------- CREATE A POST --------------------------------------------------------------
Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp();
        this.validate();
        if (!this.errors.lentgh) {
            // if there are no errors, save post into mongodb database
            postsCollection.insertOne(this.data).then((info) => {
                resolve(info.ops[0]._id);
            }).catch(() => {
                this.errors.push("Please try again later");
                reject(this.errors); // väljasta error
            });
        } else {
            reject(this.errors);
        }
    });
};

// ----------------------------------------------- UPDATE A POST --------------------------------------------------------------
Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userid);
            if (post.isVisitorOwner) {
                let status = await this.actuallyUpdate();
                resolve(status);
            }   else {
                reject();
            }
        } catch {
            reject();
        }
    });
};

// ----------------------------------------------- ACTUALLY UPDATE A POST --------------------------------------------------------------
Post.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        this.validate();
        if (!this.errors.lentgh) {
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}});
            resolve("success");
        } else {
            resolve("failure");
        }
    });
};

// ----------------------------------------------- REUSABLE POST QUERY --------------------------------------------------------------
Post.reusablePostQuery = function(uniqueOperations, visitorId) {
    return new Promise(async function(resolve, reject) {
        let aggOperations = uniqueOperations.concat([ // concat -> lisab uue array olemasolevasse arraysse
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}}, // look up something from another collection
            {$project: { // what fields we want the returned object to contain
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ]);
        let posts = await postsCollection.aggregate(aggOperations).toArray();
        // clean up author property in each post object
        posts = posts.map(function(post) {
            post.isVisitorOwner = post.authorId.equals(visitorId);
            post.authorId = undefined; // peidab frontendis autori id
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            };
            return post;
        });
        resolve(posts);
    });
};

// ----------------------------------------------- FIND SINGLE POST BY ID --------------------------------------------------------------
Post.findSingleById = function(id, visitorId) {
    return new Promise(async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject();
            return
        }
        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId);

        if (posts.length) {
            console.log(posts[0]);
            resolve(posts[0]);
        } else {
            reject();
        }
    });
};

// ----------------------------------------------- FIND AUTHOR BY ID --------------------------------------------------------------
Post.findByAuthorId = function(authorId) {
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}}
    ])
};

// ----------------------------------------------- DELETE POST --------------------------------------------------------------
Post.delete = function(postIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(postIdToDelete, currentUserId);
            if (post.isVisitorOwner) {
                await postsCollection.deleteOne({_id: new ObjectID(postIdToDelete)});
                resolve();
            } else {
                reject();
            }
        } catch {
            reject();
        }
    });
};

// ----------------------------------------------- SEARCH FOR POST --------------------------------------------------------------
Post.search = function(searchTerm) {
    return new Promise(async (resolve, reject) => {
        if (typeof(searchTerm) == "string") {
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: searchTerm}}},
                {$sort: {score: {$meta: "textScore"}}}
            ]);
            resolve(posts);
        } else {
            reject();
        }
    });
};

// ----------------------------------------------- COUNT POSTS BY AUTHOR --------------------------------------------------------------
Post.countPostsByAuthor = function(id) {
    return new Promise(async (resolve, reject) => {
        let postCount = await postsCollection.countDocuments({author: id});
        resolve(postCount);
    });
};

// ----------------------------------------------- GET USER FEED --------------------------------------------------------------
Post.getFeed = async function(id) {
    // create an array of user id-s that the current user follows
    let followedUsers = await followsCollection.find({authorId: new ObjectID(id)}).toArray();
    followedUsers = followedUsers.map(function(followDoc) {
        return followDoc.followedId;
    });
    // look for posts where author is in the above array of followed users
    return Post.reusablePostQuery([
        {$match: {author: {$in: followedUsers}}},
        {$sort: {createdDate: -1}} // uued postitused on kõige ees
    ]);
};

module.exports = Post;
