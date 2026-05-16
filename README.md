# AI Job Application Assistant

AI Job Application Assistant is a full-stack AI-powered web application that helps job seekers analyze job descriptions, evaluate resume fit, and generate tailored job application materials.

The application is designed to support users during the job search process by producing ATS-friendly resume content, personalized cover letters, job match analysis, and interview preparation guidance based on a target job description and candidate resume.

---

## Features

- Analyze job descriptions against a candidate resume
- Generate job match score and fit recommendation
- Identify strengths, gaps, and missing keywords
- Generate tailored ATS-friendly resume content
- Generate personalized cover letters
- Generate interview preparation questions and talking points
- Download tailored resume as a Word document
- Clean frontend dashboard for reviewing generated results
- Backend API built with Node.js and Express
- AI response handling with structured JSON output

---

## Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- Axios
- Google Gemini API / AI model integration
- File system-based resume input

---

## Project Structure

```bash
AI Job Application Assistant/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── data/
│   │   └── resume.txt
│   ├── app.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
