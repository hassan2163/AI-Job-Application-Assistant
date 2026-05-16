const express = require("express");

const { createCoverLetter } = require("../controllers/coverLetterController");
const uploadResume = require("../middleware/uploadResume");
const validateJobRequest = require("../middleware/validateJobRequest");

const router = express.Router();

router.post(
  "/",
  uploadResume.single("resume"),
  validateJobRequest,
  createCoverLetter
);

module.exports = router;