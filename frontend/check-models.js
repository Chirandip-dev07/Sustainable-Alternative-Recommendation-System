const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
  const apiKey = ""; // from .env
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.models) {
      console.log("AVAILABLE MODELS FOR THIS KEY:");
      data.models.forEach(m => console.log(m.name, "-", m.supportedGenerationMethods.join(", ")));
    } else {
      console.log("Error:", data);
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

checkModels();
