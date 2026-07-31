import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'hello',
    });
    console.log("3.5:", response.text);
  } catch(e: any) {
    console.error("3.5 Failed:", e.message);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'hello',
    });
    console.log("3.6:", response.text);
  } catch(e: any) {
    console.error("3.6 Failed:", e.message);
  }
}
run();
