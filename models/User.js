const bcrypt = require("bcryptjs");
const userCollection = require("../db").db().collection("users");

const validator = require("validator"); // checking if the email is valid
const md5 = require("md5"); // md5 - for hashing gravatar

let User = function(data) {
    this.data = data;
    this.errors = [];
};

// ----------------------------------------------- CLEAN INPUT --------------------------------------------------------------
User.prototype.cleanUp = function() {
    if (typeof(this.data.username) != "string") {this.data.username = ""};
    if (typeof(this.data.email) != "string") {this.data.email = ""};
    if (typeof(this.data.password) != "string") {this.data.password = ""};
    // TAGA, ET KASUTAJA OLEKS SISESTANUD VAID KAKTSEPTEERITAVAD VÄÄRTUSED
    this.data = {
        username: this.data.username.trim().toLowerCase(), // trim eemaldab tühikud
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    };
};

// ----------------------------------------------- VALIDATE --------------------------------------------------------------
User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if  (this.data.username == "") {this.errors.push("You must provide a username")};
        if  (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers")};
        if  (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address")};
        if  (this.data.password == "") {this.errors.push("You must provide a password")};
        if  (this.data.password.length > 0 && this.data.password.length < 12) {this.errors.push("Password must be at least 12 characters")};
        if  (this.data.password.length > 50) {this.errors.push("Password cannot exceed 50 characters")};
        if  (this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least 3 characters")};
        if  (this.data.username.length > 30) {this.errors.push("Username cannot exceed 30 characters")};
    
        // only if username is vaid, check if it is already taken
        if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await userCollection.findOne({username: this.data.username}) // wait until function has finished
            if (usernameExists) {this.errors.push("That username is already taken")}
        }
        // only if email is vaid, check if it is already taken
        if (validator.isEmail(this.data.email)) {
            let emailExists = await userCollection.findOne({email: this.data.email})
            if (emailExists) {this.errors.push("That email is already being used")}
        }
        resolve();
    });
};

// ----------------------------------------------- LOGIN --------------------------------------------------------------
User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp();
        userCollection.findOne({username: this.data.username}).then((attemptedUser) => {
            if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                // bcrypt hashib loginisse sisestatud salasõna ning võrdleb seda andmebaasis oleva hashitud salasõnaga
                this.data = attemptedUser;
                this.getAvatar();
                resolve("congrats"); // successful promise
            } else {
                reject("invalid input"); // unsuccessful promise
            }
        }).catch(function() {
            reject("Please try again later");
        });
    });
};

// ----------------------------------------------- REGISTER --------------------------------------------------------------
User.prototype.register = function() {
    return new Promise(async (resolve, reject) => {
        // 1. validate user data
        this.cleanUp();
        await this.validate();
    
        // 2. only if no validation errors -> save user data to a database
        if (!this.errors.length) {
            // hash user password
            let salt = bcrypt.genSaltSync(10);
            this.data.password = bcrypt.hashSync(this.data.password, salt);
            await userCollection.insertOne(this.data);
            this.getAvatar();
            resolve();
        } else {
            reject(this.errors);
        }
    });
};

User.prototype.getAvatar = function() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
}

module.exports = User;
