import { useState } from "react";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import "./App.css";

function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");

  const handleAction = async (endpoint, actionName, tabToOpen) => {
    try {
      setError("");
      setResult(null);

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

      const response = await fetch(`http://localhost:3000/api/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Backend did not return JSON. Make sure backend is running on http://localhost:3000."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Something went wrong.");
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to connect to backend. Make sure backend is running on port 3000."
      );
    } finally {
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
    if (!result) return "—";

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

    return "—";
  };

  const hasSection = (sectionName) => {
    return Boolean(getSectionContent(sectionName));
  };

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
    if (y > pageHeight - margin - 30) {
      doc.addPage();
      y = margin;
    }

    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0);
    doc.text(title.toUpperCase(), margin, y);

    y += 5;

    doc.setDrawColor(170);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    return y + 11;
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
    doc.text("•", margin, y);

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
      cleanedSkills.length > 0 ? cleanedSkills.join("  ") : "[Skills]";

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

    const margin = 42;
    const usableWidth = pageWidth - margin * 2;
    let y = 38;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16.5);
    doc.setTextColor(0);
    doc.text(cleanPdfText(contactInfo.fullName).toUpperCase(), margin, y);

    y += 15;

    if (resume.headline) {
      y = addWrappedText(doc, resume.headline, margin, y, usableWidth, {
        fontStyle: "bold",
        fontSize: 9.8,
        lineHeight: 12,
        pageHeight,
        margin,
        color: 25,
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

    doc.save("tailored-resume.pdf");
  };

  const createDocxSectionHeading = (title) =>
    new Paragraph({
      spacing: { before: 220, after: 90 },
      border: {
        bottom: {
          color: "999999",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 21,
          font: "Arial",
        }),
      ],
    });

  const createDocxParagraph = (text, options = {}) =>
    new Paragraph({
      spacing: { after: options.after ?? 80 },
      alignment: options.alignment || AlignmentType.LEFT,
      children: [
        new TextRun({
          text: cleanPdfText(text),
          bold: options.bold || false,
          italics: options.italics || false,
          size: options.size || 19,
          font: "Arial",
          color: options.color || "000000",
        }),
      ],
    });

  const createDocxBullet = (text) =>
    new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 70 },
      children: [
        new TextRun({
          text: cleanPdfText(text).replace(/^[-•]\s*/, ""),
          size: 19,
          font: "Arial",
        }),
      ],
    });

  const downloadTailoredResumeDOCX = async () => {
    const downloadData = await getResumeDataForDownload();

    if (!downloadData) return;

    const { resume, contactInfo } = downloadData;

    const children = [];

    children.push(
      createDocxParagraph(cleanPdfText(contactInfo.fullName).toUpperCase(), {
        bold: true,
        size: 30,
        after: 70,
      })
    );

    children.push(
      createDocxParagraph(
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
      createDocxParagraph(firstContactLine, {
        size: 18,
        after: 30,
        color: "333333",
      })
    );

    children.push(
      createDocxParagraph(contactInfo.linkedin, {
        size: 18,
        after: 120,
        color: "333333",
      })
    );

    children.push(createDocxSectionHeading("Professional Summary"));

    children.push(
      createDocxParagraph(resume.professionalSummary || "[Professional Summary]", {
        size: 19,
        after: 90,
      })
    );

    children.push(createDocxSectionHeading("Core Skills"));

    const skillsText =
      resume.coreSkills && resume.coreSkills.length > 0
        ? resume.coreSkills.map((skill) => cleanPdfText(skill)).join("  ")
        : "[Skills]";

    children.push(
      createDocxParagraph(skillsText, {
        size: 19,
        after: 100,
      })
    );

    children.push(createDocxSectionHeading("Professional Experience"));

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
        children.push(createDocxBullet(item));
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
        createDocxParagraph(roleLine, {
          bold: true,
          size: 19,
          after: 30,
        })
      );

      children.push(
        createDocxParagraph(metaLine, {
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
            children.push(createDocxBullet(bulletText));
          } else {
            children.push(createDocxBullet(bullet));
          }
        });
      } else {
        children.push(
          createDocxBullet("[Add impact-driven responsibility or achievement]")
        );
      }

      children.push(
        new Paragraph({
          spacing: { after: 90 },
        })
      );
    });

    children.push(createDocxSectionHeading("Education"));

    const educationItems =
      resume.education && resume.education.length > 0
        ? resume.education
        : [null];

    educationItems.forEach((edu) => {
      if (!edu) {
        children.push(
          createDocxParagraph(
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
          createDocxParagraph(edu, {
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
        createDocxParagraph(educationLine, {
          size: 19,
        })
      );
    });

    if (resume.certifications && resume.certifications.length > 0) {
      children.push(createDocxSectionHeading("Certifications"));

      resume.certifications.forEach((certification) => {
        children.push(createDocxBullet(certification));
      });
    }

    const wordDocument = new Document({
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

    const blob = await Packer.toBlob(wordDocument);
    saveAs(blob, "tailored-resume.docx");
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

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">AI-Powered Job Application Assistant</p>
          <h1>Job AI Agent</h1>
          <p className="subtitle">
            Analyze job descriptions, tailor your resume, generate cover letters,
            and prepare for interviews in one workflow.
          </p>
        </div>
      </header>

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

        <section className="workspace-card">
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
              <h3>Generating your result...</h3>
              <p>This may take a few seconds depending on Gemini response time.</p>
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
                )}

                {/* {activeTab === "coverLetter" && (
                  <div className="download-actions">
                    <button type="button" disabled>
                      Download PDF
                    </button>

                    <button type="button" disabled>
                      Download Word
                    </button>
                  </div>
                )} */}
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