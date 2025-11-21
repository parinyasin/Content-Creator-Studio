
import React, { useState, useRef, useEffect } from 'react';
import { generateImage } from '../services/gemini';
import { ImageStyle, LogoLayer, TextLayer } from '../types';
import { Download, Image as ImageIcon, Move, Plus, Trash2, Type, Upload, Wand2, Layers, ZoomIn, ZoomOut, Bold, Italic, AlignLeft, CreditCard, MousePointer2 } from 'lucide-react';

interface ImageStudioProps {
  initialPrompt?: string;
  onImageUpdate?: (imageUrl: string) => void;
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1500;

export const ImageStudio: React.FC<ImageStudioProps> = ({ initialPrompt, onImageUpdate }) => {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [style, setStyle] = useState<ImageStyle>(ImageStyle.STUDIO);
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

    // API Key Check for Paid Model (Gemini 3 Pro Image)
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setIsGenerating(true);
    try {
      const url = await generateImage(prompt, style);
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
      const errorMessage = e?.message || JSON.stringify(e);
      
      // Handle Permission Denied (403) and Not Found (404) which often indicate key issues
      if (
        (errorMessage.includes('403') || 
         errorMessage.includes('PERMISSION_DENIED') || 
         errorMessage.includes('The caller does not have permission') ||
         errorMessage.includes('Requested entity was not found')) && 
        window.aistudio
      ) {
        alert("To use the high-quality Image Generation model, a valid Paid API Key is required. Please select your key.");
        await window.aistudio.openSelectKey();
      } else {
        alert("Failed to generate image. " + errorMessage);
      }
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
      color: "#FFFFFF",
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
        // Dragging background
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

  // --- Export ---
  const handleSaveImage = async () => {
    if (!canvasRef.current) return;
    
    // 1. Deselect everything to remove borders
    const previousSelection = selectedId;
    setSelectedId(null);

    // 2. Wait for render cycle (small timeout)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 3. Create a high-fidelity clone of the canvas for export
    // This works around issues with CSS transforms (scale) and html2canvas
    const original = canvasRef.current;
    const clone = original.cloneNode(true) as HTMLElement;
    
    // Setup clone styles to be 1:1 size and hidden from view but renderable
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.zIndex = '-9999'; // Behind everything
    clone.style.transform = 'none'; // Remove the responsive scaling
    clone.style.width = `${CANVAS_WIDTH}px`;
    clone.style.height = `${CANVAS_HEIGHT}px`;
    clone.style.boxShadow = 'none';
    clone.style.margin = '0';
    
    document.body.appendChild(clone);
    
    try {
      const canvas = await window.html2canvas(clone, {
        scale: 1, 
        useCORS: true, 
        backgroundColor: null, // Transparent background
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        logging: false,
        // We don't use onclone here because we already manually cloned and prepped the element
      });
      
      const link = document.createElement('a');
      link.download = `facebook-content-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert("Could not save image.");
    } finally {
        // Cleanup
        if (document.body.contains(clone)) {
            document.body.removeChild(clone);
        }
        // Restore selection if needed
         setSelectedId(previousSelection); 
    }
  };

  // --- Render Helpers ---

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
                    placeholder="Describe image (e.g., Coffee cup on table, morning light)"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <select 
                    className="w-full p-2 border rounded text-sm"
                    value={style}
                    onChange={(e) => setStyle(e.target.value as ImageStyle)}
                >
                    {Object.values(ImageStyle).map((s) => (
                        <option key={s} value={s}>{s.split(',')[0]}</option>
                    ))}
                </select>
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 text-white py-2 rounded flex justify-center items-center gap-2 hover:bg-purple-700 transition"
                >
                   {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Wand2 className="w-4 h-4"/>}
                   Generate AI Image
                </button>
                 <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-center">
                    <CreditCard className="w-3 h-3" /> Paid API Key Required for High-Res
                 </div>
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
                    <button onClick={() => addText('headline')} className="flex-1 bg-slate-100 hover:bg-slate-200 p-2 rounded text-center text-xs font-medium flex flex-col items-center gap-1">
                        <span className="text-lg font-bold">T</span>
                        <span>Headline</span>
                    </button>
                    <button onClick={() => addText('subtitle')} className="flex-1 bg-slate-100 hover:bg-slate-200 p-2 rounded text-center text-xs font-medium flex flex-col items-center gap-1">
                        <span className="text-sm">Tt</span>
                        <span>Subtitle</span>
                    </button>
                </div>
                <label className="w-full bg-slate-100 hover:bg-slate-200 p-2 rounded cursor-pointer text-center text-xs font-medium flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4"/>
                    <span>Add Logo Overlay</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
            </div>
        </div>

        {/* Selected Item Properties */}
        {selectedId && (
            <div className="border-b pb-4 animate-in fade-in slide-in-from-left-2">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">Edit Selected</h3>
                    <button onClick={() => {
                        if(selectedId.startsWith('logo')) setLogos(logos.filter(l => l.id !== selectedId));
                        else setTexts(texts.filter(t => t.id !== selectedId));
                        setSelectedId(null);
                    }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/></button>
                </div>

                {selectedLogo && (
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-slate-500">Size</label>
                            <input 
                                type="range" min="50" max="800" 
                                value={selectedLogo.size}
                                onChange={(e) => setLogos(logos.map(l => l.id === selectedLogo.id ? {...l, size: Number(e.target.value)} : l))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Layer Order</label>
                             <div className="flex gap-1">
                                <button onClick={() => setLogos(logos.map(l => l.id === selectedId ? {...l, zIndex: l.zIndex - 1} : l))} className="px-2 py-1 bg-slate-100 rounded text-xs">-</button>
                                <button onClick={() => setLogos(logos.map(l => l.id === selectedId ? {...l, zIndex: l.zIndex + 1} : l))} className="px-2 py-1 bg-slate-100 rounded text-xs">+</button>
                             </div>
                        </div>
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
                                className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                             />
                             <select 
                                value={selectedText.fontFamily}
                                onChange={(e) => setTexts(texts.map(t => t.id === selectedId ? {...t, fontFamily: e.target.value} : t))}
                                className="flex-1 text-xs border rounded"
                             >
                                <option value="Sarabun">Sarabun (General)</option>
                                <option value="Prompt">Prompt (Modern)</option>
                                <option value="Kanit">Kanit (Clean)</option>
                                <option value="Mitr">Mitr (Friendly)</option>
                                <option value="Chakra Petch">Chakra Petch (Sci-Fi)</option>
                                <option value="Bai Jamjuree">Bai Jamjuree (Modern)</option>
                                <option value="Playfair Display">Playfair (Serif)</option>
                                <option value="Anton">Anton (Bold Header)</option>
                                <option value="Charm">Charm (Handwriting)</option>
                             </select>
                        </div>
                        
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setTexts(texts.map(t => t.id === selectedId ? {...t, fontWeight: t.fontWeight === '800' ? '400' : '800'} : t))}
                                className={`flex-1 py-1 rounded border flex justify-center items-center ${selectedText.fontWeight === '800' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}
                             >
                                <Bold className="w-3 h-3" />
                             </button>
                             <button 
                                onClick={() => setTexts(texts.map(t => t.id === selectedId ? {...t, fontStyle: t.fontStyle === 'italic' ? 'normal' : 'italic'} : t))}
                                className={`flex-1 py-1 rounded border flex justify-center items-center ${selectedText.fontStyle === 'italic' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}
                             >
                                <Italic className="w-3 h-3" />
                             </button>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500">Font Size</label>
                            <input 
                                type="range" min="20" max="400" 
                                value={selectedText.fontSize}
                                onChange={(e) => setTexts(texts.map(t => t.id === selectedId ? {...t, fontSize: Number(e.target.value)} : t))}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}
            </div>
        )}

        <div>
            <h3 className="font-bold text-slate-800 mb-2 text-sm">Adjustments</h3>
            <div className="space-y-4">
                {/* Background Position Controls */}
                 <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <label className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                        <Move className="w-3 h-3" /> Position & Zoom
                    </label>
                    <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            <ZoomOut className="w-3 h-3 text-slate-400"/>
                            <input 
                                type="range" min="0.5" max="3" step="0.1" 
                                value={bgScale} 
                                onChange={(e) => setBgScale(Number(e.target.value))} 
                                className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <ZoomIn className="w-3 h-3 text-slate-400"/>
                         </div>
                         <div className="text-[10px] text-slate-400 text-center">
                            Drag background image to move
                         </div>
                    </div>
                </div>

                {/* Color Controls */}
                <div className="space-y-2">
                    <label className="text-xs text-slate-500 flex justify-between"><span>Brightness</span> <span>{brightness}%</span></label>
                    <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                    
                    <label className="text-xs text-slate-500 flex justify-between"><span>Contrast</span> <span>{contrast}%</span></label>
                    <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>

                    <label className="text-xs text-slate-500 flex justify-between"><span>Saturation</span> <span>{saturation}%</span></label>
                    <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>

                    <label className="text-xs text-slate-500 flex justify-between"><span>Hue Rotate</span> <span>{hue}°</span></label>
                    <input type="range" min="-180" max="180" value={hue} onChange={(e) => setHue(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                </div>
            </div>
        </div>
        
        <button onClick={handleSaveImage} className="mt-auto w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded shadow-lg font-bold flex items-center justify-center gap-2">
            <Download className="w-5 h-5"/> Save Image (PNG)
        </button>

      </div>

      {/* Center: Canvas Workspace */}
      <div className="flex-1 bg-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center shadow-inner cursor-default">
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
            {/* Background Container */}
            <div className="absolute inset-0 overflow-hidden">
                {bgImage ? (
                    <img 
                        src={bgImage} 
                        alt="Background" 
                        className="w-full h-full object-cover origin-center"
                        style={{ 
                            transform: `translate(${bgPosition.x}px, ${bgPosition.y}px) scale(${bgScale})`,
                            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`,
                            transition: isGenerating ? 'filter 0.2s' : 'none'
                        }}
                        draggable={false}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
                        <ImageIcon className="w-24 h-24 mb-4 opacity-20" />
                        <p className="text-3xl font-light opacity-40">1080 x 1500 Canvas</p>
                    </div>
                )}
            </div>

            {/* Logo Layers */}
            {logos.map(logo => (
                <div
                    key={logo.id}
                    className={`absolute rounded-full overflow-hidden cursor-move border-2 ${selectedId === logo.id ? 'border-blue-500' : 'border-transparent'}`}
                    style={{
                        left: logo.x,
                        top: logo.y,
                        width: logo.size,
                        height: logo.size,
                        zIndex: logo.zIndex,
                    }}
                    onMouseDown={(e) => handleLayerMouseDown(e, logo.id, logo.x, logo.y)}
                >
                    <img src={logo.url} alt="logo" className="w-full h-full object-cover pointer-events-none" />
                </div>
            ))}

            {/* Text Layers */}
            {texts.map(text => (
                <div
                    key={text.id}
                    // Updated: Removed bg-white/10 to remove "frame" effect. Only shows dashed border when selected.
                    className={`absolute cursor-move p-2 border ${selectedId === text.id ? 'border-blue-500 border-dashed' : 'border-transparent'}`}
                    style={{
                        left: text.x,
                        top: text.y,
                        zIndex: text.zIndex,
                        maxWidth: '85%'
                    }}
                    onMouseDown={(e) => handleLayerMouseDown(e, text.id, text.x, text.y)}
                >
                    <h2 
                        style={{
                            fontSize: `${text.fontSize}px`,
                            fontWeight: text.fontWeight,
                            fontStyle: text.fontStyle,
                            color: text.color,
                            fontFamily: text.fontFamily,
                            lineHeight: 1.2,
                            whiteSpace: 'pre-wrap'
                        }}
                        className="pointer-events-none select-none"
                    >
                        {text.text}
                    </h2>
                </div>
            ))}
        </div>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-xs backdrop-blur-sm pointer-events-none flex items-center gap-2">
            <span>Canvas 1080x1500px</span>
            {dragTarget === 'bg' && <span className="text-yellow-300 ml-2">• Moving Background</span>}
        </div>
      </div>
    </div>
  );
};
