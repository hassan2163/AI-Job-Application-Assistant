const express = require("express");

const { processJob } = require("../controllers/jobAgentControllers");
const uploadResume = require("../middleware/uploadResume");
const validateJobRequest = require("../middleware/validateJobRequest");

const router = express.Router();

router.post(
  "/",
  uploadResume.single("resume"),
  validateJobRequest,
  processJob
);

module.exports = router;