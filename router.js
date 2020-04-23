const express = require("express");
const router = express.Router(); // routeri seadistamine expressis
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");

// USER ROUTES
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
// PROFILE ROUTES
router.get("/profile/:username", userController.ifUserExists, userController.profilePostsScreen);
// POST ROUTES
router.get("/create-post", userController.mustBeLoggedIn, postController.viewCreateScreen);
router.post("/create-post", userController.mustBeLoggedIn, postController.create);
router.get("/post/:id", postController.viewSingle); // id on konkreetne postitus, mida kasutaja soovib kuvada
router.get("/post/:id/edit", userController.mustBeLoggedIn, postController.viewEditScreen);
router.post("/post/:id/edit", userController.mustBeLoggedIn, postController.edit);
router.post("/post/:id/delete", userController.mustBeLoggedIn, postController.delete);
router.post("/search/", postController.search);

module.exports = router; // muuda const router teistele failidele kättesaadavaks
