import React from 'react';
import { StickerImage } from '../types';

interface StickerDisplayProps {
  image: StickerImage;
  isSelected: boolean;
  onToggle: () => void;
  onZoom: () => void;
  onRegenerate: () => void;
}

export const StickerDisplay: React.FC<StickerDisplayProps> = ({ 
  image, 
  isSelected, 
  onToggle, 
  onZoom, 
  onRegenerate 
}) => {
  const { original, final, status, prompt } = image;

  const activeImage = final || original;
  const isTransparent = !!final;
  const isProcessing = status === 'upscaling' || status === 'generating_mask' || status === 'processing';

  let statusText = '';
  if (status === 'upscaling') statusText = 'Upscaling...';
  else if (status === 'generating_mask') statusText = 'Masking...';
  else if (status === 'processing') statusText = 'Matting...';

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div 
      onClick={onZoom}
      className={`
        relative w-full aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group
        bg-slate-900 border border-slate-800
        ${isSelected 
          ? 'ring-2 ring-indigo-500 bg-indigo-900/10' 
          : 'hover:border-slate-600'
        }
      `}
    >
      
      {/* Background container */}
      <div className={`absolute inset-0 ${isTransparent ? 'bg-checkerboard' : 'bg-white'}`} />
      
      {/* The Image */}
      {activeImage && (
        <img 
          src={`data:image/png;base64,${activeImage}`} 
          alt="Generated Sticker" 
          className={`relative z-10 w-full h-full object-contain p-2 transition-transform duration-500 ${isSelected ? 'scale-90' : 'group-hover:scale-105'}`}
        />
      )}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
          <div className="relative w-12 h-12 mb-3">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-white text-xs font-medium animate-pulse">
            {statusText}
          </p>
        </div>
      )}
      
      {/* Selection Circle (Google Photos style) - Top Left */}
      <div 
        onClick={(e) => handleAction(e, onToggle)}
        className={`
          absolute top-3 left-3 z-40 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 border-2
          ${isSelected 
            ? 'bg-indigo-600 border-indigo-600 text-white opacity-100 scale-100 shadow-lg' 
            : 'bg-black/20 border-white/70 hover:bg-black/40 hover:border-white opacity-0 group-hover:opacity-100 scale-90 hover:scale-105'
          }
        `}
      >
        {isSelected && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      {/* Actions Overlay (Visible on Hover) - Only Regenerate now */}
      <div className="absolute inset-0 z-30 pointer-events-none flex items-end justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
         {prompt && (
           <button
              onClick={(e) => handleAction(e, onRegenerate)}
              className="p-2 bg-slate-900/80 hover:bg-indigo-600 backdrop-blur-md rounded-lg text-white border border-white/10 shadow-lg transition-colors pointer-events-auto"
              title="Regenerate this prompt"
           >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
           </button>
         )}
      </div>

      {/* Top Right Status Badges */}
      <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2 pointer-events-none">
        {isTransparent && (
          <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md shadow-lg border border-emerald-400/50">
            4K
          </span>
        )}
      </div>
    </div>
  );
};