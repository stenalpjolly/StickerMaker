export type DownloadSize = '1K' | '2K' | '4K';

export interface GenerationTask {
  batchId: number;
  prompt: string;
  referenceImage?: string; // Base64 string of the uploaded reference
}

export interface StickerImage {
  id: string;
  original?: string; // Optional during initial generation
  mask?: string;    // black bg mask
  final?: string;   // transparent result
  status: 'generating_base' | 'idle' | 'upscaling' | 'generating_mask' | 'processing' | 'complete' | 'error';
  prompt?: string;
}

export interface HistoryItem {
  batchId: number;
  prompt: string;
  timestamp: number;
  images: StickerImage[];
}

export interface AppState {
  activeRequests: number;
  options: StickerImage[];
  selectedIds: string[]; 
  error?: string;
}

export interface MattingResult {
  imageData: ImageData;
  dataUrl: string;
}