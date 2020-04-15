const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo")(session);
const app = express();

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
    res.locals.user = req.session.user; // teeb kasutaja info kõigile ejs templatitele kättesaadavaks.
    next();
});

const router = require("./router"); // tagastab router.js faili sisu

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(express.static("public"));

app.set("views", "views"); // (express argument for views, folder name of views)
app.set("view engine", "ejs"); // setting the template engine to be ejs

app.use("/", router);

module.exports = app;