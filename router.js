const express = require("express");
const router = express.Router(); // routeri seadistamine expressis
const userController = require("./controllers/userController");

router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);

module.exports = router; // muuda const router teistele failidele kättesaadavaks
