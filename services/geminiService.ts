
import { GoogleGenAI, Type, Blob, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { UserProfile, AnalysisResult, MealPlan, MedicalRecordKind } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * محرك الفرز والتحليل المعمق: يستخدم Gemini 3 Pro لتحليل الصور والمستندات بدقة عالية
 */
export const autoSortMedicalFile = async (base64Data: string, mimeType: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: `أنت خبير مختبرات طبي رفيع المستوى. حلل هذه الصورة/الملف الطبي بعناية فائقة:
        1. استخرج كافة النتائج المخبرية بدقة (الاسم، القيمة، الوحدة، المجال الطبيعي).
        2. قدم شرحاً علمياً مبسطاً لكل نتيجة خارج النطاق الطبيعي.
        3. صنف الملف ضمن الفئات التالية: visits, labs, meds, hospital, costs.
        4. استخرج التواريخ، التخصصات، والمبالغ المالية المذكورة.
        
        يجب أن تكون الإجابة بصيغة JSON حصراً وتفصيلية جداً في خانة recommendations.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          title: { type: Type.STRING },
          date: { type: Type.STRING },
          place: { type: Type.STRING },
          actualCost: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          recommendations: { type: Type.STRING, description: "Detailed medical analysis of lab results" },
          medications: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nameAr: { type: Type.STRING },
                dosage: { type: Type.STRING },
                purpose: { type: Type.STRING }
              }
            }
          }
        },
        required: ["category", "title", "recommendations"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

/**
 * وضع التفكير العميق (Thinking Mode): يستخدم للمسائل الطبية المعقدة وتداخلات الأدوية
 */
export const getDeepAnalysis = async (query: string, context?: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `سؤال معقد حول حالة الوالدة الصحية: ${query} \n السياق الإضافي: ${context || ''}`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });
  return response.text;
};

export const analyzeMedicalText = async (textContent: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: `حلل هذه البيانات الجدولية وقم بفرزها وتصنيفها طبياً: \n ${textContent}` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          medications: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nameAr: { type: Type.STRING },
                nameEn: { type: Type.STRING },
                dosage: { type: Type.STRING },
                purpose: { type: Type.STRING }
              }
            }
          },
          advice: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const analyzeMedicalDocument = async (base64Data: string, mimeType: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "حلل هذه الوثيقة الطبية باستخدام قدراتك البصرية المتقدمة واستخرج المعلومات الأساسية." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          medications: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nameAr: { type: Type.STRING },
                dosage: { type: Type.STRING },
                purpose: { type: Type.STRING }
              }
            }
          },
          advice: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const getAdvancedAdvice = async (profile: UserProfile, doctorOpinion: string, attachments: { data: string, mimeType: string }[] = []) => {
  const ai = getAI();
  const parts: any[] = [
    { text: `بناءً على تاريخ الوالدة الطبي والبيان الحالي: "${doctorOpinion}". قدم تحليلاً طبياً مع استخدام البحث في جوجل.` }
  ];

  attachments.forEach(att => {
    parts.push({ inlineData: { data: att.data, mimeType: att.mimeType } });
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { 
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 16000 }
    },
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'مصدر طبي',
    uri: chunk.web?.uri
  })).filter((s: any) => s.uri) || [];

  return { text: response.text, sources };
};

export const startChat = () => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 0 } // تعطيل التفكير في الشات المباشر لسرعة الاستجابة
    },
  });
};

export const generateMealPlan = async (profile: UserProfile): Promise<MealPlan[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `صمم خطة وجبات للوالدة: ${JSON.stringify(profile)}`,
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
            snack: { type: Type.STRING },
          }
        },
      },
    },
  });
  return JSON.parse(response.text || '[]');
};

export const synthesizeSpeech = async (text: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function createPcmBlob(data: Float32Array): Blob {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
