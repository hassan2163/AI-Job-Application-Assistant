require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json({ limit: "250kb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: "Too many requests. Please try again later."
  }
});

app.use("/api", limiter);
app.use("/api", routes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "Backend running"
  });
});

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  console.error("Request error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      error: "Resume file is too large. Please upload a .txt file under 2 MB.",
    });
  }

  return res.status(400).json({
    success: false,
    error: err.message || "Invalid request. Please check your inputs.",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Job Agent running on port ${PORT}`);
});
