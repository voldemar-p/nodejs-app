const express = require("express");
const router = express.Router(); // routeri seadistamine expressis
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");

// USER ROUTES
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
// POST ROUTES
router.get("/create-post", userController.mustBeLoggedIn, postController.viewCreateScreen);

module.exports = router; // muuda const router teistele failidele kättesaadavaks
