const userCollection = require("../db").collection("users");

const validator = require("validator"); // checking if the email is valid

let User = function(data) {
    this.data = data;
    this.errors = [];
};

User.prototype.cleanUp = function() {
    if (typeof(this.data.username) != "string") {this.data.username = ""};
    if (typeof(this.data.email) != "string") {this.data.email = ""};
    if (typeof(this.data.password) != "string") {this.data.password = ""};

    // taga, et kasutaja edastaks vaid küsitud väärtused
    this.data = {
        username: this.data.username.trim().toLowerCase(), // trim eemaldab tühikud
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    };
};

User.prototype.validate = function() {
    if  (this.data.username == "") {this.errors.push("You must provide a username")};
    if  (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers")};
    if  (!validator.isEmail(this.data.email)) {this.errors.push("You must provide a valid email address")};
    if  (this.data.password == "") {this.errors.push("You must provide a password")};
    if  (this.data.password.length > 0 && this.data.password.length < 12) {this.errors.push("Password must be at least 12 characters")};
    if  (this.data.password.length > 100) {this.errors.push("Password cannot exceed 100 characters")};
    if  (this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("Username must be at least 3 characters")};
    if  (this.data.username.length > 30) {this.errors.push("Username cannot exceed 30 characters")};
};

User.prototype.login = function(callback) {
    this.cleanUp();
    userCollection.findOne({username: this.data.username}, (err, attemptedUser) => {
        if (attemptedUser && attemptedUser.password == this.data.password) {
            callback("congrats");
        } else {
            callback("invalid insert");
        }
    });
};

User.prototype.register = function() {
    // 1. validate user data
    this.cleanUp();
    this.validate();

    // 2. only if no validation errors -> save user data to a database
    if (!this.errors.length) {
        userCollection.insertOne(this.data);
    }
};

module.exports = User;
