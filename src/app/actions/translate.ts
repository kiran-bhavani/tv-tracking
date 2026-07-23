"use server";

import { GoogleGenAI } from '@google/genai';

export async function translateText(text: string) {
  if (!text) return "";
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following TV show or movie description into English. Ensure the tone remains engaging and natural. If it is already in English, simply return the original text. Do not include any conversational filler or quotes around it, just the translation:\n\n${text}`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate text.");
  }
}
