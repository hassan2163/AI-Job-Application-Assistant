const express = require("express");

const { tailorResume } = require("../controllers/tailorResumeController");
const uploadResume = require("../middleware/uploadResume");
const validateJobRequest = require("../middleware/validateJobRequest");

const router = express.Router();

router.post(
  "/",
  uploadResume.single("resume"),
  validateJobRequest,
  tailorResume
);

module.exports = router;