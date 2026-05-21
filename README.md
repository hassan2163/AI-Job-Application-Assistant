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
- AI model integration
- File upload-based resume input

---

## Local Development

Run the backend:

```bash
cd Backend
npm install
npm run dev
```

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend local environment:

```bash
VITE_API_URL=http://localhost:5000
```

Backend local environment:

```bash
PORT=5000
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_api_key_here
```

---

## Deployment

Recommended MVP deployment:

- Frontend: GitHub Pages
- Backend: Render Web Service

GitHub Pages frontend:

1. In GitHub, set repository secret `VITE_API_URL` to your Render backend URL.
2. Example:

```bash
VITE_API_URL=https://your-render-backend.onrender.com
```

3. Enable GitHub Pages with GitHub Actions as the source.
4. Push to `main`. The workflow in `.github/workflows/deploy-frontend.yml` builds and deploys `frontend/dist`.

Render backend:

1. Create a new Render Web Service from this repo.
2. Use the included `render.yaml` blueprint or configure manually:

```bash
Root Directory: Backend
Build Command: npm install
Start Command: npm start
```

3. Add Render environment variables:

```bash
GEMINI_API_KEY=your_real_api_key
FRONTEND_URL=https://hassan2163.github.io
```

Render provides `PORT` automatically. The backend already uses `process.env.PORT || 5000`.

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
