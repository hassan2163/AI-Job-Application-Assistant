const express = require("express");

const { analyzeJob } = require("../controllers/analyzeController");
const uploadResume = require("../middleware/uploadResume");
const validateJobRequest = require("../middleware/validateJobRequest");

const router = express.Router();

router.post(
  "/",
  uploadResume.single("resume"),
  validateJobRequest,
  analyzeJob
);

module.exports = router;