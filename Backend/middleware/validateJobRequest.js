const { body, validationResult } = require("express-validator");

const validateJobRequest = [
  body("jobDescription")
    .trim()
    .notEmpty()
    .withMessage("Job description is required.")
    .isLength({ min: 50, max: 10000 })
    .withMessage("Job description must be between 50 and 10,000 characters."),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => err.msg),
      });
    }

    next();
  },
];

module.exports = validateJobRequest;