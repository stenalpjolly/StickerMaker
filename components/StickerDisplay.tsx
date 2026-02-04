import React from 'react';
import { StickerImage } from '../types';

interface StickerDisplayProps {
  image: StickerImage;
  isSelected: boolean;
  onClick: () => void;
  onZoom: () => void;
  onRegenerate: () => void;
}

export const StickerDisplay: React.FC<StickerDisplayProps> = ({ 
  image, 
  isSelected, 
  onClick, 
  onZoom, 
  onRegenerate 
}) => {
  const { original, final, status, prompt } = image;

  const activeImage = final || original;
  const isTransparent = !!final;
  const isProcessing = status === 'upscaling' || status === 'generating_mask' || status === 'processing';

  let statusText = '';
  if (status === 'upscaling') statusText = 'Upscaling to 4K...';
  else if (status === 'generating_mask') statusText = 'Designing Mask...';
  else if (status === 'processing') statusText = 'Matting...';

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

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
      
      {/* Actions Overlay (Visible on Hover) */}
      <div className="absolute inset-0 z-30 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
         <button
            onClick={(e) => handleAction(e, onZoom)}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 shadow-xl transition-transform hover:scale-110"
            title="Zoom Image"
         >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
         </button>
         
         {prompt && (
           <button
              onClick={(e) => handleAction(e, onRegenerate)}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 shadow-xl transition-transform hover:scale-110"
              title="Regenerate this prompt"
           >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
           </button>
         )}
      </div>

      {/* Top Right Status Badges */}
      <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2 pointer-events-none">
        {isTransparent && (
          <span className="bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md shadow-lg border border-emerald-400/50">
            4K Transparent
          </span>
        )}
        
        {/* Selection Indicator (Always visible if selected) */}
        <div className={`
          rounded-full p-1.5 shadow-lg transition-all duration-200
          ${isSelected 
            ? 'bg-indigo-600 text-white scale-100 opacity-100' 
            : 'bg-slate-800/80 text-slate-500 scale-90 opacity-0'
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