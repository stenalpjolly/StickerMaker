import React, { useEffect } from 'react';
import { StickerImage } from '../types';

interface ImageModalProps {
  image: StickerImage | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!image) return null;

  const { original, final, prompt, status } = image;
  const activeImage = final || original;
  const isTransparent = !!final;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative w-full max-w-4xl max-h-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col animate-scale-in">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-full transition-colors backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Container */}
        <div className={`relative flex-1 min-h-[50vh] flex items-center justify-center bg-checkerboard overflow-hidden`}>
          {!isTransparent && (
             <div className="absolute inset-0 bg-white" />
          )}
          
          {activeImage ? (
            <img 
              src={`data:image/png;base64,${activeImage}`} 
              alt={prompt || "Sticker"} 
              className="relative z-10 max-h-[70vh] w-auto object-contain drop-shadow-2xl"
            />
          ) : (
             <div className="text-slate-500">Image unavailable</div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-slate-900 border-t border-slate-800">
           <div className="flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-900/50">
                  {status === 'complete' ? '4K Transparent' : status === 'idle' ? 'Preview' : 'Processing...'}
                </span>
             </div>
             {prompt && (
               <p className="text-slate-200 text-lg font-medium leading-snug">
                 {prompt}
               </p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};