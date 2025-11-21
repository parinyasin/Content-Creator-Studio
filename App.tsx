import React, { useState } from 'react';
import { generateFBCaption, generateIllustration } from './services/geminiService';
import { Sparkles, Image as ImageIcon, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  // Input States
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState('น่าเชื่อถือ');
  const [imgPrompt, setImgPrompt] = useState('tarot card, mystical, 8k');
  
  // Result States
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleGenerate = async () => {
    if (!inputText) return toast.error("กรุณาใส่เนื้อหาก่อนครับ");
    setLoading(true);
    
    try {
      // 1. สร้าง Caption
      const textResult = await generateFBCaption(inputText, tone);
      setCaption(textResult);

      // 2. สร้างรูป
      const imgResult = await generateIllustration(imgPrompt, "mystical style");
      setImageUrl(imgResult);
      
      toast.success("สร้างสำเร็จ!");
    } catch (e) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <Toaster />
      
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* ฝั่งซ้าย: เครื่องมือ */}
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
            <h1 className="text-2xl font-bold mb-4 text-purple-400 flex items-center gap-2">
              <Sparkles /> Content Creator AI
            </h1>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">เนื้อหาต้นฉบับ</label>
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 h-32 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="ใส่เนื้อหาที่ต้องการให้ AI เขียน..."
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">โทนเสียง</label>
                <select 
                  value={tone} onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3"
                >
                  <option>น่าเชื่อถือ</option>
                  <option>สนุกสนาน</option>
                  <option>ขายของ</option>
                  <option>สายมูเตลู</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400">สิ่งที่อยากให้วาด (ภาษาอังกฤษ)</label>
                <input 
                  value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3"
                />
              </div>

              <button 
                onClick={handleGenerate} disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-all flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin"/> : <Sparkles />} 
                เริ่มสร้างคอนเทนต์
              </button>
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: ผลลัพธ์ */}
        <div className="space-y-6">
          
          {/* กล่องข้อความ */}
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 min-h-[200px]">
            <div className="flex justify-between mb-2">
              <span className="text-slate-400 text-sm">Caption</span>
              <button onClick={() => {navigator.clipboard.writeText(caption); toast.success("คัดลอกแล้ว")}} className="text-purple-400 hover:text-white"><Copy size={16}/></button>
            </div>
            <div className="whitespace-pre-line text-slate-200">
              {caption || "รอผลลัพธ์..."}
            </div>
          </div>

          {/* กล่องรูปภาพ */}
          <div className="bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-700">
            <span className="text-slate-400 text-sm block mb-2">รูปภาพประกอบ</span>
            <div className="aspect-square bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center relative group">
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Generated" className="w-full h-full object-cover" />
                  
                  {/* ปุ่ม Open/Save แบบใหม่ (แก้ปัญหา Save ไม่ได้) */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a 
                      href={imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                      <ExternalLink size={20} /> เปิดรูปเพื่อบันทึก
                    </a>
                  </div>
                </>
              ) : (
                <ImageIcon className="text-slate-700 w-16 h-16" />
              )}
            </div>
            {imageUrl && <p className="text-xs text-slate-500 mt-2 text-center">*กดที่รูปเพื่อเปิดแท็บใหม่ แล้วกดบันทึกภาพ</p>}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;