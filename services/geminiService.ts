
import { GoogleGenAI, Type, Blob } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { MealPlan, UserProfile } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * تحليل المستندات الطبية باستخدام Gemini 3 Pro مع Thinking Mode
 * يستخدم لتحليل التقارير الفردية ومقارنتها بتوصيات الأطباء
 */
export const analyzeMedicalDocument = async (base64: string, mimeType: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64, mimeType } },
        { text: `أنت خبير طبي متخصص. حلل هذا المستند بدقة. 
        إذا كان تقريراً مخبرياً: استخرج النتائج والقيم غير الطبيعية وقارنها بالمرجع. 
        إذا كان دواءً: استخرج الاسم العلمي والتجاري والجرعة والغرض.
        يجب أن تكون الإجابة بتنسيق JSON حصراً.` }
      ]
    },
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "labs, meds, visits, hospital, er" },
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          actualCost: { type: Type.NUMBER },
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

/**
 * تحليل المجلد (ملفات متعددة) وتصنيفها آلياً
 */
export const analyzeBulkFiles = async (files: { base64: string, mimeType: string }[]) => {
  const ai = getAI();
  const parts = files.map(f => ({ inlineData: { data: f.base64, mimeType: f.mimeType } }));
  parts.push({ text: "قم بفحص هذه الملفات الطبية جميعاً. صنف كل ملف (دواء، مختبر، زيارة، فاتورة) واستخرج البيانات الأساسية لكل منها. أرجع قائمة JSON." } as any);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: parts as any },
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            title: { type: Type.STRING },
            cost: { type: Type.NUMBER },
            summary: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const startChat = (useThinking = true) => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: useThinking ? { thinkingBudget: 32768 } : undefined
    },
  });
};

export const generateMealPlan = async (profile: UserProfile): Promise<MealPlan[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `صمم برنامج وجبات صحي لمدة 7 أيام لـ ${profile.name}. الأهداف: ${profile.goals.join(', ')}. القيود: ${profile.dietaryRestrictions.join(', ')}. JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            breakfast: { type: Type.STRING },
            lunch: { type: Type.STRING },
            dinner: { type: Type.STRING },
            snack: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const encode = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
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

export const createPcmBlob = (data: Float32Array): Blob => {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
};
