import React, { useState } from 'react';
import { Button } from './Button';
import { StickerImage } from '../types';

interface ControlPanelProps {
  onGenerate: (prompt: string) => void;
  onDownload: () => void;
  isGenerating: boolean;
  selectedCount: number;
  totalCount: number;
  options: StickerImage[];
  selectedIds: string[];
  error?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onGenerate,
  onDownload,
  isGenerating,
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
    }
  };

  // Determine if any selected option is currently processing
  const isProcessing = options.some(opt => 
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
              placeholder="e.g. A retro robot drinking coffee, vector art style"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full py-4 text-lg"
            disabled={!prompt.trim()}
            isLoading={isGenerating}
          >
            {isGenerating ? 'Designing 4 Options...' : 'Generate Previews'}
          </Button>
        </form>
      </div>

      {/* Action Panel */}
      {totalCount > 0 && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Download High Quality</h3>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-900/50">
                4K Upscaling Active
              </span>
          </div>
          
          <p className="text-slate-400 mb-6 text-sm">
            Selected stickers will be upscaled to 4K resolution and processed for transparency.
          </p>
          
          <Button 
            onClick={onDownload} 
            variant="secondary"
            className="w-full"
            disabled={selectedCount === 0}
            isLoading={isProcessing}
          >
            {isProcessing 
              ? 'Processing...' 
              : `Download Selected (${selectedCount})`
            }
          </Button>
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