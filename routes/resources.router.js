const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resources.controller");

// routes
router.post("/upload/single", resourceController.singleUploadHandler);
router.get("/:uuid", resourceController.getFileDetailsByUuid);
router.delete("/:uuid", resourceController.deleteFileByUuid);

module.exports = router;
