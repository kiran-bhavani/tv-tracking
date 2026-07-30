"use server";

import { GoogleGenAI } from '@google/genai';
import { fetchWikipediaSummary } from '@/lib/wikipedia';

// 1. Try Wikipedia first (faster, free)
export async function generateOverviewAction(type: 'show' | 'movie' | 'episode', title: string, season?: number, episode?: number) {
  
  if (type === 'show' || type === 'movie') {
    const wiki = await fetchWikipediaSummary(title);
    if (wiki && wiki.length > 20) {
      return { source: 'wikipedia', overview: wiki };
    }
  }

  // 2. Fallback to Gemini AI if Wikipedia fails (or if it's an episode, since Wiki for episodes is sparse)
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  let prompt = "";
  if (type === 'episode' && season !== undefined && episode !== undefined) {
    prompt = `Write a detailed synopsis for Season ${season}, Episode ${episode} of the TV show "${title}". It is okay to include spoilers. Just return the synopsis text, no conversational filler or quotes.`;
  } else {
    const mediaType = type === 'movie' ? 'movie' : 'TV show';
    prompt = `Write a comprehensive, engaging overview for the ${mediaType} "${title}". It is okay to include spoilers. Just return the overview text, no conversational filler or quotes.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text?.trim() || "";
    if (text) {
      return { source: 'ai', overview: text };
    }
    return null;
  } catch (error) {
    console.error("AI Generation error:", error);
    return null;
  }
}

export async function generateTriviaAction(title: string, type: 'show' | 'movie') {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const mediaType = type === 'movie' ? 'movie' : 'TV show';
  const prompt = `Give me 2 fascinating, real, verified behind-the-scenes trivia facts about the ${mediaType} "${title}". Return ONLY a JSON array of 2 strings like: ["Fact 1", "Fact 2"]. Do not include markdown codeblocks or extra text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text?.trim() || "";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const facts = JSON.parse(cleanText);
    if (Array.isArray(facts) && facts.length > 0) {
      return facts;
    }
    return null;
  } catch (error) {
    console.error("Trivia AI Generation error:", error);
    return null;
  }
}

