const express = require("express");
const app = express();
const router = require("./router"); // tagastab router.js faili sisu

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(express.static("public"));

app.set("views", "views"); // (express argument for views, folder name of views)
app.set("view engine", "ejs"); // setting the template engine to be ejs

app.use("/", router);

module.exports = app;