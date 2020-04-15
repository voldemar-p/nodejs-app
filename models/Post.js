const postsCollection = require("../db").db().collection("posts"); // muutuja postsCollection = mongodb andmebaasi kollektsioon "posts"
const ObjectID = require("mongodb").ObjectID; // mongodb viis kasutajanime salvestamiseks objektina
const User = require("./User");

let Post = function(data, userid) {
    this.data = data;
    this.errors = [];
    this.userid = userid;
};

// ----------------------------------------------- CLEAN INPUT --------------------------------------------------------------
Post.prototype.cleanUp = function() {
    if (typeof(this.data.title) != "string") {this.data.title = ""}; // kui create posti sisestatud pealkiri ei ole string, siis ära aktsepteeri seda
    if (typeof(this.data.body) != "string") {this.data.body = ""};
    // TAGA, ET KASUTAJA OLEKS SISESTANUD VAID KAKTSEPTEERITAVAD VÄÄRTUSED
    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
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
            postsCollection.insertOne(this.data).then(() => {
                resolve();
            }).catch(() => {
                this.errors.push("Please try again later");
                reject(this.errors); // väljasta error
            });
        } else {
            reject(this.errors);
        }
    });
};

// ----------------------------------------------- FIND SINGLE POST BY ID --------------------------------------------------------------
Post.findSingleById = function(id) {
    return new Promise(async function(resolve, reject) {
        if (typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject();
            return
        }
        let posts = await postsCollection.aggregate([
            {$match: {_id: new ObjectID(id)}}, // check if the id-s matchs
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}}, // look up something from another collection
            {$project: { // what fields we want the returned object to contain
                title: 1,
                body: 1,
                createdDate: 1,
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ]).toArray();
        // clean up author property in each post object
        posts = posts.map(function(post) {
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            };
            return post;
        });

        if (posts.length) {
            console.log(posts[0]);
            resolve(posts[0]);
        } else {
            reject();
        }
    });
};

module.exports = Post;
