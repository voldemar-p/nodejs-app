const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const flash = require("connect-flash");
const markdown = require("marked");
const csrf = require("csurf");
const app = express();
const sanitizeHTML = require("sanitize-html");

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use("/api", require("./router-api")); // API

let sessionOptions = session({ // use session to let users login-logout
    secret: "There are no secrets",
    store: new MongoStore({client: require("./db")}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true} // maxAge: millisekundites -> teeb kokku ühe päeva
});

app.use(sessionOptions); // use the sessionOptions in our app
app.use(flash());

app.use(function(req, res, next) {
    res.locals.filterUserHTML = function(content) {
        return sanitizeHTML(markdown(content), {allowedTags: ["p", "br", "ul", "ol", "li", "strong", "bold", "i", "em", "h1", "h2", "h3", "h4", "h5", "h6"], allowedAttributes: []});
    }
    res.locals.errors = req.flash("errors");
    res.locals.success = req.flash("success");
    if (req.session.user) {  // näitab, kas kasutaja on sisse logitud või ei.
        req.visitorId = req.session.user._id
    } else {
        req.visitorId = 0;
    }
    res.locals.user = req.session.user; // teeb kasutaja info kõigile ejs templatitele kättesaadavaks.
    next();
});

const router = require("./router"); // tagastab router.js faili sisu

app.use(express.static("public"));

app.set("views", "views"); // (express argument for views, folder name of views)
app.set("view engine", "ejs"); // setting the template engine to be ejs

app.use(csrf()); // kasuta csurf tokenit CSRF rünnakute kaitseks
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use("/", router);

app.use(function(err, req, res, next) {
    if (err) {
        if (err.code == "EBADCSRFTOKEN") {
            req.flash("errors", "Cross site request forgery detected.");
            req.session.save(() => res.redirect("/"));
        } else {
            res.render("404");
        }

    }
});

const server = require("http").createServer(app);
const io = require("socket.io")(server);

io.use(function(socket, next) {
    sessionOptions(socket.request, socket.request.res, next);
});

io.on("connection", function(socket) { // use socket.io to broadcast messages through server
    if (socket.request.session.user) {
        let user = socket.request.session.user;
        socket.emit("welcome", {username: user.username, avatar: user.avatar});
        socket.on("chatMessageFromBrowser", function(data) {
            socket.broadcast.emit("chatMessageFromServer", {message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}), username: user.username, avatar: user.avatar});
            // which data is to appear in browser (message, username and avatar)
        });
    };
});

module.exports = server;