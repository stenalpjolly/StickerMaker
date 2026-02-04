import React, { useState } from 'react';
import { Button } from './Button';
import { StickerImage, GenerationTask } from '../types';

interface ControlPanelProps {
  onGenerate: (prompt: string) => void;
  onDownload: () => void;
  onClear: () => void;
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
  activeRequests,
  generationQueue,
  selectedCount,
  totalCount,
  options,
  selectedIds,
  error
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
      setPrompt(''); // Clear prompt after queueing
    }
  };

  // Check if any selected option is currently processing (matting/upscaling)
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
              // Input remains enabled to allow queueing
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
                  <p className="text-[10px] text-slate-600">
                    {index === 0 ? 'Generating...' : 'Waiting...'}
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
              <h3 className="text-lg font-bold text-white">Download High Quality</h3>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-900/50">
                4K Upscaling
              </span>
          </div>
          
          <p className="text-slate-400 mb-6 text-sm">
            {selectedCount} sticker{selectedCount !== 1 ? 's' : ''} selected. 
            Processing will upscale and remove backgrounds.
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