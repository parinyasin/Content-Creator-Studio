export interface GeneratedImage {
  url: string;
  prompt: string;
}

export enum ImageStyle {
  STUDIO = 'Studio Photography, clean lighting, professional',
  POP_ART = 'Pop Art, vibrant colors, bold outlines, comic style',
  WATERCOLOR = 'Watercolor on paper, natural, soft, artistic',
  MINIMAL = 'Minimalist, clean lines, less detail'
}

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string; // 'normal' | 'bold' | '800' etc
  fontStyle: string;  // 'normal' | 'italic'
  color: string;
  fontFamily: string;
  zIndex: number;
}

export interface LogoLayer {
  id: string;
  url: string;
  x: number;
  y: number;
  size: number; // width/height (circle)
  zIndex: number;
}

export type ActiveTab = 'content' | 'studio';

// Global library augmentations
declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
    pdfjsLib: any;
    mammoth: any;
    JSZip: any;
    saveAs: (data: Blob | string, filename: string) => void;
  }
}