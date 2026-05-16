const express = require("express");

const { createInterviewPrep } = require("../controllers/interviewPrepController");
const uploadResume = require("../middleware/uploadResume");
const validateJobRequest = require("../middleware/validateJobRequest");

const router = express.Router();

router.post(
  "/",
  uploadResume.single("resume"),
  validateJobRequest,
  createInterviewPrep
);

module.exports = router;