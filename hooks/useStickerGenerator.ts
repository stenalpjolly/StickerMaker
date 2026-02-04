import { useState, useCallback, useEffect } from 'react';
import { generateBaseStickerOptions, generateMattePair, upscaleImage } from '../services/geminiService';
import { processDifferenceMatting } from '../utils/imageProcessing';
import { StickerImage, GenerationTask } from '../types';

interface UseStickerGeneratorReturn {
  options: StickerImage[];
  activeRequests: number;
  generationQueue: GenerationTask[];
  selectedIds: string[];
  error?: string;
  generateStickers: (prompt: string) => Promise<void>;
  toggleStickerSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  clearSession: () => void;
  processSelectedStickers: () => Promise<void>;
}

export const useStickerGenerator = (): UseStickerGeneratorReturn => {
  const [generationQueue, setGenerationQueue] = useState<GenerationTask[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  const [options, setOptions] = useState<StickerImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();

  // Queue Processing Effect
  useEffect(() => {
    const processNextBatch = async () => {
      if (generationQueue.length === 0 || isProcessingQueue) return;

      setIsProcessingQueue(true);
      const task = generationQueue[0];

      try {
        const base64List = await generateBaseStickerOptions(task.prompt);
        
        setOptions(prev => prev.map(opt => {
          if (opt.id.startsWith(`opt-${task.batchId}-`)) {
            const indexParts = opt.id.split('-');
            const index = parseInt(indexParts[indexParts.length - 1]);
            return {
              ...opt,
              original: base64List[index],
              status: 'idle'
            };
          }
          return opt;
        }));
      } catch (err) {
        console.error(err);
        setError('Failed to generate a batch. Please try again.');
        // Mark placeholders as error
        setOptions(prev => prev.map(opt => {
          if (opt.id.startsWith(`opt-${task.batchId}-`)) {
            return { ...opt, status: 'error' };
          }
          return opt;
        }));
      } finally {
        // Remove processed task and continue
        setGenerationQueue(prev => prev.slice(1));
        setIsProcessingQueue(false);
      }
    };

    processNextBatch();
  }, [generationQueue, isProcessingQueue]);

  const generateStickers = useCallback(async (prompt: string) => {
    setError(undefined);
    const batchId = Date.now();
    
    // 1. Create placeholders immediately
    const placeholders: StickerImage[] = Array(4).fill(null).map((_, i) => ({
      id: `opt-${batchId}-${i}`,
      status: 'generating_base',
      prompt: prompt
    }));

    setOptions(prev => [...placeholders, ...prev]);

    // 2. Add to queue
    setGenerationQueue(prev => [...prev, { batchId, prompt }]);
  }, []);

  const toggleStickerSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    const readyIds = options
      .filter(o => o.original && o.status !== 'generating_base' && o.status !== 'error')
      .map(o => o.id);
    setSelectedIds(readyIds);
  }, [options]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const clearSession = useCallback(() => {
    setOptions([]);
    setSelectedIds([]);
    setGenerationQueue([]);
    setError(undefined);
  }, []);

  const updateOptionStatus = useCallback((id: string, status: StickerImage['status'], extraData: Partial<StickerImage> = {}) => {
    setOptions(prev => {
      const newOptions = [...prev];
      const idx = newOptions.findIndex(o => o.id === id);
      if (idx !== -1) {
        newOptions[idx] = { ...newOptions[idx], status, ...extraData };
      }
      return newOptions;
    });
  }, []);

  const processSingleSticker = useCallback(async (id: string) => {
    const option = options.find(o => o.id === id);
    if (!option || !option.original) return;

    if (option.final) {
      downloadImage(option.final, `sticker-4k-${id}.png`);
      return;
    }

    try {
      updateOptionStatus(id, 'upscaling');
      const highResOriginal = await upscaleImage(option.original);
      
      updateOptionStatus(id, 'generating_mask', { original: highResOriginal });

      const maskBase64 = await generateMattePair(highResOriginal, true);
      updateOptionStatus(id, 'processing', { mask: maskBase64 });

      const result = await processDifferenceMatting(highResOriginal, maskBase64);
      const finalBase64 = result.dataUrl.split(',')[1];

      updateOptionStatus(id, 'complete', { final: finalBase64 });
      
      downloadImage(finalBase64, `sticker-4k-${id}.png`);

    } catch (err) {
      console.error(`Failed to process sticker ${id}`, err);
      updateOptionStatus(id, 'error');
    }
  }, [options, updateOptionStatus]);

  const processSelectedStickers = useCallback(async () => {
    const idsToProcess = [...selectedIds];
    const tasks = idsToProcess.map(id => processSingleSticker(id));
    return Promise.all(tasks).then(() => {});
  }, [selectedIds, processSingleSticker]);

  return {
    options,
    activeRequests: generationQueue.length,
    generationQueue,
    selectedIds,
    error,
    generateStickers,
    toggleStickerSelection,
    selectAll,
    clearSelection,
    clearSession,
    processSelectedStickers
  };
};

const downloadImage = (base64: string, filename: string) => {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => document.body.removeChild(link), 100);
};