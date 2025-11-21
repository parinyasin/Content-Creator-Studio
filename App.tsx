import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sparkles, Image as ImageIcon, Copy, Download, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// 🔑 API KEY (ฝังไว้)
const API_KEY = "AIzaSyDgBINcYmdNcz9B1Cugv_0RAF7D0dp9Akc";
const genAI = new GoogleGenerativeAI(API_KEY);

function App() {
  // States สำหรับ Content
  const [contentInput, setContentInput] = useState("The future of AI in creative writing and digital art generation.");
  const [contentOutput, setContentOutput] = useState("");
  const [isContentLoading, setIsContentLoading] = useState(false);

  // States สำหรับ Image
  const [imageInput, setImageInput] = useState("A futuristic city with flying vehicles at sunset, cyberpunk style");
  const [imageOutput, setImageOutput] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(false);

  // ฟังก์ชันเขียนคอนเทนต์
  const handleRewrite = async () => {
    if (!contentInput.trim()) return;
    setIsContentLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(`Rewrite this nicely for a social media post, keep it engaging but concise: "${contentInput}"`);
      setContentOutput(result.response.text());
      toast.success("Content rewritten!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to rewrite content.");
    } finally {
      setIsContentLoading(false);
    }
  };

  // ฟังก์ชันสร้างภาพ
  const handleGenerateImage = async () => {
    if (!imageInput.trim()) return;
    setIsImageLoading(true);
    try {
        // ใช้ Pollinations AI
        const seed = Math.floor(Math.random() * 1000);
        const url = `https://pollinations.ai/p/${encodeURIComponent(imageInput)}?width=1280&height=720&seed=${seed}&model=flux`;
        
        // Pre-load image to check if it works
        const img = new Image();
        img.onload = () => {
            setImageOutput(url);
            setIsImageLoading(false);
            toast.success("Image generated!");
        };
        img.src = url;

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate image.");
      setIsImageLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-6 md:p-12">
      <Toaster position="bottom-center" />
      <div className="max-w-3xl mx-auto space-y-12">
        
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Content & Image Generator</h1>
          <p className="text-zinc-400">AI-powered tools for your creative needs.</p>
        </header>

        {/* === Section 1: Content === */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600/20 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-indigo-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Content</h2>
          </div>
          
          <div className="grid gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <div>
                <label className="block text-sm text-zinc-500 mb-2 font-medium">Original Text</label>
                <textarea 
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-none h-32"
                />
            </div>
            <button 
                onClick={handleRewrite}
                disabled={isContentLoading}
                className="btn btn-primary flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
                {isContentLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5" />}
                Rewrite Content
            </button>

            {contentOutput && (
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm text-zinc-500 font-medium">Result</label>
                        <button onClick={() => copyToClipboard(contentOutput)} className="text-zinc-500 hover:text-indigo-400 transition-colors">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 min-h-[100px] whitespace-pre-wrap">
                        {contentOutput}
                    </div>
                </div>
            )}
          </div>
        </section>

        {/* === Section 2: Image === */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-pink-600/20 p-2 rounded-lg">
              <ImageIcon className="w-6 h-6 text-pink-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Image</h2>
          </div>
          
          <div className="grid gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <div>
                <label className="block text-sm text-zinc-500 mb-2 font-medium">Image Prompt</label>
                <textarea 
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 outline-none transition-all resize-none h-32"
                />
            </div>
             <button 
                onClick={handleGenerateImage}
                disabled={isImageLoading}
                className="btn btn-primary flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all disabled:opacity-50 bg-pink-600 hover:bg-pink-700 text-white"
            >
                {isImageLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5" />}
                Generate Image
            </button>

            {/* ส่วนแสดงผลรูปภาพ และปุ่ม Save ที่แก้ไขแล้ว */}
            <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-xl p-2 min-h-[200px] flex items-center justify-center overflow-hidden relative group">
                {isImageLoading ? (
                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                ) : imageOutput ? (
                    <>
                        <img src={imageOutput} alt="Generated" className="w-full h-auto rounded-lg" />
                        {/* ✅ ปุ่ม Save แบบใหม่: คลิกแล้วเปิดแท็บใหม่ */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/80 backdrop-blur-sm p-1 rounded-lg border border-zinc-800/50">
                            <a 
                                href={imageOutput}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-zinc-400 hover:text-white transition-colors"
                                title="Open in new tab to save"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                        </div>
                    </>
                ) : (
                    <span className="text-zinc-600 text-sm">Image will appear here</span>
                )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;