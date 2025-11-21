import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ฟังก์ชันหลัก: เขียนคอนเทนต์ (แบบง่ายสุดๆ)
export const rewriteContent = async (text: string) => {
  try {
    // Use gemini-2.5-flash as recommended for text tasks
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `ช่วยเขียนโพสต์ Facebook จากข้อความนี้ให้น่าสนใจ: "${text}"\n(ขอสั้นๆ กระชับ ใส่ Emoji ได้นิดหน่อย)`
    });

    return response.text || "ไม่สามารถสร้างข้อความได้";

  } catch (error) {
    console.error("AI Error:", error);
    // ถ้าพัง ให้ส่งข้อความนี้กลับไป (อย่างน้อยแอพไม่แดง)
    return "ขออภัย ระบบกำลังประมวลผลหนาแน่น กรุณาลองใหม่อีกครั้ง";
  }
};

// ฟังก์ชันสร้างภาพ (ใช้แบบฟรี)
export const generateImage = async (prompt: string) => {
  const seed = Math.floor(Math.random() * 1000);
  return `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1080&height=1080&seed=${seed}`;
};