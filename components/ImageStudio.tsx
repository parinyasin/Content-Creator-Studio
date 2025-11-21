import React, { useState, useRef, useEffect } from 'react';
import { generateIllustration } from '../services/geminiService';
import { Download, Image as ImageIcon, Move, Trash2, Upload, Wand2, Layers, ZoomIn, ZoomOut, Bold, Italic } from 'lucide-react';
import html2canvas from 'html2canvas';

// นิยาม Types
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

  // --- ฟังก์ชันแปลง URL เป็น Base64 (พระเอกของเรา) ---
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
        return url; // ถ้าแปลงไม่ได้ ให้ใช้ URL เดิม (Fallback)
    }
  };

  // --- Handlers ---

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    try {
      // 1. ได้ลิงก์รูปมาจาก AI
      const url = await generateIllustration(prompt, style);
      
      // 2. แปลงเป็น Base64 ทันที (เพื่อให้ Save ได้ชัวร์ๆ)
      const base64Image = await convertUrlToBase64(url);
      setBgImage(base64Image);
      
      // Reset adjustments
      setBrightness(100); setContrast(100); setSaturation(100); setHue(0);
      setBgPosition({ x: 0, y: 0 }); setBgScale(1);
    } catch (e: any) {
      console.error("Generation error:", e);
      alert("เกิดข้อผิดพลาด: " + (e.message || "Unknown error"));
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
      color: "#FFFFFF", // Default White
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
    const dy = (e.clientY - drag