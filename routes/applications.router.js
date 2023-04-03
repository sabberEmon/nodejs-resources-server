const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applications.controller");

// routes
router.post("/", applicationController.registerAplication);

module.exports = router;
