const express = require("express");

const analyzeRoutes = require("./analyzeRoutes");
const tailorResumeRoutes = require("./tailorResumeRoutes");
const coverLetterRoutes = require("./coverLetterRoutes");
const interviewPrepRoutes = require("./interviewPrepRoutes");
const jobAgentRoutes = require("./jobAgentsRoutes");


const router = express.Router();

router.use("/analyze", analyzeRoutes);
router.use("/tailor-resume", tailorResumeRoutes);
router.use("/cover-letter", coverLetterRoutes);
router.use("/interview-prep", interviewPrepRoutes);
router.use("/job-agent", jobAgentRoutes);
// router.use("/generate-all", generateAllRoutes);

module.exports = router;