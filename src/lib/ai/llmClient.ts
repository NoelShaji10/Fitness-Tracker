import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface GeminiOptions {
  model?: string;
  systemInstruction?: string;
  responseMimeType?: "application/json" | "text/plain";
}

/**
 * Calls the Gemini API to generate content.
 * Fallback mode returns a mocked response when the API key is missing or calls fail.
 */
export async function generateGeminiContent(
  prompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  const modelName = options.model || "gemini-1.5-flash"; // Standard, fast flash model
  const systemInstruction = options.systemInstruction;
  const mimeType = options.responseMimeType;

  if (!genAI) {
    console.error("Gemini API Client is not initialized due to missing API key.");
    throw new Error("Gemini API key is not configured.");
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: mimeType ? { responseMimeType: mimeType } : undefined,
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response received from Gemini API.");
    }

    return text;
  } catch (error) {
    console.error("Error in generateGeminiContent:", error);
    throw error;
  }
}
