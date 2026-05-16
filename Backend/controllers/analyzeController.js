const { analyzeCV } = require("../services/aiSharedService");
const { getResumeText } = require("../utils/resumeUtils");
const { runStep } = require("../utils/runStep");

const analyzeJob = async (req, res) => {
  try {
    console.log("Analyze request received");

    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Job description is required.",
      });
    }

    const trimmedJobDescription = jobDescription.slice(0, 6000);
    const resume = getResumeText(req);

    const analysisResult = await runStep("Analyze CV only", () =>
      analyzeCV(trimmedJobDescription, resume)
    );

    if (!analysisResult.success) {
      return res.status(503).json({
        success: false,
        error: "CV analysis failed. Please try again.",
        details: analysisResult.error,
      });
    }

    return res.json({
      success: true,
      data: {
        analysis: analysisResult.data,
      },
    });
  } catch (error) {
    console.error("Analyze job error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Unable to analyze job right now. Please try again.",
      details: error.message,
    });
  }
};

module.exports = {
  analyzeJob,
};