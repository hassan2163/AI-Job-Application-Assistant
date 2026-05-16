const { generateContent } = require("./aiService");

const cleanAndParseJSON = (result) => {
  let cleaned = result.trim();

  cleaned = cleaned
    .replace(/```json\s*/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1);
  }

  return JSON.parse(cleaned);
};

const analyzeCV = async (jobDescription, resume) => {
  const prompt = `
You are a senior recruiter, hiring manager, and ATS resume expert.

Analyze the candidate resume against the job description.

Job Description:
${jobDescription}

Candidate Resume:
${resume}

Rules:
- Return valid JSON only.
- Do not include markdown.
- Do not generate a resume.
- Do not generate a cover letter.
- Do not generate interview questions.
- Evaluate only evidence from the resume.
- Do not invent experience, fake tools, certifications, or metrics.
- Be honest about gaps.
- Use the job description requirements to evaluate fit.

Scoring Method:
Start from 50%.
Then apply:
- Strong alignment with critical requirement: +20%
- Partial alignment with requirement: +10%
- Missing critical requirement: -15%
- Missing optional requirement: -5%
- Transferable experience: +5%
- Strong project/implementation experience: +10%
- Strong domain mismatch: -10%

Decision:
- 80% or higher = APPLY
- 60% to 79% = APPLY_WITH_CAUTION
- Below 60% = SKIP

Return only this JSON:

{
  "decision": "APPLY | APPLY_WITH_CAUTION | SKIP",
  "matchScore": "percentage",
  "fitSummary": "Two-line recruiter evaluation.",
  "targetRole": "",
  "targetIndustry": "",
  "strengths": [],
  "gaps": [],
  "matchedKeywords": [],
  "missingKeywords": [],
  "strategy": {
    "positioning": "",
    "whatToSay": "",
    "riskLevel": "LOW | MEDIUM | HIGH"
  }
}
`;

  const result = await generateContent(prompt);
  return cleanAndParseJSON(result);
};

// const generateTailoredResume = async (jobDescription, resume, analysis) => {
//   const prompt = `
// You are an ATS resume writer and senior recruiter.

// Generate a tailored resume based on the job description, candidate resume, and CV analysis.

// Job Description:
// ${jobDescription}

// Candidate Resume:
// ${resume}

// CV Analysis:
// ${JSON.stringify(analysis, null, 2)}

// Rules:
// - Return valid JSON only.
// - Do not include markdown.
// - Generate only the resume section.
// - Do not generate a cover letter.
// - Do not generate interview questions.
// - Do not invent experience, fake tools, certifications, fake metrics, or fake employers.
// - Use only evidence from the candidate resume.
// - Use job description keywords naturally.
// - Make the resume ATS-friendly.
// - Keep the candidate truthful.
// - Resume bullets must be impact-driven.
// - If exact metrics are not provided, write strong impact statements without numbers.
// - Most recent role must have 5–7 bullets.
// - Older roles must have 3–5 bullets.
// - Avoid repeated bullet wording.
// - Tailor the headline, summary, skills, and bullets to the target job.
// - If the job requires domain experience the candidate does not have, position related transferable experience honestly.

// Return only this JSON:

// {
//   "headline": "",
//   "summary": "",
//   "skills": [],
//   "experience": [
//     {
//       "company": "",
//       "title": "",
//       "bullets": []
//     }
//   ],
//   "education": ""
// }
// `;

//   const result = await generateContent(prompt);
//   return cleanAndParseJSON(result);
// };

const generateTailoredResume = async (jobDescription, resume, analysis) => {

  const prompt = `
You are an ATS resume writer, senior recruiter, and resume data-structuring expert.

Generate a tailored resume based on the job description, candidate resume, and CV analysis.

Job Description:
${jobDescription}

Candidate Resume:
${resume}

CV Analysis:
${JSON.stringify(analysis, null, 2)}

Critical Rules:
- Return valid JSON only.
- Do not include markdown.
- Do not include explanations outside JSON.
- Generate only the tailored resume JSON.
- Do not generate a cover letter.
- Do not generate interview questions.
- Do not invent experience, employers, job titles, dates, locations, education, certifications, tools, phone numbers, emails, LinkedIn URLs, or fake metrics.
- Use only evidence from the candidate resume.
- Preserve the candidate's original employers, job titles, dates, locations, education dates, certifications, contact details, and degree details whenever present.
- If a field is missing from the candidate resume, return the placeholder tag for that field.
- Use placeholder tags exactly like: "[Phone]", "[Email]", "[LinkedIn]", "[Dates]", "[Location]", "[Company]", "[Job Title]", "[Institution]", "[Degree]", "[Field of Study]".
- Do not remove fields just because they are missing.
- Do not guess missing dates or locations.
- Do not collapse professional experience into plain text.
- Do not collapse education into plain text.
- Always return professionalExperience as an array of objects.
- Always return education as an array of objects.
- Use job description keywords naturally, but only when they are supported by the candidate resume or clearly transferable.
- Keep the candidate truthful and ATS-friendly.
- Tailor the headline, summary, skills, and bullets to the target job.
- Resume bullets must be impact-driven.
- If exact metrics are not provided, write strong impact statements without fake numbers.
- Most recent role should have 5–7 bullets.
- Older roles should have 3–5 bullets.
- Avoid repeated bullet wording.
- If the job requires domain experience the candidate does not have, position related transferable experience honestly in the summary or bullets, but do not add unsupported tools as skills.

Contact Rules:
- Extract contact details from the candidate resume only.
- If full name is present, return it.
- If city/state/country is present, return it.
- If phone is missing, return "[Phone]".
- If email is missing, return "[Email]".
- If LinkedIn is missing, return "[LinkedIn]".
- Do not create fake phone numbers, emails, or LinkedIn URLs.

Headline Rules:
- Keep headline concise and recruiter-friendly.
- Maximum 85 characters.
- Use this style:
  "Target Role | Key Strength | Relevant Domain"
- Do not use more than 3 parts separated by pipes.
- Do not include exaggerated titles.
- Do not include unsupported tools.
- Do not use phrases like "expert" unless strongly supported by the resume.

Summary Rules:
- Write one strong professional summary paragraph.
- Keep it natural, direct, and recruiter-friendly.
- Avoid generic AI-sounding phrases.
- Mention years of experience only if present in the candidate resume.
- Mention measurable achievements only if present in the candidate resume.
- Do not overfit the summary to tools or platforms that are not in the candidate resume.
- If the job has tools the candidate has not used, describe transferable experience instead of claiming tool experience.

Skills Rules:
- Return 14–20 skills maximum.
- Skills must be short skill names only.
- Do not include explanations, notes, markdown, asterisks, or comments.
- Do not include phrases like "eager to learn", "eager to leverage", "transferable skills", or "familiar with".
- Do not include unsupported tools, platforms, or software unless they appear in the candidate resume.
- If a job tool is not in the candidate resume, do not add it as a skill.
- Skills should be clean noun phrases such as:
  "Business Analysis", "Requirements Gathering", "SDLC", "UAT", "Stakeholder Management".
- Avoid duplicate skills or near-duplicates.
- Do not include long skills that exceed 45 characters unless necessary.

Experience Rules:
For each role:
- Preserve company name from the candidate resume.
- Preserve job title from the candidate resume.
- Preserve dates from the candidate resume.
- Preserve location from the candidate resume.
- If company is missing, return "[Company]".
- If title is missing, return "[Job Title]".
- If dates are missing, return "[Dates]".
- If location is missing, return "[Location]".
- Tailor only the bullets to the target job while staying truthful.
- Do not create fake experience.
- Do not create fake dates.
- Do not create fake locations.
- Do not create fake job titles.
- Keep role order the same as the candidate resume, most recent first.
- Do not remove older roles unless the candidate resume has too many roles and the role is irrelevant.
- Preserve important technical and business achievements from the original resume.

Education Rules:
- Preserve institution name.
- Preserve degree.
- Preserve field of study.
- Preserve full education date range if present, for example "February 2016 - January 2020".
- If only graduation year is present, return that year.
- If education dates are missing, return "[Dates]".
- If institution is missing, return "[Institution]".
- If degree is missing, return "[Degree]".
- If field of study is missing, return "[Field of Study]".
- Do not invent graduation dates, institution names, or degree details.
- Put the full date range in "dates".
- Use "year" only if only a single year is available.

Certification Rules:
- Return certifications only if present in the candidate resume.
- Do not invent certifications.
- If no certifications are present, return an empty array.

Return only this JSON structure:

{
  "contact": {
    "fullName": "",
    "location": "",
    "phone": "[Phone]",
    "email": "[Email]",
    "linkedin": "[LinkedIn]"
  },
  "headline": "",
  "professionalSummary": "",
  "coreSkills": [],
  "professionalExperience": [
    {
      "company": "",
      "title": "",
      "dates": "",
      "location": "",
      "bullets": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "dates": "",
      "year": "",
      "location": ""
    }
  ],
  "certifications": []
}
`;

  const result = await generateContent(prompt);
  return cleanAndParseJSON(result);
};

const generateCoverLetter = async (
  jobDescription,
  resume,
  analysis,
  tailoredResume
) => {

const prompt = `
You are a professional cover letter writer and recruiter.

Generate a tailored cover letter using the job description, candidate resume, CV analysis, and tailored resume.

Job Description:
${jobDescription}

Candidate Resume:
${resume}

CV Analysis:
${JSON.stringify(analysis, null, 2)}

Tailored Resume:
${JSON.stringify(tailoredResume, null, 2)}

Rules:
- Return valid JSON only.
- Do not include markdown.
- Generate only the cover letter.
- Cover letter must be first person.
- Cover letter must be between 120 and 150 words.
- Count the words before responding.
- If the cover letter is under 120 words, expand it.
- If the cover letter is over 150 words, shorten it.
- Do not mention the word count in the response.
- Cover letter must NOT start with "I am writing", "I am excited to apply", "I am writing to express", or "I am excited to express".
- Start with a strong, direct sentence about the candidate's value.
- Good opening example style: "My experience leading enterprise system transformations aligns strongly with this role."
- Do not invent experience, fake tools, fake certifications, or fake metrics.
- Use only evidence from the candidate resume and tailored resume.
- Make it confident, natural, and recruiter-friendly.
- Align the candidate’s background with the target role.
- Do not sound generic.
- Do not overuse buzzwords.
- If the candidate does not have direct domain experience, position transferable experience honestly.

Final check before responding:
- The response must be valid JSON.
- The cover letter must be 120–150 words.
- The cover letter must be written in first person.
- The cover letter must not invent experience.
- The first sentence must not start with "I am writing", "I am excited", "I am writing to express", or "I am excited to express".
- Before responding, check the first 5 words of the cover letter. If they include "I am writing" or "I am excited", rewrite the opening.

Return only this JSON:

{
  "coverLetter": ""
}
`;

  const result = await generateContent(prompt);
  return cleanAndParseJSON(result);
};

const generateInterviewPrep = async (
  jobDescription,
  resume,
  analysis,
  tailoredResume
) => {
  const prompt = `
You are an interview coach, hiring manager, and recruiter.

Generate interview preparation based on the job description, candidate resume, CV analysis, and tailored resume.

Job Description:
${jobDescription}

Candidate Resume:
${resume}

CV Analysis:
${JSON.stringify(analysis, null, 2)}

Tailored Resume:
${JSON.stringify(tailoredResume, null, 2)}

Rules:
- Return valid JSON only.
- Do not include markdown.
- Do not generate a resume.
- Do not generate a cover letter.
- Generate interview preparation only.
- Questions must be relevant to the target job.
- Answers must sound like the candidate speaking.
- Answers must be truthful and based only on the resume.
- Do not invent experience, tools, certifications, employers, or fake metrics.
- Include behavioral, technical, and role-specific questions.
- Keep answers clear, confident, and practical.
- If the candidate has a gap, show how to answer it honestly using transferable experience.
- whatToSay must be spoken in first person by the candidate.
- questionsToAskEmployer must be thoughtful and relevant to the role.

Return only this JSON:

{
  "topQuestions": [
    {
      "question": "",
      "answer": ""
    }
  ],
  "candidatePitch": "",
  "weaknessHandling": "",
  "questionsToAskEmployer": []
}
`;

  const result = await generateContent(prompt);
  return cleanAndParseJSON(result);
};

module.exports = { analyzeCV, generateTailoredResume, generateCoverLetter, generateInterviewPrep };