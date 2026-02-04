import React from 'react';
import { StickerImage } from '../types';
import { StickerDisplay } from './StickerDisplay';

interface StickerGridProps {
  options: StickerImage[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  isGenerating: boolean;
}

export const StickerGrid: React.FC<StickerGridProps> = ({ 
  options, 
  selectedIds, 
  onToggle, 
  isGenerating 
}) => {
  if (options.length === 0 && !isGenerating) {
    return (
      <div className="aspect-[4/3] bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 p-8 text-center h-full">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        <p className="font-medium text-lg">Enter a prompt to generate 4 variations</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6">
      {isGenerating ? (
        // Skeletons
        Array(4).fill(0).map((_, i) => (
          <div key={i} className="aspect-square bg-slate-900 rounded-2xl animate-pulse ring-1 ring-slate-800"></div>
        ))
      ) : (
        // Results
        options.map((option) => (
          <StickerDisplay 
            key={option.id}
            image={option}
            isSelected={selectedIds.includes(option.id)}
            onClick={() => onToggle(option.id)}
          />
        ))
      )}
    </div>
  );
};