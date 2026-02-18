
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { createPcmBlob, decode, decodeAudioData, encode } from '../services/geminiService';
import { SYSTEM_INSTRUCTION } from '../constants';

const VoiceCoach: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = () => {
    if (sessionRef.current) {
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setIsActive(false);
    setStatus('idle');
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      // Use process.env.API_KEY directly for GoogleGenAI initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Voice session opened');
            setStatus('listening');
            setIsActive(true);

            // Set up mic streaming
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              // Handle session using the promise to avoid stale closure issues
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
                setStatus('speaking');
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    outputAudioContextRef.current,
                    24000,
                    1
                );
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current.destination);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setStatus('listening');
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }

            // Transcriptions
            if (message.serverContent?.outputTranscription) {
                setTranscript(prev => prev + ' ' + message.serverContent?.outputTranscription?.text);
            }
          },
          onerror: (e) => {
            console.error('Session error', e);
            cleanup();
          },
          onclose: () => cleanup()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION + " You are interacting via voice. Keep responses concise.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error(err);
      cleanup();
    }
  };

  const toggleSession = () => {
    if (isActive) {
      cleanup();
    } else {
      startSession();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-center animate-fadeIn">
      <div className="space-y-4">
        <h2 className="text-3xl font-serif text-gray-800">Voice Mentor</h2>
        <p className="text-gray-500">Need a quick pep talk or have a hands-busy question? Just speak naturally.</p>
      </div>

      <div className="relative h-64 flex items-center justify-center">
        {/* Animated Background Rings */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-32 h-32 bg-[#e89b93] rounded-full opacity-20 animate-ping"></div>
             <div className="absolute w-48 h-48 bg-[#e89b93] rounded-full opacity-10 animate-pulse delay-75"></div>
          </div>
        )}
        
        <button 
          onClick={toggleSession}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
            isActive 
              ? 'bg-white text-[#e89b93] ring-4 ring-[#e89b93] ring-opacity-20' 
              : 'bg-[#e89b93] text-white hover:scale-105'
          }`}
        >
          {status === 'connecting' ? (
             <i className="fas fa-circle-notch fa-spin text-4xl"></i>
          ) : isActive ? (
            <i className="fas fa-stop text-4xl"></i>
          ) : (
            <i className="fas fa-microphone text-4xl"></i>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
          <span className={`w-2 h-2 rounded-full ${status === 'idle' ? 'bg-gray-300' : 'bg-green-500 animate-pulse'}`}></span>
          <span className="text-sm font-medium text-gray-600 uppercase tracking-widest">
            {status.toUpperCase()}
          </span>
        </div>

        {transcript && (
          <div className="bg-white p-6 rounded-3xl border border-gray-50 text-gray-600 italic text-lg leading-relaxed shadow-sm max-h-48 overflow-y-auto">
             "{transcript}"
          </div>
        )}
        
        {!isActive && (
          <div className="grid grid-cols-2 gap-4 mt-8">
             <div className="p-4 bg-white rounded-2xl border border-gray-100 text-sm text-gray-500">
               "How can I manage my stress better today?"
             </div>
             <div className="p-4 bg-white rounded-2xl border border-gray-100 text-sm text-gray-500">
               "Is it normal to feel extra tired at week 12?"
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceCoach;
