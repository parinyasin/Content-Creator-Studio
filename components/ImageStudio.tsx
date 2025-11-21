import React, { useState, useRef, useEffect } from 'react';
import { generateIllustration } from '../services/geminiService'; // แก้ import ให้ตรงกับไฟล์จริง
import { ImageStyle } from '../types'; // ตรวจสอบว่ามีไฟล์ types.ts หรือไม่ ถ้าไม่มีให้ลบ import นี้และสร้าง interface เอง
import { Download, Image as ImageIcon, Move, Trash2, Upload, Wand2, Layers, ZoomIn, ZoomOut, Bold, Italic, CreditCard } from 'lucide-react';
import html2canvas from 'html2canvas'; // ต้องมั่นใจว่าลง npm install html2canvas แล้ว

// นิยาม Types (เผื่อไฟล์ types หาไม่เจอ)
interface LogoLayer {
  id: string;
  url: string;
  x: number;
  y: number;
  size: number;
  zIndex: number;
}

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  color: string;
  fontFamily: string;
  zIndex: number;
}

interface ImageStudioProps {
  initialPrompt?: string;
  onImageUpdate?: (imageUrl: string) => void;
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1500;

export default function ImageStudio({ initialPrompt, onImageUpdate }: ImageStudioProps) {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [style, setStyle] = useState<string>('ลายเส้นสะอาดตา (Clean Line Art)');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Layers
  const [logos, setLogos] = useState<LogoLayer[]>([]);
  const [texts, setTexts] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Editor State
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragTarget, setDragTarget] = useState<'layer' | 'bg' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Layer Drag State
  const [initialLayerPos, setInitialLayerPos] = useState({ x: 0, y: 0 });

  // Background State
  const [bgPosition, setBgPosition] = useState({ x: 0, y: 0 });
  const [bgScale, setBgScale] = useState(1);
  const [initialBgPos, setInitialBgPos] = useState({ x: 0, y: 0 });

  // Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);

  useEffect(() => {
      if (bgImage && onImageUpdate) {
          onImageUpdate(bgImage);
      }
  }, [bgImage, onImageUpdate]);

  // --- Handlers ---

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    try {
      // เรียกใช้ฟังก์ชันจาก geminiService โดยตรง (ไม่ต้องเช็ค Key ในหน้านี้แล้ว)
      const url = await generateIllustration(prompt, style);
      setBgImage(url);
      
      // Reset adjustments
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setHue(0);
      setBgPosition({ x: 0, y: 0 });
      setBgScale(1);
    } catch (e: any) {
      console.error("Generation error:", e);
      alert("เกิดข้อผิดพลาดในการสร้างรูป: " + (e.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBgImage(ev.target?.result as string);
        setBgPosition({ x: 0, y: 0 });
        setBgScale(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newLogo: LogoLayer = {
          id: `logo-${Date.now()}`,
          url: ev.target?.result as string,
          x: CANVAS_WIDTH / 2 - 150,
          y: CANVAS_HEIGHT / 2 - 150,
          size: 300,
          zIndex: 10 + logos.length
        };
        setLogos([...logos, newLogo]);
        setSelectedId(newLogo.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const addText = (type: 'headline' | 'subtitle') => {
    const isHeadline = type === 'headline';
    const newText: TextLayer = {
      id: `text-${Date.now()}`,
      text: isHeadline ? "หัวข้อหลัก" : "คำโปรยรอง เนื้อหา...",
      x: 100,
      y: isHeadline ? 200 : 400,
      fontSize: isHeadline ? 120 : 60,
      fontWeight: isHeadline ? '800' : '400',
      fontStyle: 'normal',
      color: "#000000",
      fontFamily: "Sarabun",
      zIndex: 20 + texts.length
    };
    setTexts([...texts, newText]);
    setSelectedId(newText.id);
  };

  // --- Interaction Handlers (Drag) ---

  const handleLayerMouseDown = (e: React.MouseEvent, id: string, currentX: number, currentY: number) => {
    e.stopPropagation(); // Prevent triggering background drag
    setSelectedId(id);
    setDragTarget('layer');
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialLayerPos({ x: currentX, y: currentY });
  };

  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (!bgImage) return;
    setSelectedId(null); // Deselect layers
    setDragTarget('bg');
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBgPos({ ...bgPosition });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragTarget) return;
    
    const scale = getResponsiveScale();
    const dx = (e.clientX - dragStart.x) / scale;
    const dy = (e.clientY - dragStart.y) / scale;

    if (dragTarget === 'layer' && selectedId) {
        const newX = initialLayerPos.x + dx;
        const newY = initialLayerPos.y + dy;

        if (selectedId.startsWith('logo')) {
            setLogos(prev => prev.map(l => l.id === selectedId ? { ...l, x: newX, y: newY } : l));
        } else {
            setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, x: newX, y: newY } : t));
        }
    } else if (dragTarget === 'bg') {
        setBgPosition({
            x: initialBgPos.x + dx,
            y: initialBgPos.y + dy
        });
    }
  };

  const handleMouseUp = () => {
    setDragTarget(null);
  };

  // --- Helper to calculate display scale ---
  const getResponsiveScale = () => {
    if (typeof window !== 'undefined') {
        return window.innerWidth < 768 ? 0.22 : 0.35; 
    }
    return 0.25;
  };

  // --- Export (Fixed CORS Issue) ---
  const handleSaveImage = async () => {
    if (!canvasRef.current) return;
    
    // 1. Deselect everything
    const previousSelection = selectedId;
    setSelectedId(null);

    // 2. Wait for render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Create a clone to render
      const original = canvasRef.current;
      const clone = original.cloneNode(true) as HTMLElement;
      
      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.zIndex = '-9999';
      clone.style.transform = 'none'; 
      clone.style.width = `${CANVAS_WIDTH}px`;
      clone.style.height = `${CANVAS_HEIGHT}px`;
      
      document.body.appendChild(clone);

      // Enable CORS in html2canvas
      const canvas = await html2canvas(clone, {
        scale: 1, 
        useCORS: true,  // สำคัญมาก: อนุญาตให้โหลดรูปข้ามโดเมน
        allowTaint: true,
        backgroundColor: null,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `content-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Cleanup
      document.body.removeChild(clone);
    } catch (err) {
      console.error("Save failed:", err);
      alert("ไม่สามารถบันทึกรูปได้ (อาจเกิดจากนโยบายความปลอดภัยของ Browser)");
    } finally {
         setSelectedId(previousSelection); 
    }
  };

  const selectedLogo = logos.find(l => l.id === selectedId);
  const selectedText = texts.find(t => t.id === selectedId);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-2 lg:p-4 overflow-hidden" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      
      {/* Left Panel: Controls */}
      <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4 p-4 bg-white rounded-lg border border-slate-200 h-full overflow-y-auto custom-scrollbar shadow-sm z-20">
        
        <div className="border-b pb-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Background</h3>
            <div className="space-y-3">
                <textarea 
                    className="w-full p-2 border rounded text-sm" 
                    rows={3} 
                    placeholder="รายละเอียดภาพ (เช่น กาแฟยามเช้า, วิวทะเล)"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <select 
                    className="w-full p-2 border rounded text-sm"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                >
                    <option value="ลายเส้นสะอาดตา (Clean Line Art)">ลายเส้นสะอาดตา</option>
                    <option value="ภาพสีน้ำ (Watercolor)">ภาพสีน้ำ</option>
                    <option value="ภาพถ่ายจริง (Realistic)">ภาพถ่ายจริง</option>
                    <option value="3D Render">3D Render</option>
                </select>
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 text-white py-2 rounded flex justify-center items-center gap-2 hover:bg-purple-700 transition"
                >
                   {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Wand2 className="w-4 h-4"/>}
                   Generate AI Image
                </button>
                
                <label className="block w-full border border-dashed border-slate-300 rounded p-2 text-center text-sm cursor-pointer hover:bg-slate-50 text-slate-600">
                    <input type="file" className="hidden" accept="image/*" onChange={handleBgUpload} />
                    <Upload className="w-4 h-4 inline mr-2"/> Upload Image
                </label>
            </div>
        </div>

        <div className="border-b pb-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Layers className="w-4 h-4"/> Layers</h3>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <button onClick={() => addText('headline')} className="flex-1 bg-slate-100 hover:bg-slate-200 p-2 rounded text-center text-xs font-medium">
                        <span className="text-lg font-bold block">T</span> Headline
                    </button>
                    <button onClick={() => addText('subtitle')} className="flex-1 bg-slate-100 hover:bg-slate-200 p-2 rounded text-center text-xs font-medium">
                        <span className="text-sm block">Tt</span> Subtitle
                    </button>
                </div>
                <label className="w-full bg-slate-100 hover:bg-slate-200 p-2 rounded cursor-pointer text-center text-xs font-medium flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4"/> Add Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
            </div>
        </div>

        {/* Edit Controls (แสดงเมื่อเลือก Layer) */}
        {selectedId && (
            <div className="border-b pb-4 animate-in fade-in slide-in-from-left-2">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">แก้ไข Layer</h3>
                    <button onClick={() => {
                        if(selectedId.startsWith('logo')) setLogos(logos.filter(l => l.id !== selectedId));
                        else setTexts(texts.filter(t => t.id !== selectedId));
                        setSelectedId(null);
                    }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/></button>
                </div>

                {selectedLogo && (
                    <div>
                        <label className="text-xs text-slate-500">ขนาด</label>
                        <input 
                            type="range" min="50" max="800" 
                            value={selectedLogo.size}
                            onChange={(e) => setLogos(logos.map(l => l.id === selectedLogo.id ? {...l, size: Number(e.target.value)} : l))}
                            className="w-full"
                        />
                    </div>
                )}

                {selectedText && (
                    <div className="space-y-2">
                        <textarea 
                            value={selectedText.text} 
                            onChange={(e) => setTexts(texts.map(t => t.id === selectedId ? {...t, text: e.target.value} : t))}
                            className="w-full p-1 border rounded text-sm"
                            rows={2}
                        />
                        <div className="flex gap-2">
                             <input 
                                type="color" 
                                value={selectedText.color}
                                onChange={(e) => setTexts(texts.map(t => t.id === selectedId ? {...t, color: e.target.value} : t))}
                                className="h-8 w-8 rounded cursor-pointer border"
                             />
                             <input 
                                type="range" min="20" max="400" 
                                value={selectedText.fontSize}
                                onChange={(e) => setTexts(texts.map(t => t.id === selectedId ? {...t, fontSize: Number(e.target.value)} : t))}
                                className="flex-1"
                            />
                        </div>
                    </div>
                )}
            </div>
        )}

        <button onClick={handleSaveImage} className="mt-auto w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded shadow-lg font-bold flex items-center justify-center gap-2">
            <Download className="w-5 h-5"/> บันทึกภาพ (Save)
        </button>

      </div>

      {/* Center: Canvas */}
      <div className="flex-1 bg-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center shadow-inner cursor-default p-4">
        <div 
            id="studio-canvas"
            style={{ 
                width: CANVAS_WIDTH, 
                height: CANVAS_HEIGHT, 
                transform: `scale(${getResponsiveScale()})`,
                transformOrigin: 'center center',
            }} 
            className="bg-white shadow-2xl relative overflow-hidden"
            ref={canvasRef}
            onMouseDown={handleBgMouseDown}
        >
            {/* Background Image */}
            <div className="absolute inset-0 overflow-hidden">
                {bgImage ? (
                    <img 
                        src={bgImage} 
                        alt="Background" 
                        // สำคัญ: crossOrigin="anonymous" ช่วยแก้ปัญหา Save ไม่ได้
                        crossOrigin="anonymous" 
                        className="w-full h-full object-cover origin-center"
                        style={{ 
                            transform: `translate(${bgPosition.x}px, ${bgPosition.y}px) scale(${bgScale})`,
                            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`,
                        }}
                        draggable={false}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                        <ImageIcon className="w-24 h-24 mb-4 opacity-20" />
                        <p className="text-3xl font-light opacity-40">พื้นที่ทำงาน 1080x1500</p>
                    </div>
                )}
            </div>

            {/* Layers */}
            {logos.map(logo => (
                <div
                    key={logo.id}
                    className={`absolute rounded-full overflow