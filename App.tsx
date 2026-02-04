import React from 'react';
import { useStickerGenerator } from './hooks/useStickerGenerator';
import { ControlPanel } from './components/ControlPanel';
import { StickerGrid } from './components/StickerGrid';

const App: React.FC = () => {
  const { 
    options, 
    isGeneratingBase, 
    selectedIds, 
    error,
    generateStickers, 
    toggleStickerSelection,
    processSelectedStickers 
  } = useStickerGenerator();

  const handleDownload = async () => {
    if (selectedIds.length === 0) return;
    await processSelectedStickers();
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
          Select multiple designs below to batch upscale and process.
        </p>
      </header>

      <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
        
        <ControlPanel 
          onGenerate={generateStickers}
          onDownload={handleDownload}
          isGenerating={isGeneratingBase}
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
            isGenerating={isGeneratingBase}
          />
        </div>

      </div>
    </div>
  );
};

export default App;