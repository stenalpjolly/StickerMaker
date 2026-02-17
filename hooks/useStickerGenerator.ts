import { useState, useCallback, useEffect } from 'react';
import { generateBaseStickerOptions, generateMattePair, upscaleImage, parsePrompts } from '../services/geminiService';
import { processDifferenceMatting } from '../utils/imageProcessing';
import { StickerImage, GenerationTask, DownloadSize, HistoryItem } from '../types';

interface UseStickerGeneratorReturn {
  options: StickerImage[];
  activeRequests: number;
  generationQueue: GenerationTask[];
  selectedIds: string[];
  error?: string;
  downloadSize: DownloadSize;
  history: HistoryItem[];
  setDownloadSize: (size: DownloadSize) => void;
  generateStickers: (prompt: string, referenceImage?: string, isRawMode?: boolean) => Promise<void>;
  toggleStickerSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  clearSession: () => void;
  processSelectedStickers: () => Promise<void>;
  restoreFromHistory: (item: HistoryItem) => void;
}

export const useStickerGenerator = (): UseStickerGeneratorReturn => {
  const [generationQueue, setGenerationQueue] = useState<GenerationTask[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  const [options, setOptions] = useState<StickerImage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [downloadSize, setDownloadSize] = useState<DownloadSize>('4K');
  const [error, setError] = useState<string | undefined>();

  // Queue Processing Effect
  useEffect(() => {
    const processNextBatch = async () => {
      if (generationQueue.length === 0 || isProcessingQueue) return;

      setIsProcessingQueue(true);
      const task = generationQueue[0];

      try {
        const base64List = await generateBaseStickerOptions(task.prompt, task.referenceImage);
        
        // Update active options
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

        // Update history entry with the generated images
        setHistory(prev => prev.map(item => {
          if (item.batchId === task.batchId) {
            const updatedImages = item.images.map((img, idx) => ({
              ...img,
              original: base64List[idx],
              status: 'idle' as const
            }));
            return { ...item, images: updatedImages };
          }
          return item;
        }));

      } catch (err) {
        console.error(err);
        setError('Failed to generate a batch. Please try again.');
        
        // Mark placeholders as error in options
        setOptions(prev => prev.map(opt => {
          if (opt.id.startsWith(`opt-${task.batchId}-`)) {
            return { ...opt, status: 'error' };
          }
          return opt;
        }));

        // Mark in history too
        setHistory(prev => prev.map(item => {
           if (item.batchId === task.batchId) {
             return {
               ...item,
               images: item.images.map(img => ({ ...img, status: 'error' }))
             };
           }
           return item;
        }));

      } finally {
        // Remove processed task and continue
        setGenerationQueue(prev => prev.slice(1));
        setIsProcessingQueue(false);
      }
    };

    processNextBatch();
  }, [generationQueue, isProcessingQueue]);

  const generateStickers = useCallback(async (rawInput: string, referenceImage?: string, isRawMode: boolean = false) => {
    setError(undefined);
    
    let prompts: string[] = [];
    
    if (isRawMode) {
      // Split by newlines, but do NOT use AI parsing
      prompts = rawInput.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    } else {
      try {
        prompts = await parsePrompts(rawInput);
      } catch (e) {
        console.error("Splitting failed", e);
        // Fallback to basic split if AI fails
        prompts = rawInput.split('\n').map(p => p.trim()).filter(p => p.length > 0);
      }
    }

    if (prompts.length === 0) return;

    const timestamp = Date.now();
    const newTasks: GenerationTask[] = [];
    const allPlaceholders: StickerImage[] = [];

    // Create tasks and placeholders for each prompt
    prompts.forEach((prompt, index) => {
      // Add index to timestamp to ensure unique batchIds for simultaneous submissions
      const batchId = timestamp + index;
      
      newTasks.push({ batchId, prompt, referenceImage });

      const placeholders = Array(4).fill(null).map((_, i) => ({
        id: `opt-${batchId}-${i}`,
        status: 'generating_base' as const,
        prompt: prompt
      }));
      
      allPlaceholders.push(...placeholders);

      // Add to history immediately
      setHistory(prev => [{
        batchId,
        prompt,
        timestamp,
        images: placeholders
      }, ...prev]);
    });

    // Update state
    setOptions(prev => [...allPlaceholders, ...prev]);
    setGenerationQueue(prev => [...prev, ...newTasks]);
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

  const restoreFromHistory = useCallback((item: HistoryItem) => {
    setOptions(prev => {
      const existingIds = new Set(prev.map(o => o.id));
      const newItems = item.images.filter(img => !existingIds.has(img.id));
      return [...newItems, ...prev];
    });
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
      // If already processed, just download
      downloadImage(option.final, `sticker-${downloadSize}-${id}.png`);
      return;
    }

    try {
      updateOptionStatus(id, 'upscaling');
      
      // 1. Upscale/Resize
      const highResOriginal = await upscaleImage(option.original, downloadSize);
      updateOptionStatus(id, 'generating_mask', { original: highResOriginal });

      // 2. Generate Matte
      const maskBase64 = await generateMattePair(highResOriginal, downloadSize);
      updateOptionStatus(id, 'processing', { mask: maskBase64 });

      // 3. Difference Matting
      const result = await processDifferenceMatting(highResOriginal, maskBase64);
      const finalBase64 = result.dataUrl.split(',')[1];

      updateOptionStatus(id, 'complete', { final: finalBase64 });
      
      downloadImage(finalBase64, `sticker-${downloadSize}-${id}.png`);

    } catch (err) {
      console.error(`Failed to process sticker ${id}`, err);
      updateOptionStatus(id, 'error');
    }
  }, [options, updateOptionStatus, downloadSize]);

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
    downloadSize,
    history,
    setDownloadSize,
    generateStickers,
    toggleStickerSelection,
    selectAll,
    clearSelection,
    clearSession,
    processSelectedStickers,
    restoreFromHistory
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