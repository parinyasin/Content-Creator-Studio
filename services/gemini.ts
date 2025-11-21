import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 กุญแจ (ใส่ไว้เหมือนเดิม)
const API_KEY = "AIzaSyDgBINcYmdNcz9B1Cugv_0RAF7D0dp9Akc";

const genAI = new GoogleGenerativeAI(API_KEY);

// ฟังก์ชันหลัก: เขียนคอนเทนต์ (แบบง่ายสุดๆ)
export const rewriteContent = async (text: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // ใช้รุ่น Pro มาตรฐาน

    const prompt = `
      ช่วยเขียนโพสต์ Facebook จากข้อความนี้ให้น่าสนใจ: "${text}"
      (ขอสั้นๆ กระชับ ใส่ Emoji ได้นิดหน่อย)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text(); // ส่งข้อความกลับไปเลย ไม่ต้องแปลง JSON

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