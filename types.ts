export interface GenerationTask {
  batchId: number;
  prompt: string;
}

export interface StickerImage {
  id: string;
  original?: string; // Optional during initial generation
  mask?: string;    // 4K black bg mask
  final?: string;   // 4K transparent result
  status: 'generating_base' | 'idle' | 'upscaling' | 'generating_mask' | 'processing' | 'complete' | 'error';
  prompt?: string;
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