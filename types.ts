export interface StickerImage {
  id: string;
  original: string; // Starts as 1K, becomes 4K after upscaling
  mask?: string;    // 4K black bg mask
  final?: string;   // 4K transparent result
  status: 'idle' | 'upscaling' | 'generating_mask' | 'processing' | 'complete' | 'error';
}

export interface AppState {
  isGeneratingBase: boolean;
  options: StickerImage[];
  selectedIds: string[]; // Changed from single ID to array
  error?: string;
}

export interface MattingResult {
  imageData: ImageData;
  dataUrl: string;
}