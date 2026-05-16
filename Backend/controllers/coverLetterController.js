const {
  analyzeCV,
  generateTailoredResume,
  generateCoverLetter,
} = require("../services/aiSharedService");

const { getResumeText } = require("../utils/resumeUtils");
const { runStep } = require("../utils/runStep");

const createCoverLetter = async (req, res) => {
  try {
    console.log("Cover letter request received");

    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Job description is required.",
      });
    }

    const trimmedJobDescription = jobDescription.slice(0, 6000);
    const resume = getResumeText(req);

    const analysisResult = await runStep("Analyze CV for cover letter", () =>
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
      "Generate tailored resume for cover letter",
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

    const coverLetterResult = await runStep("Generate cover letter", () =>
      generateCoverLetter(
        trimmedJobDescription,
        resume,
        analysis,
        tailoredResume
      )
    );

    if (!coverLetterResult.success) {
      return res.status(503).json({
        success: false,
        error: "Cover letter generation failed. Please try again.",
        details: coverLetterResult.error,
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
        coverLetter: coverLetterResult.data,
      },
    });
  } catch (error) {
    console.error("Cover letter error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Unable to generate cover letter right now. Please try again.",
      details: error.message,
    });
  }
};

module.exports = {
  createCoverLetter,
};