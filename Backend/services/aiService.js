const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableGeminiError = (error) => {
  const message = error.message || "";

  return (
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED")
  );
};

const generateContent = async (prompt, options = {}) => {
  const {
    retries = 3,
    model = "gemini-2.5-flash-lite",
    temperature = 0.2,
    topP = 0.8,
    maxOutputTokens = 4000,
  } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Gemini request attempt ${attempt}/${retries}`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature,
          topP,
          maxOutputTokens,
        },
      });

      const text = response.text;

      if (!text || text.trim() === "") {
        throw new Error("Gemini returned an empty response.");
      }

      return text;
    } catch (error) {
      console.error(`Gemini attempt ${attempt} failed:`, error.message);

      const canRetry = isRetryableGeminiError(error);
      const isLastAttempt = attempt === retries;

      if (!canRetry || isLastAttempt) {
        throw new Error("AI service is currently unavailable. Please try again.");
      }

      const delay = 2000 * attempt;
      console.log(`Retrying Gemini request in ${delay / 1000} seconds...`);

      await sleep(delay);
    }
  }
};

module.exports = { generateContent };