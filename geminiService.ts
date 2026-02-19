
import { GoogleGenAI, Type, Blob, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "./constants";
import { UserProfile } from "./types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// تحليل المستندات الطبية باستخدام Pro مع Thinking Budget
export const analyzeMedicalDocument = async (base64: string, mimeType: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: `حلل هذا المستند الطبي (تقرير مختبر أو وصفة دواء) بدقة متناهية.
        إذا كان تقريراً: استخرج النتائج والقيم والحالة الصحية.
        إذا كان دواءً: استخرج الاسم، الغرض، والجرعة.
        يجب أن تكون الإجابة بتنسيق JSON حصراً.` }
      ]
    },
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          date: { type: Type.STRING },
          place: { type: Type.STRING },
          summary: { type: Type.STRING, description: "Detailed summary of findings" },
          actualCost: { type: Type.NUMBER },
          category: { type: Type.STRING },
          medications: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nameAr: { type: Type.STRING },
                dosage: { type: Type.STRING },
                purpose: { type: Type.STRING },
                categoryAr: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const startChat = (useThinking = false) => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: useThinking ? { thinkingBudget: 32768 } : undefined
    },
  });
};

export const generateImage = async (prompt: string, imageSize: '1K' | '2K' | '4K' = '1K', aspectRatio: string = '1:1') => {
  const model = imageSize === '1K' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
  const ai = getAI();
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio: aspectRatio as any, imageSize },
    },
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image data");
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64ImageData, mimeType } },
        { text: prompt },
      ],
    },
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image data");
};

/**
 * توليد فيديو باستخدام نموذج Veo
 */
export const generateVideo = async (prompt: string, base64Image?: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    ...(base64Image && {
      image: {
        imageBytes: base64Image,
        mimeType: 'image/png',
      }
    }),
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio,
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

export const encode = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

export const createPcmBlob = (data: Float32Array): Blob => {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
};

export const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

export const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
};
