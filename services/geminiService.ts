import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 กุญแจของคุณ (ฝังตรงนี้เพื่อความชัวร์ 100%)
const API_KEY = "AIzaSyDgBINcYmdNcz9B1Cugv_0RAF7D0dp9Akc";

const genAI = new GoogleGenerativeAI(API_KEY);

// ฟังก์ชันสำหรับเขียนคอนเทนต์ (ใช้ชื่อ rewriteContent ให้ตรงกับหน้าบ้าน)
export const rewriteContent = async (text: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      บทบาท: คุณคือ Content Creator มืออาชีพ
      งาน: ช่วยเขียนโพสต์ Facebook จากข้อความนี้ให้น่าสนใจ: "${text}"
      
      คำสั่ง:
      1. เขียนให้น่าอ่าน แบ่งย่อหน้าสวยงาม
      2. ใส่อารมณ์ให้ดูเป็นธรรมชาติ
      3. ใส่ Emoji ประกอบนิดหน่อยให้น่ารัก
      4. ติด Hashtag ที่เกี่ยวข้อง
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error: any) {
    console.error("AI Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อ AI: " + (error.message || "กรุณาลองใหม่อีกครั้ง");
  }
};

// ฟังก์ชันสำหรับสร้างภาพ (ใช้ Pollinations)
export const generateIllustration = async (prompt: string) => {
  const seed = Math.floor(Math.random() * 1000);
  const finalPrompt = encodeURIComponent(prompt + ", high quality, 8k, masterpiece");
  return `https://pollinations.ai/p/${finalPrompt}?width=1080&height=1080&seed=${seed}&model=flux`;
};