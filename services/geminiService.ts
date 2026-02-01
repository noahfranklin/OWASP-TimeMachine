
import { GoogleGenAI } from "@google/genai";

export async function getWalkthrough(vulnerabilityName: string, difficulty: string, era: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as a world-class penetration tester. Provide a concise, step-by-step exploit walkthrough for the vulnerability: "${vulnerabilityName}" in the OWASP ${era} era at "${difficulty}" difficulty. Include why it happens and how to identify it. Keep it under 300 words. Format with markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No walkthrough available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate walkthrough. Check your API key or connection.";
  }
}
