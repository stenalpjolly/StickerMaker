import { GoogleGenAI, Type } from "@google/genai";
import { DownloadSize } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

const ensurePaidApiKey = async () => {
  const win = window as any;
  if (win.aistudio) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await win.aistudio.openSelectKey();
    }
  }
};

/**
 * Intelligent Prompt Splitter using Flash Lite
 */
export const parsePrompts = async (rawInput: string): Promise<string[]> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          { text: "You are a helper for a sticker generation app. Analyze the user's input and break it down into a list of distinct, self-contained sticker descriptions. If the user describes multiple items (e.g. 'a cat, a dog, and a bird' or a paragraph describing several stickers), split them into separate strings. Clean up the prompts by removing request phrases like 'generate a', 'I want', 'make me'. Return a JSON array of strings." },
          { text: `Input: "${rawInput}"` }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      if (Array.isArray(parsed)) {
        return parsed.map(s => String(s).trim()).filter(s => s.length > 0);
      }
    }
  } catch (error) {
    console.warn("AI Prompt splitting failed, falling back to simple split.", error);
  }

  // Fallback: Split by newline
  return rawInput.split('\n').map(p => p.trim()).filter(p => p.length > 0);
};

/**
 * Single generation request helper (Fast Preview - 1K)
 */
const generateSingleBaseSticker = async (prompt: string, referenceImage?: string): Promise<string> => {
  const ai = getClient();
  
  let fullPrompt = `A high quality, isolated die-cut sticker of ${prompt}. Flat vector style, white border, centered on a solid white background (#FFFFFF). Ensure the background is pure white.`;
  
  const parts: any[] = [];
  
  if (referenceImage) {
    parts.push({
      inlineData: {
        mimeType: 'image/png', // Assumes PNG for consistency, though API handles others
        data: referenceImage
      }
    });
    fullPrompt += " Use the attached image as a visual reference for the subject.";
  }
  
  parts.push({ text: fullPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: parts
    },
    config: {
      imageConfig: {
        aspectRatio: '1:1',
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  
  throw new Error("No image generated from Gemini.");
}

/**
 * Step 1: Generate 4 sticker options in parallel (Fast).
 */
export const generateBaseStickerOptions = async (prompt: string, referenceImage?: string): Promise<string[]> => {
  const promises = Array(4).fill(null).map(() => generateSingleBaseSticker(prompt, referenceImage));
  return Promise.all(promises);
};

/**
 * Step 1.5: Upscale/Regenerate image to specific size (High Quality).
 */
export const upscaleImage = async (base64: string, size: DownloadSize = '4K'): Promise<string> => {
  // If requesting > 1K, we use the Pro model which requires paid key check
  if (size !== '1K') {
    await ensurePaidApiKey();
  }
  
  const ai = getClient();

  // If size is 1K, we can use flash-image, but for "upscaling" consistency we stick to Pro 
  // if available for better fidelity, or use flash-image if sticking to free tier logic.
  // However, `gemini-3-pro-image-preview` is the only one that supports explicit `imageSize`.
  // `gemini-2.5-flash-image` defaults to 1K (approx 1024x1024).
  
  const model = size === '1K' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
  
  // imageSize param is only supported on Pro
  const imageConfig = size !== '1K' 
    ? { imageSize: size, aspectRatio: '1:1' as const } 
    : { aspectRatio: '1:1' as const };

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64 } },
        { text: `Generate a high-fidelity, ${size} resolution version of this sticker. Preserve the exact composition, colors, and subject details. Keep the background pure white.` }
      ]
    },
    config: {
      imageConfig
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }

  throw new Error("Failed to upscale image.");
};

/**
 * Step 2: Generate Matte Pair
 */
export const generateMattePair = async (originalBase64: string, size: DownloadSize = '4K'): Promise<string> => {
  if (size !== '1K') {
    await ensurePaidApiKey();
  }
  const ai = getClient();
  
  const model = size === '1K' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
  const imageConfig = size !== '1K' 
    ? { imageSize: size, aspectRatio: '1:1' as const } 
    : { aspectRatio: '1:1' as const };

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: originalBase64
          }
        },
        {
          text: "Change the background to solid black (#000000). Do not change the subject. Keep the sticker subject exactly identical to the original image."
        }
      ]
    },
    config: {
      imageConfig
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }

  throw new Error("Failed to generate matte pair.");
};