import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { StickerImage, GenerationTask, DownloadSize } from '../types';

interface ControlPanelProps {
  onGenerate: (prompt: string, referenceImage?: string) => void;
  onDownload: () => void;
  onClear: () => void;
  onSizeChange: (size: DownloadSize) => void;
  downloadSize: DownloadSize;
  activeRequests: number;
  generationQueue: GenerationTask[];
  selectedCount: number;
  totalCount: number;
  options: StickerImage[];
  selectedIds: string[];
  error?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onGenerate,
  onDownload,
  onClear,
  onSizeChange,
  downloadSize,
  activeRequests,
  generationQueue,
  selectedCount,
  totalCount,
  options,
  selectedIds,
  error
}) => {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle paste events globally
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64String = event.target?.result as string;
              if (base64String) {
                const rawBase64 = base64String.split(',')[1];
                setReferenceImage(rawBase64);
              }
            };
            reader.readAsDataURL(blob);
            break; // Stop after first image found
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, referenceImage);
      setPrompt(''); // Clear prompt after queueing
      // Note: We keep the reference image for subsequent prompts unless user clears it
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip data url prefix if needed
        const rawBase64 = base64String.split(',')[1];
        setReferenceImage(rawBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setReferenceImage(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Check if any selected option is currently processing
  const isProcessingDownload = options.some(opt => 
    selectedIds.includes(opt.id) && 
    (opt.status === 'upscaling' || opt.status === 'generating_mask' || opt.status === 'processing')
  );

  return (
    <div className="w-full lg:w-1/3 flex flex-col gap-6 order-2 lg:order-1 sticky top-8">
      {/* Input Panel */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">
              Describe your sticker idea
            </label>
            <textarea
              id="prompt"
              rows={4}
              className="w-full bg-slate-950 text-white rounded-xl border-slate-800 shadow-inner focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-lg p-4 resize-none placeholder:text-slate-600 transition-colors"
              placeholder="e.g. A retro robot drinking coffee&#10;For multiple stickers, paste a list (one prompt per line)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Reference Image Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Reference Image (Optional)
              </label>
              {referenceImage && (
                <button 
                  type="button" 
                  onClick={handleRemoveImage}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                  Remove
                </button>
              )}
            </div>
            
            {!referenceImage ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2 text-sm bg-slate-950/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 6.187l-5.123 5.123a1.5 1.5 0 01-2.122-2.122L17.5 4" />
                </svg>
                Upload or Paste Image
              </button>
            ) : (
              <div className="relative w-full h-20 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center gap-4 px-4">
                 <img src={`data:image/png;base64,${referenceImage}`} alt="Reference" className="h-14 w-14 object-cover rounded-lg border border-slate-700" />
                 <span className="text-xs text-slate-400">Image attached</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full py-4 text-lg relative"
            disabled={!prompt.trim()}
          >
            {activeRequests > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            )}
            {activeRequests > 0 ? `Queue Another (${activeRequests} active)` : 'Generate Stickers'}
          </Button>
        </form>
      </div>

      {/* Queue Section */}
      {generationQueue.length > 0 && (
        <div className="bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-800 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Queue</h3>
            <span className="text-xs font-mono text-slate-500">{generationQueue.length} pending</span>
          </div>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
            {generationQueue.map((task, index) => (
              <div key={task.batchId} className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800">
                  {index === 0 ? (
                    <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <span className="text-xs font-mono text-slate-600">#{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate font-medium" title={task.prompt}>
                    {task.prompt}
                  </p>
                  <p className="text-[10px] text-slate-600 flex items-center gap-2">
                    {index === 0 ? 'Generating...' : 'Waiting...'}
                    {task.referenceImage && (
                       <span className="text-indigo-400 bg-indigo-900/20 px-1 rounded flex items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                           <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                         </svg>
                       </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Panel */}
      {totalCount > 0 && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Download Options</h3>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              Resolution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['1K', '2K', '4K'] as DownloadSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => onSizeChange(size)}
                  className={`
                    py-2 rounded-lg text-sm font-semibold transition-all border
                    ${downloadSize === size 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }
                  `}
                >
                  {size}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {downloadSize === '1K' ? 'Fast download, standard quality.' : 'High-fidelity upscale using Gemini Pro.'}
            </p>
          </div>
          
          <p className="text-slate-400 mb-4 text-sm">
            {selectedCount} sticker{selectedCount !== 1 ? 's' : ''} selected. 
            Will process and download at <strong>{downloadSize}</strong>.
          </p>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={onDownload} 
              variant="secondary"
              className="w-full"
              disabled={selectedCount === 0}
              isLoading={isProcessingDownload}
            >
              {isProcessingDownload 
                ? 'Processing...' 
                : `Download Selected (${selectedCount})`
              }
            </Button>
            
            <Button 
              onClick={onClear} 
              variant="outline"
              className="w-full"
            >
              Clear Gallery
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-950/30 p-4 rounded-xl border border-red-900/50 text-red-400 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};