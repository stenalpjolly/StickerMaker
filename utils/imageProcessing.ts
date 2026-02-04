import { MattingResult } from '../types';

// Helper to load an image from base64
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src.startsWith('data:') ? src : `data:image/png;base64,${src}`;
  });
};

/**
 * Implements the "Difference Matting" technique.
 * Alpha = 1 - (WhiteImage - BlackImage)
 */
export const processDifferenceMatting = async (
  whiteBgBase64: string,
  blackBgBase64: string
): Promise<MattingResult> => {
  const [imgWhite, imgBlack] = await Promise.all([
    loadImage(whiteBgBase64),
    loadImage(blackBgBase64),
  ]);

  const width = imgWhite.width;
  const height = imgWhite.height;

  if (imgBlack.width !== width || imgBlack.height !== height) {
    throw new Error("Images dimensions do not match");
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error("Could not get canvas context");

  // Draw White BG version
  ctx.drawImage(imgWhite, 0, 0);
  const whiteData = ctx.getImageData(0, 0, width, height);

  // Draw Black BG version
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(imgBlack, 0, 0);
  const blackData = ctx.getImageData(0, 0, width, height);

  // Output buffer
  const outputImage = ctx.createImageData(width, height);

  const wBuf = whiteData.data;
  const bBuf = blackData.data;
  const outBuf = outputImage.data;

  // Pixel Processing
  for (let i = 0; i < wBuf.length; i += 4) {
    const Rw = wBuf[i];
    const Gw = wBuf[i + 1];
    const Bw = wBuf[i + 2];

    const Rb = bBuf[i];
    const Gb = bBuf[i + 1];
    const Bb = bBuf[i + 2];

    // Calculate difference per channel
    // Formula derivation:
    // C_w = alpha * F + (1 - alpha) * 1  (assuming white is 1.0)
    // C_b = alpha * F + (1 - alpha) * 0  (assuming black is 0.0)
    // C_w - C_b = (1 - alpha)
    // alpha = 1 - (C_w - C_b)
    
    // Using 0-255 scale:
    // Diff = C_w - C_b
    // alpha = 255 - Diff

    const diffR = Math.max(0, Rw - Rb);
    const diffG = Math.max(0, Gw - Gb);
    const diffB = Math.max(0, Bw - Bb);

    // Average difference to estimate alpha
    const avgDiff = (diffR + diffG + diffB) / 3;
    
    // Calculate Alpha
    // We add a small tolerance/clamping to ensure pure backgrounds remain transparent
    let alpha = 255 - avgDiff;

    // Enhance contrast of alpha channel slightly to clean up semi-transparent noise
    // if alpha is very low (transparent), force to 0
    if (alpha < 10) alpha = 0;
    // if alpha is very high (opaque), force to 255
    if (alpha > 245) alpha = 255;

    // Recover Foreground Color F
    // C_b = alpha * F  =>  F = C_b / alpha
    // If alpha is 0, color doesn't matter (use black)
    
    let Rf = 0, Gf = 0, Bf = 0;
    
    if (alpha > 0) {
      const alphaNorm = alpha / 255.0;
      Rf = Math.min(255, Rb / alphaNorm);
      Gf = Math.min(255, Gb / alphaNorm);
      Bf = Math.min(255, Bb / alphaNorm);
    }

    outBuf[i] = Rf;
    outBuf[i + 1] = Gf;
    outBuf[i + 2] = Bf;
    outBuf[i + 3] = alpha;
  }

  // Put processed data back
  ctx.putImageData(outputImage, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');

  return { imageData: outputImage, dataUrl };
};