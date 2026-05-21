import { useState } from "react";
import "./App.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const RESUME_STYLES = [
  {
    id: "classic",
    name: "Classic ATS",
    description: "Clean black-and-white format for conservative applications.",
    accent: "#111827",
    docxAccent: "111827",
    font: "Arial",
    bullet: "-",
  },
  {
    id: "modern",
    name: "Modern Blue",
    description: "Polished accent style for tech, analyst, and product roles.",
    accent: "#2563eb",
    docxAccent: "2563EB",
    font: "Arial",
    bullet: "-",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Sharper section rhythm for senior and client-facing roles.",
    accent: "#0f766e",
    docxAccent: "0F766E",
    font: "Georgia",
    bullet: "-",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Tighter spacing when you need to keep content concise.",
    accent: "#7c2d12",
    docxAccent: "7C2D12",
    font: "Arial",
    bullet: "-",
  },
];

function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [resumeStyle, setResumeStyle] = useState("modern");

  const activeResumeStyle =
    RESUME_STYLES.find((style) => style.id === resumeStyle) || RESUME_STYLES[0];

  const goToWorkspaceTab = (tabId) => {
    setActiveTab(tabId);

    window.requestAnimationFrame(() => {
      document
        .getElementById("results-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const goToTemplates = () => {
    setActiveTab("tailoredResume");

    window.requestAnimationFrame(() => {
      document
        .getElementById("resume-templates")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleAction = async (endpoint, actionName, tabToOpen) => {
    let timeoutId;

    try {
      setError("");
      setResult(null);

      if (!API_BASE_URL) {
        setError(
          "Frontend API URL is not configured. Add VITE_API_URL to frontend/.env using frontend/.env.example."
        );
        return;
      }

      if (!jobDescription.trim()) {
        setError("Please paste the job description first.");
        return;
      }

      if (!resumeFile) {
        setError("Please upload your resume as a .txt file.");
        return;
      }

      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      formData.append("resume", resumeFile);

      setLoadingAction(actionName);
      setActiveTab(tabToOpen);

      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 120000);

      const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Backend did not return JSON. Make sure the backend is running and VITE_API_URL points to it."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Something went wrong.");
      }

      setResult(data);
    } catch (err) {
      if (err.name === "AbortError") {
        setError(
          "The request timed out while AI was generating. Please try again with a shorter resume or job description."
        );
        return;
      }

      setError(
        err.message ||
          "Unable to connect to the backend. Make sure it is running and the frontend .env API URL is correct."
      );
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      setLoadingAction("");
    }
  };

  const formatTitle = (text) => {
    return text
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return <p className="muted">No content available yet.</p>;
    }

    if (typeof value === "string" || typeof value === "number") {
      return <p>{value}</p>;
    }

    if (Array.isArray(value)) {
      return (
        <ul>
          {value.map((item, index) => (
            <li key={index}>
              {typeof item === "object" ? renderValue(item) : item}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === "object") {
      return (
        <div className="content-group">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="content-block">
              <h4>{formatTitle(key)}</h4>
              {renderValue(val)}
            </div>
          ))}
        </div>
      );
    }

    return <p>{String(value)}</p>;
  };

  const getSectionContent = (sectionName) => {
    if (!result) return null;

    const actualResult = result.data || result.result || result.output || result;

    const sectionMap = {
      analysis: [
        "analysis",
        "resumeAnalysis",
        "cvAnalysis",
        "jobAnalysis",
        "matchAnalysis",
        "analyze",
        "analysisResult",
      ],
      tailoredResume: [
        "tailoredResume",
        "resume",
        "optimizedResume",
        "tailoredCv",
        "tailoredCV",
        "tailoredResumeResult",
      ],
      coverLetter: [
        "coverLetter",
        "letter",
        "coverLetterResult",
        "generatedCoverLetter",
      ],
      interviewPrep: [
        "interviewPrep",
        "interviewQuestions",
        "interview",
        "interviewPrepResult",
      ],
    };

    const possibleKeys = sectionMap[sectionName] || [];

    for (const key of possibleKeys) {
      if (actualResult[key]) {
        return actualResult[key];
      }
    }

    if (sectionName === "analysis") {
      return actualResult;
    }

    return null;
  };

  const getSummaryValue = (keys) => {
    if (!result) return "-";

    const actualResult = result.data || result.result || result.output || result;

    for (const key of keys) {
      if (actualResult[key]) return actualResult[key];

      if (actualResult.analysis && actualResult.analysis[key]) {
        return actualResult.analysis[key];
      }

      if (actualResult.resumeAnalysis && actualResult.resumeAnalysis[key]) {
        return actualResult.resumeAnalysis[key];
      }
    }

    return "-";
  };

  const hasSection = (sectionName) => {
    return Boolean(getSectionContent(sectionName));
  };

  const getResultErrors = () => {
    if (!result || !Array.isArray(result.errors)) return [];
    return result.errors;
  };

  const hexToRgb = (hex) => {
    const normalized = hex.replace("#", "");
    const value = parseInt(normalized, 16);

    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  };

  const getCompletedSectionCount = () =>
    tabs.filter((tab) => hasSection(tab.id)).length;

  const cleanPdfText = (text = "") => {
    return String(text)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E\u2013\u2014\u2022]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getValue = (obj, possibleKeys) => {
    if (!obj || typeof obj !== "object") return "";

    for (const key of possibleKeys) {
      if (obj[key]) return obj[key];

      const matchedKey = Object.keys(obj).find(
        (existingKey) => existingKey.toLowerCase() === key.toLowerCase()
      );

      if (matchedKey && obj[matchedKey]) return obj[matchedKey];
    }

    return "";
  };

  const normalizeArray = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
      return value
        .split(/\n|•/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [value];
  };

  const extractContactFromText = (text = "") => {
    const cleanText = cleanPdfText(text);

    const emailMatch = cleanText.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );

    const phoneMatch = cleanText.match(
      /(\+?\d{1,3}[\s.-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/
    );

    const linkedInMatch = cleanText.match(
      /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+\/?/i
    );

    const lines = text
      .split("\n")
      .map((line) => cleanPdfText(line))
      .filter(Boolean);

    const name =
      lines.find((line) => {
        const lower = line.toLowerCase();
        const wordCount = line.split(/\s+/).length;

        return (
          wordCount >= 2 &&
          wordCount <= 5 &&
          line.length <= 50 &&
          !lower.includes("@") &&
          !lower.includes("linkedin") &&
          !lower.includes("phone") &&
          !lower.includes("email") &&
          !lower.includes("summary") &&
          !lower.includes("experience") &&
          !lower.includes("skills") &&
          !lower.includes("education") &&
          !lower.includes("resume")
        );
      }) || "";

    const location =
      lines.find((line) => {
        const lower = line.toLowerCase();

        return (
          line.includes(",") &&
          line.length <= 90 &&
          !lower.includes("@") &&
          !lower.includes("linkedin") &&
          !lower.includes("summary") &&
          !lower.includes("experience") &&
          !lower.includes("skills") &&
          !lower.includes("education")
        );
      }) || "";

    return {
      fullName: name || "[Full Name]",
      location: location || "[Location]",
      phone: phoneMatch ? cleanPdfText(phoneMatch[0]) : "[Phone]",
      email: emailMatch ? cleanPdfText(emailMatch[0]) : "[Email]",
      linkedin: linkedInMatch ? cleanPdfText(linkedInMatch[0]) : "[LinkedIn]",
    };
  };

  const normalizeTailoredResume = (content) => {
    if (!content) return null;

    if (typeof content === "string") {
      return {
        contact: {},
        headline: "[Target Role / Professional Headline]",
        professionalSummary: content,
        coreSkills: [],
        professionalExperience: [],
        education: [],
        certifications: [],
      };
    }

    const contact = getValue(content, ["contact", "contactInfo", "personalInfo"]);

    const headline =
      getValue(content, [
        "headline",
        "title",
        "targetTitle",
        "resumeHeadline",
      ]) || "[Target Role / Professional Headline]";

    const professionalSummary =
      getValue(content, [
        "professionalSummary",
        "summary",
        "profile",
        "careerSummary",
      ]) || "[Professional Summary]";

    const coreSkills = normalizeArray(
      getValue(content, [
        "coreSkills",
        "skills",
        "technicalSkills",
        "keySkills",
        "competencies",
      ])
    );

    const professionalExperience = normalizeArray(
      getValue(content, [
        "professionalExperience",
        "experience",
        "workExperience",
        "employmentHistory",
      ])
    );

    const education = normalizeArray(
      getValue(content, ["education", "academicBackground"])
    );

    const certifications = normalizeArray(
      getValue(content, [
        "certifications",
        "certificates",
        "licenses",
        "professionalCertifications",
      ])
    );

    return {
      contact,
      headline,
      professionalSummary,
      coreSkills,
      professionalExperience,
      education,
      certifications,
    };
  };

  const getResumeDataForDownload = async () => {
    const tailoredResumeContent = getSectionContent("tailoredResume");

    if (!tailoredResumeContent) {
      alert(
        "No tailored resume content available yet. Please generate Tailor Resume first."
      );
      return null;
    }

    let uploadedResumeText = "";

    if (resumeFile) {
      uploadedResumeText = await resumeFile.text();
    }

    const extractedContact = extractContactFromText(uploadedResumeText);
    const resume = normalizeTailoredResume(tailoredResumeContent);

    const responseContact =
      resume.contact && typeof resume.contact === "object" ? resume.contact : {};

    const contactInfo = {
      fullName:
        cleanPdfText(getValue(responseContact, ["fullName", "name"])) ||
        extractedContact.fullName ||
        "[Full Name]",

      location:
        cleanPdfText(getValue(responseContact, ["location", "address"])) ||
        extractedContact.location ||
        "[Location]",

      phone:
        cleanPdfText(getValue(responseContact, ["phone", "phoneNumber"])) ||
        extractedContact.phone ||
        "[Phone]",

      email:
        cleanPdfText(getValue(responseContact, ["email", "emailAddress"])) ||
        extractedContact.email ||
        "[Email]",

      linkedin:
        cleanPdfText(getValue(responseContact, ["linkedin", "linkedIn"])) ||
        extractedContact.linkedin ||
        "[LinkedIn]",
    };

    return { resume, contactInfo };
  };

  const getCandidateContactInfo = async () => {
    let uploadedResumeText = "";

    if (resumeFile) {
      uploadedResumeText = await resumeFile.text();
    }

    const extractedContact = extractContactFromText(uploadedResumeText);
    const tailoredResume = normalizeTailoredResume(getSectionContent("tailoredResume"));
    const responseContact =
      tailoredResume?.contact && typeof tailoredResume.contact === "object"
        ? tailoredResume.contact
        : {};

    return {
      fullName:
        cleanPdfText(getValue(responseContact, ["fullName", "name"])) ||
        extractedContact.fullName ||
        "[Full Name]",

      location:
        cleanPdfText(getValue(responseContact, ["location", "address"])) ||
        extractedContact.location ||
        "[Location]",

      phone:
        cleanPdfText(getValue(responseContact, ["phone", "phoneNumber"])) ||
        extractedContact.phone ||
        "[Phone]",

      email:
        cleanPdfText(getValue(responseContact, ["email", "emailAddress"])) ||
        extractedContact.email ||
        "[Email]",

      linkedin:
        cleanPdfText(getValue(responseContact, ["linkedin", "linkedIn"])) ||
        extractedContact.linkedin ||
        "[LinkedIn]",
    };
  };

  const extractHiringContactName = (text = "") => {
    const patterns = [
      /(?:hiring manager|recruiter|contact|reports to|send to)[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/,
      /dear\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);

      if (match?.[1]) {
        const name = cleanPdfText(match[1]);
        const lower = name.toLowerCase();

        if (!["hiring manager", "recruiter", "candidate"].includes(lower)) {
          return name;
        }
      }
    }

    return "";
  };

  const normalizeCoverLetterText = (content) => {
    const raw =
      typeof content === "string"
        ? content
        : getValue(content, ["coverLetter", "letter", "body", "content"]);

    return cleanPdfText(raw)
      .replace(/^dear\s+[^,]+,?\s*/i, "")
      .replace(/(?:sincerely|regards|best regards),?\s*.*$/i, "")
      .trim();
  };

  const getCoverLetterDataForDownload = async () => {
    const coverLetterContent = getSectionContent("coverLetter");

    if (!coverLetterContent) {
      alert("No cover letter available yet. Please generate the cover letter first.");
      return null;
    }

    const letterBody = normalizeCoverLetterText(coverLetterContent);

    if (!letterBody) {
      alert("The cover letter content is empty. Please generate it again.");
      return null;
    }

    const contactInfo = await getCandidateContactInfo();
    const hiringContactName = extractHiringContactName(jobDescription);

    return {
      contactInfo,
      greeting: hiringContactName
        ? `Dear ${hiringContactName},`
        : "Dear Hiring Manager,",
      letterBody,
      closingName: cleanPdfText(contactInfo.fullName) || "[Full Name]",
    };
  };

  const addWrappedText = (doc, text, x, y, maxWidth, options = {}) => {
    const {
      fontStyle = "normal",
      fontSize = 9.5,
      lineHeight = 12,
      pageHeight,
      margin,
      color = 20,
    } = options;

    const cleanedText = cleanPdfText(text);

    if (!cleanedText) return y;

    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color);

    const lines = doc.splitTextToSize(cleanedText, maxWidth);

    lines.forEach((line) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.text(line, x, y);
      y += lineHeight;
    });

    return y;
  };

  const addSectionHeading = (doc, title, y, pageWidth, pageHeight, margin) => {
    const accent = hexToRgb(activeResumeStyle.accent);

    if (y > pageHeight - margin - 30) {
      doc.addPage();
      y = margin;
    }

    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.text(title.toUpperCase(), margin, y);

    y += 5;

    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(activeResumeStyle.id === "executive" ? 1.1 : 0.6);
    doc.line(margin, y, pageWidth - margin, y);

    return y + (activeResumeStyle.id === "compact" ? 8 : 11);
  };

  const addBullet = (doc, text, y, pageWidth, pageHeight, margin) => {
    const cleanedText = cleanPdfText(text).replace(/^[-•]\s*/, "");

    if (!cleanedText) return y;

    const usableWidth = pageWidth - margin * 2;
    const bulletIndent = 13;

    if (y > pageHeight - margin - 24) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    doc.setTextColor(20);
    doc.text(activeResumeStyle.bullet, margin, y);

    y = addWrappedText(
      doc,
      cleanedText,
      margin + bulletIndent,
      y,
      usableWidth - bulletIndent,
      {
        fontSize: 9.2,
        lineHeight: 11.5,
        pageHeight,
        margin,
      }
    );

    return y + 1.5;
  };

  const addSkillsLine = (doc, skills, y, pageWidth, pageHeight, margin) => {
    const usableWidth = pageWidth - margin * 2;

    const cleanedSkills = skills
      .map((skill) => cleanPdfText(skill))
      .filter(Boolean);

    const skillsText =
      cleanedSkills.length > 0 ? cleanedSkills.join(" | ") : "[Skills]";

    return addWrappedText(doc, skillsText, margin, y, usableWidth, {
      fontSize: 9.2,
      lineHeight: 12,
      pageHeight,
      margin,
      color: 20,
    });
  };

  const addExperienceItem = (doc, item, y, pageWidth, pageHeight, margin) => {
    const usableWidth = pageWidth - margin * 2;

    if (typeof item === "string") {
      return addBullet(doc, item, y, pageWidth, pageHeight, margin);
    }

    const company =
      cleanPdfText(getValue(item, ["company", "employer", "organization"])) ||
      "[Company]";

    const title =
      cleanPdfText(getValue(item, ["title", "role", "position", "jobTitle"])) ||
      "[Job Title]";

    const dates =
      cleanPdfText(getValue(item, ["dates", "duration", "period"])).replace(
        /\s-\s/g,
        " - "
      ) || "[Dates]";

    const location =
      cleanPdfText(getValue(item, ["location", "city"])) || "[Location]";

    const bullets = normalizeArray(
      getValue(item, ["bullets", "responsibilities", "achievements", "details"])
    );

    if (y > pageHeight - margin - 88) {
      doc.addPage();
      y = margin;
    }

    const roleLine = [company, title].filter(Boolean).join(" | ");

    if (roleLine) {
      y = addWrappedText(doc, roleLine, margin, y, usableWidth, {
        fontStyle: "bold",
        fontSize: 9.8,
        lineHeight: 12.3,
        pageHeight,
        margin,
        color: 0,
      });
    }

    const metaLine = [dates, location].filter(Boolean).join(" | ");

    if (metaLine) {
      y = addWrappedText(doc, metaLine, margin, y, usableWidth, {
        fontStyle: "normal",
        fontSize: 9.2,
        lineHeight: 11.5,
        pageHeight,
        margin,
        color: 35,
      });
    }

    y += 3;

    if (bullets.length > 0) {
      bullets.forEach((bullet) => {
        if (typeof bullet === "object") {
          const bulletText = Object.values(bullet).filter(Boolean).join(" ");
          y = addBullet(doc, bulletText, y, pageWidth, pageHeight, margin);
        } else {
          y = addBullet(doc, bullet, y, pageWidth, pageHeight, margin);
        }
      });
    } else {
      y = addBullet(
        doc,
        "[Add impact-driven responsibility or achievement]",
        y,
        pageWidth,
        pageHeight,
        margin
      );
    }

    return y + 6;
  };

  const addEducationItem = (doc, edu, y, pageWidth, pageHeight, margin) => {
    const usableWidth = pageWidth - margin * 2;

    if (!edu) {
      return addWrappedText(
        doc,
        "[Institution] | [Degree] in [Field of Study] | [Dates]",
        margin,
        y,
        usableWidth,
        {
          fontSize: 9.5,
          lineHeight: 12,
          pageHeight,
          margin,
        }
      );
    }

    if (typeof edu === "string") {
      return addWrappedText(doc, edu, margin, y, usableWidth, {
        fontSize: 9.5,
        lineHeight: 12,
        pageHeight,
        margin,
      });
    }

    const institution =
      cleanPdfText(getValue(edu, ["institution", "school", "university"])) ||
      "[Institution]";

    const degree = cleanPdfText(getValue(edu, ["degree"])) || "[Degree]";

    const field =
      cleanPdfText(getValue(edu, ["field", "fieldOfStudy", "major"])) ||
      "[Field of Study]";

    const dates =
      cleanPdfText(getValue(edu, ["dates", "year", "graduationYear", "period"])) ||
      "[Dates]";

    const location = cleanPdfText(getValue(edu, ["location"]));

    const degreeLine =
      degree && field
        ? `${degree} in ${field}`
        : [degree, field].filter(Boolean).join(" ");

    const educationLine = [institution, degreeLine, dates, location]
      .filter(Boolean)
      .join(" | ");

    return addWrappedText(doc, educationLine, margin, y, usableWidth, {
      fontStyle: "normal",
      fontSize: 9.5,
      lineHeight: 12,
      pageHeight,
      margin,
    });
  };

  const downloadTailoredResumePDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const downloadData = await getResumeDataForDownload();

    if (!downloadData) return;

    const { resume, contactInfo } = downloadData;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const accent = hexToRgb(activeResumeStyle.accent);

    const margin = activeResumeStyle.id === "compact" ? 34 : 42;
    const usableWidth = pageWidth - margin * 2;
    let y = activeResumeStyle.id === "modern" ? 48 : 38;

    if (activeResumeStyle.id === "modern") {
      doc.setFillColor(accent.r, accent.g, accent.b);
      doc.rect(0, 0, 14, pageHeight, "F");
    }

    if (activeResumeStyle.id === "executive") {
      doc.setDrawColor(accent.r, accent.g, accent.b);
      doc.setLineWidth(1.4);
      doc.line(margin, 28, pageWidth - margin, 28);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(activeResumeStyle.id === "compact" ? 15 : 16.5);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.text(cleanPdfText(contactInfo.fullName).toUpperCase(), margin, y);

    y += 15;

    if (resume.headline) {
      y = addWrappedText(doc, resume.headline, margin, y, usableWidth, {
        fontStyle: "bold",
        fontSize: 9.8,
        lineHeight: 12,
        pageHeight,
        margin,
        color: activeResumeStyle.id === "classic" ? 25 : activeResumeStyle.accent,
      });
    }

    const firstContactLine = [
      contactInfo.location,
      contactInfo.phone,
      contactInfo.email,
    ]
      .map((item) => cleanPdfText(item))
      .filter(Boolean)
      .join(" | ");

    y = addWrappedText(doc, firstContactLine, margin, y, usableWidth, {
      fontSize: 9,
      lineHeight: 11.5,
      pageHeight,
      margin,
      color: 35,
    });

    y = addWrappedText(doc, contactInfo.linkedin, margin, y, usableWidth, {
      fontSize: 9,
      lineHeight: 11.5,
      pageHeight,
      margin,
      color: 35,
    });

    y += 4;

    if (resume.professionalSummary) {
      y = addSectionHeading(
        doc,
        "Professional Summary",
        y,
        pageWidth,
        pageHeight,
        margin
      );

      y = addWrappedText(
        doc,
        resume.professionalSummary,
        margin,
        y,
        usableWidth,
        {
          fontSize: 9.3,
          lineHeight: 11.7,
          pageHeight,
          margin,
        }
      );
    }

    y = addSectionHeading(doc, "Core Skills", y, pageWidth, pageHeight, margin);
    y = addSkillsLine(doc, resume.coreSkills, y, pageWidth, pageHeight, margin);

    if (resume.professionalExperience.length > 0) {
      y = addSectionHeading(
        doc,
        "Professional Experience",
        y,
        pageWidth,
        pageHeight,
        margin
      );

      resume.professionalExperience.forEach((item) => {
        y = addExperienceItem(doc, item, y, pageWidth, pageHeight, margin);
      });
    } else {
      y = addSectionHeading(
        doc,
        "Professional Experience",
        y,
        pageWidth,
        pageHeight,
        margin
      );

      y = addExperienceItem(
        doc,
        {
          company: "[Company]",
          title: "[Job Title]",
          dates: "[Dates]",
          location: "[Location]",
          bullets: ["[Add impact-driven responsibility or achievement]"],
        },
        y,
        pageWidth,
        pageHeight,
        margin
      );
    }

    y = addSectionHeading(doc, "Education", y, pageWidth, pageHeight, margin);

    if (resume.education.length > 0) {
      resume.education.forEach((edu) => {
        y = addEducationItem(doc, edu, y, pageWidth, pageHeight, margin);
        y += 3;
      });
    } else {
      y = addEducationItem(doc, null, y, pageWidth, pageHeight, margin);
    }

    if (resume.certifications.length > 0) {
      y = addSectionHeading(
        doc,
        "Certifications",
        y,
        pageWidth,
        pageHeight,
        margin
      );

      resume.certifications.forEach((certification) => {
        y = addBullet(doc, certification, y, pageWidth, pageHeight, margin);
      });
    }

    doc.save(`tailored-resume-${activeResumeStyle.id}.pdf`);
  };

  const createDocxSectionHeading = (docx, title) =>
    new docx.Paragraph({
      spacing: { before: 220, after: 90 },
      border: {
        bottom: {
          color: activeResumeStyle.docxAccent,
          space: 1,
          style: docx.BorderStyle.SINGLE,
          size: activeResumeStyle.id === "executive" ? 9 : 6,
        },
      },
      children: [
        new docx.TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 21,
          font: activeResumeStyle.font,
          color: activeResumeStyle.docxAccent,
        }),
      ],
    });

  const createDocxParagraph = (docx, text, options = {}) =>
    new docx.Paragraph({
      spacing: { after: options.after ?? 80 },
      alignment: options.alignment || docx.AlignmentType.LEFT,
      children: [
        new docx.TextRun({
          text: cleanPdfText(text),
          bold: options.bold || false,
          italics: options.italics || false,
          size: options.size || 19,
          font: activeResumeStyle.font,
          color: options.color || "000000",
        }),
      ],
    });

  const createDocxBullet = (docx, text) =>
    new docx.Paragraph({
      bullet: { level: 0 },
      spacing: { after: 70 },
      children: [
        new docx.TextRun({
          text: cleanPdfText(text).replace(/^[-•]\s*/, ""),
          size: 19,
          font: activeResumeStyle.font,
        }),
      ],
    });

  const downloadTailoredResumeDOCX = async () => {
    const docx = await import("docx");
    const { saveAs } = await import("file-saver");
    const downloadData = await getResumeDataForDownload();

    if (!downloadData) return;

    const { resume, contactInfo } = downloadData;

    const children = [];

    children.push(
      createDocxParagraph(docx, cleanPdfText(contactInfo.fullName).toUpperCase(), {
        bold: true,
        size: 30,
        after: 70,
        color: activeResumeStyle.docxAccent,
      })
    );

    children.push(
      createDocxParagraph(docx, 
        resume.headline || "[Target Role / Professional Headline]",
        {
          bold: true,
          size: 20,
          after: 50,
        }
      )
    );

    const firstContactLine = [
      contactInfo.location,
      contactInfo.phone,
      contactInfo.email,
    ]
      .map((item) => cleanPdfText(item))
      .filter(Boolean)
      .join(" | ");

    children.push(
      createDocxParagraph(docx, firstContactLine, {
        size: 18,
        after: 30,
        color: "333333",
      })
    );

    children.push(
      createDocxParagraph(docx, contactInfo.linkedin, {
        size: 18,
        after: 120,
        color: "333333",
      })
    );

    children.push(createDocxSectionHeading(docx, "Professional Summary"));

    children.push(
      createDocxParagraph(docx, resume.professionalSummary || "[Professional Summary]", {
        size: 19,
        after: 90,
      })
    );

    children.push(createDocxSectionHeading(docx, "Core Skills"));

    const skillsText =
      resume.coreSkills && resume.coreSkills.length > 0
        ? resume.coreSkills.map((skill) => cleanPdfText(skill)).join(" | ")
        : "[Skills]";

    children.push(
      createDocxParagraph(docx, skillsText, {
        size: 19,
        after: 100,
      })
    );

    children.push(createDocxSectionHeading(docx, "Professional Experience"));

    const experienceItems =
      resume.professionalExperience && resume.professionalExperience.length > 0
        ? resume.professionalExperience
        : [
            {
              company: "[Company]",
              title: "[Job Title]",
              dates: "[Dates]",
              location: "[Location]",
              bullets: ["[Add impact-driven responsibility or achievement]"],
            },
          ];

    experienceItems.forEach((item) => {
      if (typeof item === "string") {
        children.push(createDocxBullet(docx, item));
        return;
      }

      const company =
        cleanPdfText(getValue(item, ["company", "employer", "organization"])) ||
        "[Company]";

      const title =
        cleanPdfText(getValue(item, ["title", "role", "position", "jobTitle"])) ||
        "[Job Title]";

      const dates =
        cleanPdfText(getValue(item, ["dates", "duration", "period"])) ||
        "[Dates]";

      const location =
        cleanPdfText(getValue(item, ["location", "city"])) || "[Location]";

      const roleLine = [company, title].filter(Boolean).join(" | ");
      const metaLine = [dates, location].filter(Boolean).join(" | ");

      children.push(
        createDocxParagraph(docx, roleLine, {
          bold: true,
          size: 19,
          after: 30,
        })
      );

      children.push(
        createDocxParagraph(docx, metaLine, {
          size: 18,
          after: 50,
          color: "333333",
        })
      );

      const bullets = normalizeArray(
        getValue(item, ["bullets", "responsibilities", "achievements", "details"])
      );

      if (bullets.length > 0) {
        bullets.forEach((bullet) => {
          if (typeof bullet === "object") {
            const bulletText = Object.values(bullet).filter(Boolean).join(" ");
            children.push(createDocxBullet(docx, bulletText));
          } else {
            children.push(createDocxBullet(docx, bullet));
          }
        });
      } else {
        children.push(
          createDocxBullet(docx, "[Add impact-driven responsibility or achievement]")
        );
      }

      children.push(
        new docx.Paragraph({
          spacing: { after: 90 },
        })
      );
    });

    children.push(createDocxSectionHeading(docx, "Education"));

    const educationItems =
      resume.education && resume.education.length > 0
        ? resume.education
        : [null];

    educationItems.forEach((edu) => {
      if (!edu) {
        children.push(
          createDocxParagraph(docx, 
            "[Institution] | [Degree] in [Field of Study] | [Dates]",
            {
              size: 19,
            }
          )
        );
        return;
      }

      if (typeof edu === "string") {
        children.push(
          createDocxParagraph(docx, edu, {
            size: 19,
          })
        );
        return;
      }

      const institution =
        cleanPdfText(getValue(edu, ["institution", "school", "university"])) ||
        "[Institution]";

      const degree = cleanPdfText(getValue(edu, ["degree"])) || "[Degree]";

      const field =
        cleanPdfText(getValue(edu, ["field", "fieldOfStudy", "major"])) ||
        "[Field of Study]";

      const dates =
        cleanPdfText(
          getValue(edu, ["dates", "year", "graduationYear", "period"])
        ) || "[Dates]";

      const location = cleanPdfText(getValue(edu, ["location"]));

      const degreeLine =
        degree && field
          ? `${degree} in ${field}`
          : [degree, field].filter(Boolean).join(" ");

      const educationLine = [institution, degreeLine, dates, location]
        .filter(Boolean)
        .join(" | ");

      children.push(
        createDocxParagraph(docx, educationLine, {
          size: 19,
        })
      );
    });

    if (resume.certifications && resume.certifications.length > 0) {
      children.push(createDocxSectionHeading(docx, "Certifications"));

      resume.certifications.forEach((certification) => {
        children.push(createDocxBullet(docx, certification));
      });
    }

    const wordDocument = new docx.Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children,
        },
      ],
    });

    const blob = await docx.Packer.toBlob(wordDocument);
    saveAs(blob, `tailored-resume-${activeResumeStyle.id}.docx`);
  };

  const downloadCoverLetterPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const letterData = await getCoverLetterDataForDownload();

    if (!letterData) return;

    const { contactInfo, greeting, letterBody, closingName } = letterData;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 54;
    const usableWidth = pageWidth - margin * 2;
    const accent = hexToRgb(activeResumeStyle.accent);
    let y = 54;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.text(cleanPdfText(contactInfo.fullName).toUpperCase(), margin, y);

    y += 16;

    const contactLine = [
      contactInfo.location,
      contactInfo.phone,
      contactInfo.email,
      contactInfo.linkedin,
    ]
      .map((item) => cleanPdfText(item))
      .filter(Boolean)
      .join(" | ");

    y = addWrappedText(doc, contactLine, margin, y, usableWidth, {
      fontSize: 9,
      lineHeight: 11.5,
      pageHeight,
      margin,
      color: 45,
    });

    y += 28;

    y = addWrappedText(doc, greeting, margin, y, usableWidth, {
      fontSize: 10.5,
      lineHeight: 14,
      pageHeight,
      margin,
      color: 20,
    });

    y += 12;

    const paragraphs = letterBody
      .split(/\n{2,}|(?<=\.)\s+(?=[A-Z])/)
      .map((paragraph) => cleanPdfText(paragraph))
      .filter(Boolean);

    paragraphs.forEach((paragraph) => {
      y = addWrappedText(doc, paragraph, margin, y, usableWidth, {
        fontSize: 10.2,
        lineHeight: 14.5,
        pageHeight,
        margin,
        color: 20,
      });
      y += 10;
    });

    y += 14;
    y = addWrappedText(doc, "Regards,", margin, y, usableWidth, {
      fontSize: 10.5,
      lineHeight: 14,
      pageHeight,
      margin,
      color: 20,
    });

    y = addWrappedText(doc, closingName, margin, y + 8, usableWidth, {
      fontStyle: "bold",
      fontSize: 10.5,
      lineHeight: 14,
      pageHeight,
      margin,
      color: activeResumeStyle.accent,
    });

    doc.save(`cover-letter-${activeResumeStyle.id}.pdf`);
  };

  const downloadCoverLetterDOCX = async () => {
    const docx = await import("docx");
    const { saveAs } = await import("file-saver");
    const letterData = await getCoverLetterDataForDownload();

    if (!letterData) return;

    const { contactInfo, greeting, letterBody, closingName } = letterData;
    const contactLine = [
      contactInfo.location,
      contactInfo.phone,
      contactInfo.email,
      contactInfo.linkedin,
    ]
      .map((item) => cleanPdfText(item))
      .filter(Boolean)
      .join(" | ");

    const paragraphs = letterBody
      .split(/\n{2,}|(?<=\.)\s+(?=[A-Z])/)
      .map((paragraph) => cleanPdfText(paragraph))
      .filter(Boolean);

    const children = [
      createDocxParagraph(docx, cleanPdfText(contactInfo.fullName).toUpperCase(), {
        bold: true,
        size: 30,
        after: 60,
        color: activeResumeStyle.docxAccent,
      }),
      createDocxParagraph(docx, contactLine, {
        size: 18,
        after: 280,
        color: "333333",
      }),
      createDocxParagraph(docx, greeting, {
        size: 21,
        after: 160,
      }),
      ...paragraphs.map((paragraph) =>
        createDocxParagraph(docx, paragraph, {
          size: 21,
          after: 170,
        })
      ),
      createDocxParagraph(docx, "Regards,", {
        size: 21,
        after: 100,
      }),
      createDocxParagraph(docx, closingName, {
        bold: true,
        size: 21,
        after: 80,
        color: activeResumeStyle.docxAccent,
      }),
    ];

    const wordDocument = new docx.Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children,
        },
      ],
    });

    const blob = await docx.Packer.toBlob(wordDocument);
    saveAs(blob, `cover-letter-${activeResumeStyle.id}.docx`);
  };

  const tabs = [
    { id: "analysis", label: "Analysis" },
    { id: "tailoredResume", label: "Tailored Resume" },
    { id: "coverLetter", label: "Cover Letter" },
    { id: "interviewPrep", label: "Interview Prep" },
  ];

  const tabDetails = {
    analysis: {
      title: "Resume & Job Match Analysis",
      description:
        "Review how well your resume matches the job description, including strengths, gaps, and improvement areas.",
    },
    tailoredResume: {
      title: "Tailored Resume",
      description:
        "Optimized resume content aligned with the selected job description and ATS keywords.",
    },
    coverLetter: {
      title: "Cover Letter",
      description:
        "A customized cover letter written for the target role using your background and the job requirements.",
    },
    interviewPrep: {
      title: "Interview Preparation",
      description:
        "Role-specific interview questions, talking points, and suggested answers to help you prepare.",
    },
  };

  const activeContent = getSectionContent(activeTab);
  const currentTab = tabDetails[activeTab];
  const completedSections = getCompletedSectionCount();
  const jobCharacterCount = jobDescription.trim().length;

  return (
    <div className="app">
      <nav className="topbar">
        <div className="brand-mark">
          <span>RA</span>
          <strong>Resume Agent</strong>
        </div>
        <div className="topbar-links" aria-label="Builder sections">
          <button type="button" onClick={() => goToWorkspaceTab("analysis")}>
            ATS Score
          </button>
          <button type="button" onClick={goToTemplates}>
            Templates
          </button>
          <button type="button" onClick={() => goToWorkspaceTab("coverLetter")}>
            Cover Letter
          </button>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AI-Powered Job Application Assistant</p>
          <h1>Build a job-ready resume in one focused workflow.</h1>
          <p className="subtitle">
            Import your resume, match it to the role, choose a download style,
            and generate the resume, cover letter, and recruiter talking points.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              onClick={() =>
                handleAction("job-agent", "Job Agent / All", "analysis")
              }
              disabled={loadingAction}
            >
              Generate Full Kit
            </button>
            <span>{completedSections}/4 sections ready</span>
          </div>
        </div>

        <div className="builder-preview" aria-label="Resume builder preview">
          <div className="resume-sheet">
            <div className="sheet-header" />
            <div className="sheet-line wide" />
            <div className="sheet-line" />
            <div className="sheet-section" />
            <div className="sheet-line wide" />
            <div className="sheet-line mid" />
            <div className="sheet-section" />
            <div className="sheet-bullets">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="preview-score">
            <span>ATS Match</span>
            <strong>
              {getSummaryValue([
                "matchScore",
                "score",
                "atsScore",
                "fitScore",
                "matchPercentage",
              ])}
            </strong>
            <small>{activeResumeStyle.name}</small>
          </div>
        </div>
      </header>

      <section className="builder-steps" aria-label="Resume builder steps">
        <article>
          <span>1</span>
          <div>
            <h3>Import resume</h3>
            <p>Upload a plain-text resume and keep the content honest.</p>
          </div>
        </article>
        <article>
          <span>2</span>
          <div>
            <h3>Add job target</h3>
            <p>Paste the role description to drive ATS and recruiter fit.</p>
          </div>
        </article>
        <article>
          <span>3</span>
          <div>
            <h3>Generate with AI</h3>
            <p>Create tailored resume, letter, strengths, gaps, and pitch.</p>
          </div>
        </article>
        <article>
          <span>4</span>
          <div>
            <h3>Download style</h3>
            <p>Export PDF or Word in the format that fits the application.</p>
          </div>
        </article>
      </section>

      <main className="dashboard">
        <section className="sidebar-card">
          <div className="card-header">
            <h2>Job Input</h2>
            <p>Paste the job description and upload your resume.</p>
          </div>

          <div className="form-group">
            <label>Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
            />
            <div className="input-meta">
              <span>{jobCharacterCount.toLocaleString()} characters</span>
              <span>{jobCharacterCount >= 50 ? "Ready to analyze" : "Add more detail"}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Upload Resume</label>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => setResumeFile(e.target.files[0])}
            />

            {resumeFile && (
              <p className="file-name">Uploaded: {resumeFile.name}</p>
            )}

            <p className="hint">
              Current version supports .txt resume files. PDF and DOCX support
              can be added later.
            </p>
          </div>

          <div className="style-panel" id="resume-templates">
            <div className="style-heading">
              <div>
                <div className="section-kicker">Resume Style</div>
                <h3>Choose your template</h3>
              </div>
              <span>{activeResumeStyle.name}</span>
            </div>
            <div className="style-options">
              {RESUME_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={
                    resumeStyle === style.id ? "style-option active" : "style-option"
                  }
                  onClick={() => setResumeStyle(style.id)}
                >
                  <span
                    className="style-swatch"
                    style={{ background: style.accent }}
                  />
                  <span className="template-mini" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>
                    <strong>{style.name}</strong>
                    <small>{style.description}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="actions">
            <button
              onClick={() => handleAction("analyze", "Analyze CV", "analysis")}
              disabled={loadingAction}
            >
              Analyze CV
            </button>

            <button
              onClick={() =>
                handleAction("tailor-resume", "Tailor Resume", "tailoredResume")
              }
              disabled={loadingAction}
            >
              Tailor Resume
            </button>

            <button
              onClick={() =>
                handleAction("cover-letter", "Cover Letter", "coverLetter")
              }
              disabled={loadingAction}
            >
              Cover Letter
            </button>

            <button
              onClick={() =>
                handleAction("interview-prep", "Interview Prep", "interviewPrep")
              }
              disabled={loadingAction}
            >
              Interview Prep
            </button>

            <button
              className="primary"
              onClick={() =>
                handleAction("job-agent", "Job Agent / All", "analysis")
              }
              disabled={loadingAction}
            >
              Job Agent / All
            </button>
          </div>
        </section>

        <section className="workspace-card" id="results-workspace">
          <div className="workspace-header">
            <div>
              <p className="workspace-label">Application Package</p>
              <h2>Professional Result Workspace</h2>
              <p>
                Review your job match, tailored resume, cover letter, and
                interview prep in separate sections.
              </p>
            </div>

            {loadingAction && (
              <span className="status-pill">Working on: {loadingAction}</span>
            )}
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <span>Match Score</span>
              <strong>
                {getSummaryValue([
                  "matchScore",
                  "score",
                  "atsScore",
                  "fitScore",
                  "matchPercentage",
                ])}
              </strong>
            </div>

            <div className="summary-card">
              <span>Decision</span>
              <strong>
                {getSummaryValue([
                  "decision",
                  "recommendation",
                  "applyDecision",
                  "fitDecision",
                ])}
              </strong>
            </div>

            <div className="summary-card">
              <span>Resume</span>
              <strong>
                {hasSection("tailoredResume") ? "Ready" : "Pending"}
              </strong>
            </div>

            <div className="summary-card">
              <span>Cover Letter</span>
              <strong>{hasSection("coverLetter") ? "Ready" : "Pending"}</strong>
            </div>
          </div>

          <div className="progress-strip">
            <div>
              <span>Generation progress</span>
              <strong>{completedSections} of 4 sections</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${(completedSections / 4) * 100}%` }} />
            </div>
          </div>

          <div className="template-showcase">
            <div>
              <span>Selected download style</span>
              <strong>{activeResumeStyle.name}</strong>
              <p>{activeResumeStyle.description}</p>
            </div>
            <div className="showcase-docs" aria-hidden="true">
              <span className="doc-card primary-doc" />
              <span className="doc-card secondary-doc" />
              <span className="doc-card tertiary-doc" />
            </div>
          </div>

          <div className="tabs professional-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "tab active" : "tab"}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                <small>{hasSection(tab.id) ? "Generated" : "Not generated"}</small>
              </button>
            ))}
          </div>

          {error && <div className="error">{error}</div>}

          {result?.partialSuccess && getResultErrors().length > 0 && (
            <div className="warning">
              <strong>Some sections need another try.</strong>
              <ul>
                {getResultErrors().map((item, index) => (
                  <li key={`${item.section || "section"}-${index}`}>
                    {formatTitle(item.section || "Section")}:{" "}
                    {item.error || "Generation failed."}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!result && !error && !loadingAction && (
            <div className="empty-state">
              <h3>Your results will appear here</h3>
              <p>
                Start with Analyze CV or use Job Agent / All to generate the
                complete application package.
              </p>
            </div>
          )}

          {loadingAction && (
            <div className="loading-card">
              <div className="spinner"></div>
              <h3>{loadingAction} is running</h3>
              <p>
                The backend is analyzing the job description and resume with
                AI. Larger inputs may take a minute or two.
              </p>
            </div>
          )}

          {result && !loadingAction && (
            <div className="result-card">
              <div className="result-card-header professional-result-header">
                <div>
                  <h3>{currentTab.title}</h3>
                  <p>{currentTab.description}</p>
                </div>

                {activeTab === "tailoredResume" && (
                  <div className="download-stack">
                    <span>{activeResumeStyle.name} export</span>
                    <div className="download-actions">
                      <button
                        type="button"
                        onClick={downloadTailoredResumePDF}
                        disabled={!hasSection("tailoredResume")}
                      >
                        Download PDF
                      </button>

                      <button
                        type="button"
                        onClick={downloadTailoredResumeDOCX}
                        disabled={!hasSection("tailoredResume")}
                      >
                        Download Word
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "coverLetter" && (
                  <div className="download-stack">
                    <span>Formatted letter export</span>
                    <div className="download-actions">
                      <button
                        type="button"
                        onClick={downloadCoverLetterPDF}
                        disabled={!hasSection("coverLetter")}
                      >
                        Download PDF
                      </button>

                      <button
                        type="button"
                        onClick={downloadCoverLetterDOCX}
                        disabled={!hasSection("coverLetter")}
                      >
                        Download Word
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="result-content">
                {activeContent ? (
                  renderValue(activeContent)
                ) : (
                  <div className="empty-section">
                    <h3>No content in this section yet</h3>
                    <p>
                      Run the related action button or use Job Agent / All to
                      generate this section.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
