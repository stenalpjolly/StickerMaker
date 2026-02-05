import React, { useState } from 'react';
import { useStickerGenerator } from './hooks/useStickerGenerator';
import { ControlPanel } from './components/ControlPanel';
import { StickerGrid } from './components/StickerGrid';
import { ImageModal } from './components/ImageModal';
import { StickerImage } from './types';

const App: React.FC = () => {
  const { 
    options, 
    activeRequests, 
    generationQueue,
    selectedIds, 
    error,
    downloadSize,
    setDownloadSize,
    generateStickers, 
    toggleStickerSelection,
    clearSelection,
    clearSession,
    processSelectedStickers 
  } = useStickerGenerator();

  const [zoomedImage, setZoomedImage] = useState<StickerImage | null>(null);

  const handleDownload = () => {
    if (selectedIds.length === 0) return;
    
    // Start processing in background
    processSelectedStickers();
    
    // Clear selection immediately so user can select others
    clearSelection();
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="text-center mb-10 mt-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
          Sticker<span className="text-indigo-500">Gen</span>
        </h1>
        <p className="text-lg text-slate-400">
          Create professional 4K transparent stickers with AI.
          <br className="hidden md:block"/>
          Queue multiple prompts and batch process your favorites.
        </p>
      </header>

      <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
        
        <ControlPanel 
          onGenerate={generateStickers}
          onDownload={handleDownload}
          onClear={clearSession}
          onSizeChange={setDownloadSize}
          downloadSize={downloadSize}
          activeRequests={activeRequests}
          generationQueue={generationQueue}
          selectedCount={selectedIds.length}
          totalCount={options.length}
          options={options}
          selectedIds={selectedIds}
          error={error}
        />

        <div className="w-full lg:w-2/3 order-1 lg:order-2">
          <StickerGrid 
            options={options}
            selectedIds={selectedIds}
            onToggle={toggleStickerSelection}
            onZoom={setZoomedImage}
            onRegenerate={(prompt) => generateStickers(prompt)}
          />
        </div>

      </div>

      <ImageModal 
        image={zoomedImage}
        onClose={() => setZoomedImage(null)}
      />
    </div>
  );
};

export default App;