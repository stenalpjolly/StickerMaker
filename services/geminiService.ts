import { GoogleGenAI, Type } from "@google/genai";

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
const generateSingleBaseSticker = async (prompt: string): Promise<string> => {
  const ai = getClient();
  
  const fullPrompt = `A high quality, isolated die-cut sticker of ${prompt}. Flat vector style, white border, centered on a solid white background (#FFFFFF). Ensure the background is pure white.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: fullPrompt }]
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
export const generateBaseStickerOptions = async (prompt: string): Promise<string[]> => {
  const promises = Array(4).fill(null).map(() => generateSingleBaseSticker(prompt));
  return Promise.all(promises);
};

/**
 * Step 1.5: Upscale image to 4K (High Quality).
 */
export const upscaleImage = async (base64: string): Promise<string> => {
  await ensurePaidApiKey();
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64 } },
        { text: "Generate a high-fidelity, 4K resolution version of this sticker. Preserve the exact composition, colors, and subject details. Keep the background pure white." }
      ]
    },
    config: {
      imageConfig: {
        imageSize: '4K',
        aspectRatio: '1:1'
      }
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
 * Step 2: Generate Matte Pair (supports 4K via Pro model).
 */
export const generateMattePair = async (originalBase64: string, highQuality: boolean = false): Promise<string> => {
  if (highQuality) {
    await ensurePaidApiKey();
  }
  const ai = getClient();
  
  // Use Pro for 4K mask, Flash for 1K mask
  const model = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const imageConfig = highQuality ? { imageSize: '4K' as const, aspectRatio: '1:1' as const } : undefined;

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