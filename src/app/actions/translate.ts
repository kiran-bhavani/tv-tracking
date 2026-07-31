"use server";

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function translateText(text: string) {
  if (!text) return "";
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    const result = await model.generateContent(`Translate the following TV show or movie description into English. Ensure the tone remains engaging and natural. If it is already in English, simply return the original text. Do not include any conversational filler or quotes around it, just the translation:\n\n${text}`);
    return result.response.text().trim() || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate text.");
  }
}
