
import { GoogleGenAI } from "@google/genai";
import { ImageStyle } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const rewriteContent = async (text: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    You are a professional Facebook content editor. 
    Rewrite the following text content in THAI (unless the input is clearly English, then use English).
    
    Rules:
    1. Summarize and organize the content.
    2. Make it easy to read, concise, and catchy.
    3. Use correct main points.
    4. STRICTLY NO EMOJIS, NO EMOTICONS. Avoid decorative symbols.
    5. DO NOT use markdown bold syntax (like **text**) or italics. Facebook does not support markdown formatting.
    6. For headings or emphasized sections, use the '#' symbol as a prefix WITHOUT A SPACE (e.g., #Heading, NOT # Heading). This is critical so they function as hashtags on Facebook.
    7. Use clear paragraph spacing.
    8. Add relevant and popular hashtags at the end for better search visibility (SEO).
    9. **MANDATORY**: You MUST include the brand hashtag: #การะเกต์พยากรณ์
    10. Return ONLY the rewritten text followed by the hashtags.

    Content to rewrite:
    ${text}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate text.";
  } catch (error) {
    console.error("Rewrite error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string, style: ImageStyle): Promise<string> => {
  const ai = getClient();
  
  // Simplified prompt as we now use config for aspect ratio
  const finalPrompt = `${style}. Subject: ${prompt}. High quality, aesthetic, visually pleasing for a poster background.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', 
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Native aspect ratio support for 1080x1500 target
          imageSize: "1K"
        }
      }
    });

    // Extract image
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    
    throw new Error("No image data returned. The model may have refused the prompt.");
  } catch (error) {
    console.error("Image gen error:", error);
    throw error;
  }
};
