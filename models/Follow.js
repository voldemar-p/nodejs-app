const userCollection = require("../db").db().collection("users");
const followsCollection = require("../db").db().collection("follows");
const ObjectID = require("mongodb").ObjectID;
const User = require("./user");

let Follow = function(followedUsername, authorId) {
    this.followedUsername = followedUsername;
    this.authorId = authorId;
    this.errors = [];
};

// ---------------------------------------- CLEANUP -------------------------------------------------
Follow.prototype.cleanUp = async function() {
    if (typeof(this.followedUsername) != "string") {this.followedUsername = ""};
};

// ---------------------------------------- VALIDATE -------------------------------------------------
Follow.prototype.validate = async function(action) {
    // followed username must exist in db
    let followedAccount = await userCollection.findOne({username: this.followedUsername});
    if (followedAccount) {
        this.followedId = followedAccount._id;
    } else {
        this.errors.push("You cannot follow a user that does not exist.");
    }
    let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)});
    // You cannot start following someone you already follow
    if (action == "create") {
        if (doesFollowAlreadyExist) {
            this.errors.push("You are already following this user.");
        }
    }
    // You cannot stop following someone you do not already follow
    if (action == "delete") {
        if (!doesFollowAlreadyExist) {
            this.errors.push("You cannot stop following someone you do not already follow.");
        }
    }
    // You cannot follow yourself
    if(this.followedId.equals(this.authorId)) {
        this.errors.push("You cannot follow yourself");
    }
};

// ---------------------------------------- CREATE NEW FOLLOW -------------------------------------------------
Follow.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        await this.validate("create");
        if (!this.errors.length) {
            await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)});
            resolve();
        } else {
            reject(this.errors);
        }
    });
};

// ---------------------------------------- UNFOLLOW -------------------------------------------------
Follow.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        await this.validate("delete");
        if (!this.errors.length) {
            await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)});
            resolve();
        } else {
            reject(this.errors);
        }
    });
};

// ---------------------------------------- CHECK IF USER IS FOLLOWING -------------------------------------------------
Follow.isVisitorFollowing = async function(followedId, visitorId) {
    let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectID(visitorId)});
    if (followDoc) {
        return true;
    } else {
        return false;
    }
};

// ---------------------------------------- GET FOLLOWER'S ID -------------------------------------------------
Follow.getFollowersById = function(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let followers = await followsCollection.aggregate([
                {$match: {followedId: id}},
                {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray();
            followers = followers.map(function(follower) {
                // create a user
                let user = new User(follower, true);
                return {username: follower.username, avatar: user.avatar};
            });
            resolve(followers);
        } catch {
            reject();
        }
    });
};

module.exports = Follow;