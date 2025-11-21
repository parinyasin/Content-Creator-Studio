import React, { useState, useRef } from 'react';
import { rewriteContent } from '../services/gemini';
import { ClipboardCopy, Download, FileText, RefreshCw, Wand2, FileDown, AlertCircle } from 'lucide-react';

interface ContentWriterProps {
  onContentUpdate: (text: string) => void;
}

export const ContentWriter: React.FC<ContentWriterProps> = ({ onContentUpdate }) => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRewrite = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await rewriteContent(inputText);
      setOutputText(result);
      onContentUpdate(result); // Notify parent/other components if needed
    } catch (err) {
      setError("Failed to rewrite content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    alert("Copied to clipboard!");
  };

  const handleSaveAsDoc = () => {
    // Create a simple HTML structure that Word can interpret as a document
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Export</title>
        <style>body { font-family: 'Sarabun', sans-serif; font-size: 16px; line-height: 1.5; }</style>
      </head>
      <body>${outputText.replace(/\n/g, '<br>')}</body>
      </html>
    `;
    
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'facebook_content.doc'; // Saving as .doc for compatibility
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAsText = () => {
    const element = document.createElement("a");
    const file = new Blob([outputText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "facebook_content.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsLoading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (ext === 'txt' || ext === 'md') {
        const text = await file.text();
        setInputText(text);
      } else if (ext === 'pdf') {
        if (!window.pdfjsLib) throw new Error("PDF Library not loaded");
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item: any) => item.str).join(' ') + "\n\n";
        }
        setInputText(fullText);
      } else if (ext === 'docx') {
        if (!window.mammoth) throw new Error("Docx Library not loaded");
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        setInputText(result.value);
      } else if (ext === 'doc' || ext === 'pages') {
        setError("Note: .doc (legacy) and .pages files are binary formats that are difficult to read directly in a browser. Please save them as .docx or .pdf, or copy-paste the text.");
        setIsLoading(false);
        return;
      } else {
        setError("Unsupported file format. Please use .txt, .md, .docx, or .pdf");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to read file. Ensure it is a valid document.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Content Writer
        </h2>
        <label className="cursor-pointer text-xs font-medium bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-md transition text-slate-600 flex items-center gap-1">
          <FileDown className="w-3 h-3" /> Import (PDF/Docx/Txt)
          <input type="file" className="hidden" accept=".txt,.md,.pdf,.docx,.doc,.pages" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Input Area */}
      <div className="flex-1 flex flex-col min-h-[200px]">
        <label className="text-xs font-semibold text-slate-500 mb-1 uppercase">Source Content</label>
        <textarea
          className="flex-1 w-full p-3 border border-slate-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 text-sm mb-2"
          placeholder="Paste text or upload .docx/.pdf..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          onClick={handleRewrite}
          disabled={isLoading || !inputText}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-medium transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Rewrite for Facebook
        </button>
      </div>

      {/* Output Area */}
      <div className="flex-1 flex flex-col relative min-h-[200px]">
        <label className="text-xs font-semibold text-slate-500 mb-1 uppercase">Optimized Content</label>
        <textarea
          className="flex-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-md resize-none text-slate-700 text-sm font-sarabun"
          readOnly
          placeholder="AI generated content will appear here..."
          value={outputText}
        />
        
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-xs mt-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </div>
        )}

        {outputText && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button onClick={handleCopy} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-600 transition" title="Copy to Clipboard">
              <ClipboardCopy className="w-4 h-4" />
            </button>
            <button onClick={handleSaveAsText} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-600 transition" title="Save as Text">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleSaveAsDoc} className="p-2 bg-blue-50 border border-blue-100 rounded-full shadow-sm hover:bg-blue-100 text-blue-600 transition" title="Save as .doc">
              <FileText className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};