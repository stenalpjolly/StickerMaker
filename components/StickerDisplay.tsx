import React from 'react';
import { StickerImage } from '../types';

interface StickerDisplayProps {
  image: StickerImage;
  isSelected: boolean;
  onClick: () => void;
}

export const StickerDisplay: React.FC<StickerDisplayProps> = ({ image, isSelected, onClick }) => {
  const { original, final, status } = image;

  const activeImage = final || original;
  const isTransparent = !!final;
  const isProcessing = status === 'upscaling' || status === 'generating_mask' || status === 'processing';

  let statusText = '';
  if (status === 'upscaling') statusText = 'Upscaling to 4K...';
  else if (status === 'generating_mask') statusText = 'Designing Mask...';
  else if (status === 'processing') statusText = 'Matting...';

  return (
    <div 
      onClick={onClick}
      className={`
        relative w-full aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group
        ${isSelected 
          ? 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-slate-950 scale-[1.02] shadow-2xl shadow-indigo-900/20' 
          : 'ring-1 ring-slate-800 hover:ring-slate-600 hover:scale-[1.01]'
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
          className="relative z-10 w-full h-full object-contain p-2"
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
      
      {/* Status Badges */}
      <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2">
        {isTransparent && (
          <span className="bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md shadow-lg border border-emerald-400/50">
            4K Transparent
          </span>
        )}
        
        {/* Selection Indicator */}
        <div className={`
          rounded-full p-1.5 shadow-lg transition-all duration-200
          ${isSelected 
            ? 'bg-indigo-600 text-white scale-100' 
            : 'bg-slate-800/80 text-slate-500 scale-90 opacity-0 group-hover:opacity-100'
          }
        `}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};