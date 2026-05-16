const {
  analyzeCV,
  generateTailoredResume,
  generateInterviewPrep,
} = require("../services/aiSharedService");

const { getResumeText } = require("../utils/resumeUtils");
const { runStep } = require("../utils/runStep");

const createInterviewPrep = async (req, res) => {
  try {
    console.log("Interview prep request received");

    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Job description is required.",
      });
    }

    const trimmedJobDescription = jobDescription.slice(0, 6000);
    const resume = getResumeText(req);

    const analysisResult = await runStep("Analyze CV for interview prep", () =>
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

    const tailoredResumeResult = await runStep(
      "Generate tailored resume for interview prep",
      () => generateTailoredResume(trimmedJobDescription, resume, analysis)
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

    const tailoredResume = tailoredResumeResult.data;

    const interviewPrepResult = await runStep("Generate interview prep", () =>
      generateInterviewPrep(
        trimmedJobDescription,
        resume,
        analysis,
        tailoredResume
      )
    );

    if (!interviewPrepResult.success) {
      return res.status(503).json({
        success: false,
        error: "Interview prep generation failed. Please try again.",
        details: interviewPrepResult.error,
        data: {
          analysis,
          tailoredResume,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        analysis,
        tailoredResume,
        interviewPrep: interviewPrepResult.data,
      },
    });
  } catch (error) {
    console.error("Interview prep error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Unable to generate interview prep right now. Please try again.",
      details: error.message,
    });
  }
};

module.exports = {
  createInterviewPrep,
};