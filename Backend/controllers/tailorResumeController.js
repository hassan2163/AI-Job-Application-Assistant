const {
  analyzeCV,
  generateTailoredResume,
} = require("../services/aiSharedService");

const { getResumeText } = require("../utils/resumeUtils");
const { runStep } = require("../utils/runStep");

const tailorResume = async (req, res) => {
  try {
    console.log("Tailor resume request received");

    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Job description is required.",
      });
    }

    const trimmedJobDescription = jobDescription.slice(0, 6000);
    const resume = getResumeText(req);

    const analysisResult = await runStep("Analyze CV for tailored resume", () =>
      analyzeCV(trimmedJobDescription, resume)
    );

    if (!analysisResult.success) {
      return res.status(503).json({
        success: false,
        error: "CV analysis failed. Please try again.",
        details: analysisResult.error,
      });
    }

    const analysis = analysisResult.data;

    const tailoredResumeResult = await runStep("Generate tailored resume", () =>
      generateTailoredResume(trimmedJobDescription, resume, analysis)
    );

    if (!tailoredResumeResult.success) {
      return res.status(503).json({
        success: false,
        error: "Tailored resume generation failed. Please try again.",
        details: tailoredResumeResult.error,
        data: {
          analysis,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        analysis,
        tailoredResume: tailoredResumeResult.data,
      },
    });
  } catch (error) {
    console.error("Tailor resume error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Unable to tailor resume right now. Please try again.",
      details: error.message,
    });
  }
};

module.exports = {
  tailorResume,
};