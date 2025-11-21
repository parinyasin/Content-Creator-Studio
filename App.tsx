import React, { useState } from 'react';
import { ContentWriter } from './components/ContentWriter';
import ImageStudio from './components/ImageStudio';
import { PenTool, Image as ImageIcon, Layout, Sparkles } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { ActiveTab } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('content');
  const [generatedContent, setGeneratedContent] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-200">
            <Layout size={20} />
          </div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight hidden md:block">Content Creator Studio</h1>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight md:hidden">Studio</h1>
        </div>
        
        <nav className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'content' 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <PenTool size={16} />
            <span className="hidden sm:inline">Content Writer</span>
            <span className="sm:hidden">Write</span>
          </button>
          <button 
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'studio' 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <ImageIcon size={16} />
            <span className="hidden sm:inline">Image Studio</span>
            <span className="sm:hidden">Design</span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'content' ? (
          <div className="max-w-5xl mx-auto p-4 md:p-6 h-full overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="text-blue-500" /> Create Compelling Content
                </h2>
                <p className="text-slate-500 mt-1">Generate optimized text for Facebook posts using Gemini AI.</p>
            </div>
            <ContentWriter onContentUpdate={(text) => setGeneratedContent(text)} />
          </div>
        ) : (
          <div className="h-full w-full">
            <ImageStudio initialPrompt={generatedContent.split('\n')[0] || "Professional studio background, clean lighting"} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;