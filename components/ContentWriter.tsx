import React, { useState } from 'react';
import { rewriteContent } from '../services/geminiService'; // เรียกใช้ไฟล์ service ที่เพิ่งแก้
import { Wand2, Copy, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ContentWriterProps {
  onContentGenerated?: (content: string) => void;
}

export const ContentWriter: React.FC<ContentWriterProps> = ({ onContentGenerated }) => {
  const [sourceText, setSourceText] = useState('');
  const [optimizedContent, setOptimizedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRewrite = async () => {
    if (!sourceText.trim()) {
      toast.error('กรุณาใส่เนื้อหาต้นฉบับก่อนครับ');
      return;
    }

    setIsGenerating(true);
    setOptimizedContent(''); // เคลียร์ค่าเก่า

    try {
      // เรียกใช้ฟังก์ชัน rewriteContent ที่เราเตรียมไว้
      const result = await rewriteContent(sourceText);
      
      setOptimizedContent(result);
      if (onContentGenerated) {
        onContentGenerated(result);
      }
      toast.success('เขียนคอนเทนต์เสร็จแล้ว!');
      
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
      setOptimizedContent('ระบบขัดข้อง กรุณากดปุ่มลองใหม่อีกครั้ง');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
        {/* ส่วนกรอกข้อมูล */}
        <div className="space-y-2">
            <label className="font-bold text-slate-700 text-sm">ต้นฉบับ (Source)</label>
            <textarea 
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="w-full h-32 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                placeholder="วางข้อความที่ต้องการให้ AI เขียนใหม่..."
            />
        </div>

        {/* ปุ่มกด */}
        <button 
            onClick={handleRewrite}
            disabled={isGenerating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-md"
        >
            {isGenerating ? (
                <> <Loader2 className="w-5 h-5 animate-spin"/> กำลังเขียน... </>
            ) : (
                <> <Wand2 className="w-5 h-5"/> เขียนใหม่ให้น่าสนใจ (Rewrite) </>
            )}
        </button>

        {/* ส่วนผลลัพธ์ */}
        <div className="space-y-2 flex-grow flex flex-col">
            <label className="font-bold text-slate-700 text-sm">ผลลัพธ์จาก AI</label>
            <div className="relative flex-grow">
                <textarea 
                    readOnly
                    value={optimizedContent}
                    className="w-full h-full min-h-[200px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 resize-none focus:outline-none font-sans leading-relaxed"
                    placeholder="AI จะเขียนคอนเทนต์ใหม่ให้ตรงนี้..."
                />
                {optimizedContent && (
                    <button 
                        onClick={() => {navigator.clipboard.writeText(optimizedContent); toast.success('คัดลอกแล้ว');}}
                        className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:bg-blue-50 text-slate-600 transition-all"
                        title="Copy to clipboard"
                    >
                        <Copy className="w-4 h-4"/>
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};