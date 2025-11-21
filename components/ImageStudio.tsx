import React, { useState, useRef, useEffect } from 'react';
import { generateImage } from '../services/gemini';
import { Download, Image as ImageIcon, Move, Trash2, Upload, Wand2, Layers, ZoomIn, ZoomOut, Bold, Italic } from 'lucide-react';
import html2canvas from 'html2canvas';
import { LogoLayer, TextLayer } from '../types';

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
  
  const [initialLayerPos, setInitialLayerPos] = useState({ x: 0, y: 0 });
  const [bgPosition, setBgPosition] = useState({ x: 0, y: 0 });
  const [bgScale, setBgScale] = useState(1);
  const [initialBgPos, setInitialBgPos] = useState({ x: 0, y: 0 });

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);

  useEffect(() => {
      if (bgImage && onImageUpdate) {
          onImageUpdate(bgImage);
      }
  }, [bgImage, onImageUpdate]);

  // --- Helper: Convert URL to Base64 ---
  const convertUrlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error converting image:", error);
        return url; // Fallback
    }
  };

  // --- Helper: Calculate Scale ---
  const getResponsiveScale = () => {
    if (!canvasRef.current) return 1;
    const rect = canvasRef.current.getBoundingClientRect();
    // Calculate scale based on the width of the canvas relative to the designed width
    return rect.width / CANVAS_WIDTH;
  };

  // --- Handlers ---

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    try {
      const fullPrompt = `${prompt}, ${style}`;
      const url = await generateImage(fullPrompt);
      
      const base64Image = await convertUrlToBase64(url);
      setBgImage(base64Image);
      
      // Reset adjustments
      setBrightness(100); setContrast(100); setSaturation(100); setHue(0);
      setBgPosition({ x: 0, y: 0 }); setBgScale(1);
    } catch (e: any) {
      console.error("Generation error:", e);
      alert("Error: " + (e.message || "Unknown error"));
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
      text: isHeadline ? "หัวข้อหลัก" : "คำโปรยรอง...",
      x: 100,
      y: isHeadline ? 200 : 400,
      fontSize: isHeadline ? 120 : 60,
      fontWeight: isHeadline ? '800' : '400',
      fontStyle: 'normal',
      color: "#FFFFFF", 
      fontFamily: "Sarabun",
      zIndex: 20 + texts.length
    };
    setTexts([...texts, newText]);
    setSelectedId(newText.id);
  };

  // --- Drag Handlers ---
  const handleLayerMouseDown = (e: React.MouseEvent, id: string, currentX: number, currentY: number) => {
    e.stopPropagation();
    setSelectedId(id);
    setDragTarget('layer');
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialLayerPos({ x: currentX, y: currentY });
  };

  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (!bgImage) return;
    setSelectedId(null);
    setDragTarget('bg');
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBgPos({ ...bgPosition });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragTarget) return;
    
    const scale = getResponsiveScale();
    const dx = (e.clientX - dragStart.x) / scale;
    const dy = (e.clientY - dragStart.y) / scale; // Fixed: used dragStart.y instead of truncated 'drag'

    if (dragTarget === 'bg') {
      setBgPosition({
        x: initialBgPos.x + dx,
        y: initialBgPos.y + dy
      });
    } else if (dragTarget === 'layer' && selectedId) {
      // Update text or logo position
      setLogos(prev => prev.map(l => l.id === selectedId ? { ...l, x: initialLayerPos.x + dx, y: initialLayerPos.y + dy } : l));
      setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, x: initialLayerPos.x + dx, y: initialLayerPos.y + dy } : t));
    }
  };

  const handleMouseUp = () => {
    setDragTarget(null);
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setSelectedId(null); // Clear selection
    
    // Allow state to settle
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const canvas = await html2canvas(canvasRef.current, {
            useCORS: true,
            scale: 1, 
            backgroundColor: null
        });
        const link = document.createElement('a');
        link.download = `studio-design-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error("Download failed:", err);
        alert("Failed to generate image.");
    }
  };

  // Helper to update selected layer properties
  const updateSelectedLayer = (updates: Partial<TextLayer | LogoLayer>) => {
      if (!selectedId) return;
      setTexts(texts.map(t => t.id === selectedId ? { ...t, ...updates } as TextLayer : t));
      setLogos(logos.map(l => l.id === selectedId ? { ...l, ...updates } as LogoLayer : l));
  };

  const getSelectedLayer = () => {
      return texts.find(t => t.id === selectedId) || logos.find(l => l.id === selectedId);
  };
  
  const activeLayer = getSelectedLayer();

  return (
    <div 
        className="flex flex-col md:flex-row h-[calc(100vh-80px)] gap-6 p-4"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
        {/* Toolbar Side */}
        <div className="w-full md:w-80 flex flex-col gap-4 bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-y-auto">
            <div className="space-y-3">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Wand2 className="w-4 h-4"/> AI Generator</h3>
                <textarea 
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={3}
                    placeholder="Describe your background..."
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                />
                <select 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    value={style}
                    onChange={e => setStyle(e.target.value)}
                >
                    <option>ลายเส้นสะอาดตา (Clean Line Art)</option>
                    <option>ภาพถ่ายสตูดิโอ (Studio Photography)</option>
                    <option>ป๊อปอาร์ต (Pop Art)</option>
                    <option>สีน้ำ (Watercolor)</option>
                </select>
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {isGenerating ? 'Creating...' : 'Generate Background'}
                </button>
            </div>

            <div className="h-px bg-slate-100 my-2"></div>

            <div className="space-y-3">
                <h3 className="font-bold text-slate-700 text-sm">Add Elements</h3>
                <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <Upload className="w-5 h-5 text-slate-400 mb-1"/>
                        <span className="text-xs font-medium text-slate-600">BG Image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleBgUpload}/>
                    </label>
                    <label className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                        <Upload className="w-5 h-5 text-slate-400 mb-1"/>
                        <span className="text-xs font-medium text-slate-600">Logo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                    </label>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => addText('headline')} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50">Add Title</button>
                    <button onClick={() => addText('subtitle')} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Add Text</button>
                </div>
            </div>

            {activeLayer && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 mt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-slate-500">Layer Settings</span>
                        <button onClick={() => {
                             setLogos(logos.filter(l => l.id !== selectedId));
                             setTexts(texts.filter(t => t.id !== selectedId));
                             setSelectedId(null);
                        }} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    {'text' in activeLayer && (
                        <>
                            <input type="text" value={(activeLayer as TextLayer).text} onChange={e => updateSelectedLayer({ text: e.target.value })} className="w-full p-1 text-sm border rounded"/>
                            <div className="flex gap-2">
                                <input type="color" value={(activeLayer as TextLayer).color} onChange={e => updateSelectedLayer({ color: e.target.value })} className="h-8 w-8 rounded cursor-pointer border-0"/>
                                <input type="number" value={(activeLayer as TextLayer).fontSize} onChange={e => updateSelectedLayer({ fontSize: Number(e.target.value) })} className="flex-1 p-1 text-sm border rounded" placeholder="Size"/>
                            </div>
                        </>
                    )}
                    {'size' in activeLayer && (
                        <div>
                            <label className="text-xs text-slate-500">Size</label>
                            <input type="range" min="50" max="800" value={(activeLayer as LogoLayer).size} onChange={e => updateSelectedLayer({ size: Number(e.target.value) })} className="w-full"/>
                        </div>
                    )}
                </div>
            )}

            {!activeLayer && bgImage && (
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3 mt-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Image Adjustments</span>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500"><span>Brightness</span><span>{brightness}%</span></div>
                        <input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500"><span>Contrast</span><span>{contrast}%</span></div>
                        <input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                 </div>
            )}

            <div className="mt-auto">
                 <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-900 transition shadow-lg shadow-slate-200">
                    <Download className="w-4 h-4"/> Download Image
                 </button>
            </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center relative select-none">
            <div className="absolute inset-0 bg-[url('https://bg.site-static.com/transparency.png')] opacity-20 pointer-events-none"></div>
            
            <div 
                ref={canvasRef}
                className="bg-white shadow-2xl relative overflow-hidden"
                style={{
                    width: '100%',
                    maxWidth: '55vh', // Constraint to fit screen vertically
                    aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
                    cursor: dragTarget ? 'grabbing' : 'default'
                }}
                onMouseDown={handleBgMouseDown}
            >
                {bgImage ? (
                    <img 
                        src={bgImage}
                        className="absolute top-0 left-0 w-full h-full object-cover origin-top-left pointer-events-none"
                        style={{
                            transform: `translate(${bgPosition.x}px, ${bgPosition.y}px) scale(${bgScale})`,
                            filter: `brightness(${brightness}%) contrast(${contrast}%) saturation(${saturation}%) hue-rotate(${hue}deg)`
                        }}
                        alt="Canvas Background"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon className="w-16 h-16 mb-2"/>
                        <span className="text-sm font-medium">Canvas Empty</span>
                    </div>
                )}

                {logos.map(logo => (
                     <img 
                        key={logo.id}
                        src={logo.url}
                        className={`absolute cursor-move hover:ring-2 ring-blue-400 ${selectedId === logo.id ? 'ring-2 ring-blue-600' : ''}`}
                        style={{
                            left: logo.x,
                            top: logo.y,
                            width: logo.size,
                            height: logo.size,
                            zIndex: logo.zIndex,
                            objectFit: 'contain'
                        }}
                        onMouseDown={(e) => handleLayerMouseDown(e, logo.id, logo.x, logo.y)}
                        draggable={false}
                     />
                ))}

                {texts.map(text => (
                    <div
                        key={text.id}
                        className={`absolute cursor-move whitespace-pre-wrap p-2 border border-transparent hover:border-blue-300 ${selectedId === text.id ? 'border-blue-600' : ''}`}
                        style={{
                            left: text.x,
                            top: text.y,
                            color: text.color,
                            fontSize: text.fontSize,
                            fontWeight: text.fontWeight,
                            fontFamily: text.fontFamily,
                            zIndex: text.zIndex,
                            lineHeight: 1.2
                        }}
                        onMouseDown={(e) => handleLayerMouseDown(e, text.id, text.x, text.y)}
                    >
                        {text.text}
                    </div>
                ))}
            </div>
            
            {/* Zoom controls could go here */}
            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 shadow-sm border border-slate-200">
                {CANVAS_WIDTH} x {CANVAS_HEIGHT} px
            </div>
        </div>
    </div>
  );
}