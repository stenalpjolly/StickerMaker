import { useState, useCallback } from 'react';
import { generateBaseStickerOptions, generateMattePair, upscaleImage } from '../services/geminiService';
import { processDifferenceMatting } from '../utils/imageProcessing';
import { StickerImage } from '../types';

interface UseStickerGeneratorReturn {
  options: StickerImage[];
  isGeneratingBase: boolean;
  selectedIds: string[];
  error?: string;
  generateStickers: (prompt: string) => Promise<void>;
  toggleStickerSelection: (id: string) => void;
  selectAll: () => void;
  processSelectedStickers: () => Promise<void>;
}

export const useStickerGenerator = (): UseStickerGeneratorReturn => {
  const [isGeneratingBase, setIsGeneratingBase] = useState(false);
  const [options, setOptions] = useState<StickerImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();

  const generateStickers = useCallback(async (prompt: string) => {
    setIsGeneratingBase(true);
    setOptions([]);
    setSelectedIds([]);
    setError(undefined);

    try {
      const base64List = await generateBaseStickerOptions(prompt);
      
      const newOptions = base64List.map((base64, index) => ({
        id: `opt-${Date.now()}-${index}`,
        original: base64,
        status: 'idle' as const
      }));

      setOptions(newOptions);
      // Auto select all by default for convenience? Or none? Let's select first.
      if (newOptions.length > 0) {
        setSelectedIds([newOptions[0].id]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate stickers. Please try again.');
    } finally {
      setIsGeneratingBase(false);
    }
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
    setSelectedIds(options.map(o => o.id));
  }, [options]);

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
    if (!option) return;

    if (option.final) {
      // Already processed, just trigger download
      downloadImage(option.final, `sticker-4k-${id}.png`);
      return;
    }

    try {
      // Step 1: Upscale to 4K
      updateOptionStatus(id, 'upscaling');
      const highResOriginal = await upscaleImage(option.original);
      
      // Update the 'original' with the high-res version so the diff works on 4K
      updateOptionStatus(id, 'generating_mask', { original: highResOriginal });

      // Step 2: Generate 4K Mask
      const maskBase64 = await generateMattePair(highResOriginal, true);
      updateOptionStatus(id, 'processing', { mask: maskBase64 });

      // Step 3: Difference Matting
      const result = await processDifferenceMatting(highResOriginal, maskBase64);
      const finalBase64 = result.dataUrl.split(',')[1];

      updateOptionStatus(id, 'complete', { final: finalBase64 });
      
      downloadImage(finalBase64, `sticker-4k-${id}.png`);

    } catch (err) {
      console.error(`Failed to process sticker ${id}`, err);
      updateOptionStatus(id, 'error');
      // Don't set global error to avoid blocking other concurrent downloads
    }
  }, [options, updateOptionStatus]);

  const processSelectedStickers = useCallback(async () => {
    // Process all selected items in parallel
    const tasks = selectedIds.map(id => processSingleSticker(id));
    await Promise.all(tasks);
  }, [selectedIds, processSingleSticker]);

  return {
    options,
    isGeneratingBase,
    selectedIds,
    error,
    generateStickers,
    toggleStickerSelection,
    selectAll,
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