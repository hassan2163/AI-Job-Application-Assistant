const {
  analyzeCV,
  generateTailoredResume,
  generateCoverLetter,
  generateInterviewPrep,
} = require("../services/aiSharedService");
const { getResumeText } = require("../utils/resumeUtils");
const { runStep } = require("../utils/runStep");


const processJob = async (req, res) => {
  try {
    console.log("Request received");

    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Job description is required.",
      });
    }

    const trimmedJobDescription = jobDescription.slice(0, 6000);
    //const resume = fs.readFileSync("./data/resume.txt", "utf-8");

    const resume = getResumeText(req);



    const errors = [];

    const analysisResult = await runStep("Step 1: Analyzing CV", () =>
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
      "Step 2: Generating tailored resume",
      () => generateTailoredResume(trimmedJobDescription, resume, analysis)
    );

    if (!tailoredResumeResult.success) {
      errors.push({
        section: "tailoredResume",
        error: tailoredResumeResult.error,
      });
    }

    const tailoredResume = tailoredResumeResult.success
      ? tailoredResumeResult.data
      : null;

    const coverLetterResult = await runStep(
      "Step 3: Generating cover letter",
      () =>
        generateCoverLetter(
          trimmedJobDescription,
          resume,
          analysis,
          tailoredResume || {}
        )
    );

    if (!coverLetterResult.success) {
      errors.push({
        section: "coverLetter",
        error: coverLetterResult.error,
      });
    }

    const coverLetter = coverLetterResult.success
      ? coverLetterResult.data
      : null;

    const interviewPrepResult = await runStep(
      "Step 4: Generating interview prep",
      () =>
        generateInterviewPrep(
          trimmedJobDescription,
          resume,
          analysis,
          tailoredResume || {}
        )
    );

    if (!interviewPrepResult.success) {
      errors.push({
        section: "interviewPrep",
        error: interviewPrepResult.error,
      });
    }

    const interviewPrep = interviewPrepResult.success
      ? interviewPrepResult.data
      : null;

    return res.json({
      success: errors.length === 0,
      partialSuccess: errors.length > 0,
      data: {
        analysis,
        tailoredResume,
        coverLetter,
        interviewPrep,
      },
      errors,
    });
  } catch (error) {
    console.error("Job processing error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Unable to process job description right now. Please try again.",
      details: error.message,
    });
  }
};

module.exports = { processJob };