import React, { useState } from 'react';
import { ContentWriter } from './components/ContentWriter';
import { ImageStudio } from './components/ImageStudio';
import { ActiveTab } from './types';
import { LayoutGrid, PenTool, Image as ImageIcon, Menu, FolderDown } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('content');
  const [currentContent, setCurrentContent] = useState(''); 
  // Track current generated/uploaded image for the Zip exporter
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const handleContentUpdate = (text: string) => {
    setCurrentContent(text);
  };

  const handleImageUpdate = (imageUrl: string) => {
    setCurrentImage(imageUrl);
  };

  const handleExportProject = async () => {
    if (!window.JSZip || !window.saveAs) {
      alert("Export library not loaded yet. Please wait.");
      return;
    }

    const zip = new window.JSZip();
    const folder = zip.folder("Facebook_Content_Project");

    // Add Content Doc
    if (currentContent) {
      const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Export</title></head>
      <body>${currentContent.replace(/\n/g, '<br>')}</body>
      </html>`;
      folder.file("content.doc", docContent);
      folder.file("content.txt", currentContent);
    }

    // Add Image (This is a bit tricky without capturing the canvas again, 
    // so we just save the raw background image if available, or we warn user.
    // A full canvas capture requires calling html2canvas from ImageStudio.
    // For this "Project Save", we'll save the source assets or the last known state.
    // Ideally, we would trigger a capture in ImageStudio, but that requires complex Ref forwarding.
    // For now, we save the text + the background image used.)
    if (currentImage) {
        // Convert data URL to blob
        const response = await fetch(currentImage);
        const blob = await response.blob();
        folder.file("background_image.png", blob);
    }

    if (!currentContent && !currentImage) {
        alert("Nothing to export!");
        return;
    }

    const content = await zip.generateAsync({ type: "blob" });
    window.saveAs(content, "project_bundle.zip");
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">Content Creator Studio</h1>
            <p className="text-xs text-slate-500">AI-Powered Facebook Editor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Desktop Nav */}
            <div className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${activeTab === 'content' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <PenTool className="w-4 h-4" /> Write Content
            </button>
            <button 
                onClick={() => setActiveTab('studio')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${activeTab === 'studio' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <ImageIcon className="w-4 h-4" /> Image Studio
            </button>
            </div>
            
            <button 
                onClick={handleExportProject}
                className="hidden md:flex bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium items-center gap-2 transition"
                title="Download Text & Image as Zip"
            >
                <FolderDown className="w-4 h-4" /> Save Project
            </button>
        </div>

        {/* Mobile Menu Icon (Placeholder) */}
        <button className="md:hidden p-2 text-slate-600" onClick={handleExportProject}>
            <FolderDown className="w-6 h-6"/>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="hidden xl:flex h-full w-full p-4 gap-4">
            <div className="w-1/3 h-full">
                <ContentWriter onContentUpdate={handleContentUpdate} />
            </div>
            <div className="w-2/3 h-full">
                <ImageStudio 
                    initialPrompt={currentContent.slice(0, 100)} 
                    onImageUpdate={handleImageUpdate}
                />
            </div>
        </div>

        <div className="xl:hidden h-full w-full p-2 md:p-4">
            {activeTab === 'content' ? (
                <ContentWriter onContentUpdate={handleContentUpdate} />
            ) : (
                <ImageStudio 
                    initialPrompt={currentContent.slice(0, 100)} 
                    onImageUpdate={handleImageUpdate}
                />
            )}
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <div className="xl:hidden md:hidden bg-white border-t border-slate-200 flex justify-around p-3 shrink-0">
        <button 
             onClick={() => setActiveTab('content')}
             className={`flex flex-col items-center gap-1 text-xs font-medium ${activeTab === 'content' ? 'text-blue-600' : 'text-slate-400'}`}
           >
             <PenTool className="w-5 h-5" /> Write
        </button>
        <button 
             onClick={() => setActiveTab('studio')}
             className={`flex flex-col items-center gap-1 text-xs font-medium ${activeTab === 'studio' ? 'text-purple-600' : 'text-slate-400'}`}
           >
             <ImageIcon className="w-5 h-5" /> Studio
        </button>
      </div>
    </div>
  );
};

export default App;