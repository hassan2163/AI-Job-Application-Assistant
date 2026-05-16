const fs = require("fs");

const getResumeText = (req) => {
  if (req.file) {
    return req.file.buffer.toString("utf-8");
  }

  return fs.readFileSync("./data/resume.txt", "utf-8");
};

module.exports = {
  getResumeText,
};