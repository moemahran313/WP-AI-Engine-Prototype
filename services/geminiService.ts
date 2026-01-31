
import { GoogleGenAI } from "@google/genai";

// Always use the process.env.API_KEY directly for initialization as a named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enhancePrompt = async (basePrompt: string, pluginType: string): Promise<string> => {
  try {
    // Always call generateContent directly from the ai client.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert prompt engineer for WordPress AI plugins. 
      The user is building a ${pluginType} plugin. 
      Their initial prompt is: "${basePrompt}".
      
      Improve this prompt to be more descriptive, safe, and effective for a LLM to use in a production WordPress environment. 
      Return ONLY the improved prompt text.`,
    });
    // Use the .text property directly, it's a getter, not a method.
    return response.text?.trim() || basePrompt;
  } catch (error) {
    console.error("Failed to enhance prompt:", error);
    return basePrompt;
  }
};
