
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, X, Loader2 } from 'lucide-react';
import { cn } from './UI';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null); // To store session promise/object

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startSession();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
        // There is no explicit .close() on the session promise itself easily accessible 
        // without storing the resolved session, but the connection closes when context/sockets drop usually.
        // Ideally we would call session.close() if we had the object.
        sessionRef.current = null; 
    }
    setStatus('connecting');
    setVolume(0);
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 }); // Output rate
      audioContextRef.current = audioCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      // Input Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: "You are 'Nova', a witty and energetic AI quiz master assistant. You help users generate quizzes and learn facts. Keep responses concise and fun.",
        },
        callbacks: {
          onopen: () => {
            console.log('Voice Session Opened');
            setStatus('connected');
            
            // Start processing input audio
            const inputCtx = new AudioContextClass({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));

              // PCM conversion for API
              const pcmData = createPcmData(inputData);
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: "audio/pcm;rate=16000",
                    data: base64Data
                  }
                });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
            
            sourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            const serverContent = msg.serverContent;
            
            if (serverContent?.modelTurn?.parts?.[0]?.inlineData) {
              const audioData = serverContent.modelTurn.parts[0].inlineData.data;
              if (audioData) {
                playAudioChunk(audioData, audioCtx);
              }
            }
          },
          onclose: () => {
            console.log('Session closed');
            setStatus('error'); // Or reset
          },
          onerror: (err) => {
            console.error(err);
            setStatus('error');
          }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to start voice session", e);
      setStatus('error');
    }
  };

  const createPcmData = (inputData: Float32Array) => {
    const pcmData = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
        // Clamp and scale
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcmData;
  };

  const playAudioChunk = async (base64Audio: string, ctx: AudioContext) => {
    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }
      
      const buffer = ctx.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      const now = ctx.currentTime;
      // Ensure we schedule after the current queue or immediately if queue is empty
      const startTime = Math.max(now, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;
      
    } catch (e) {
      console.error("Error decoding audio", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-fade-in-up">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-fuchsia-500/30 rounded-full p-2 shadow-[0_0_30px_rgba(217,70,239,0.2)] flex items-center gap-4 pr-6 pl-2 h-16 relative overflow-hidden">
         {/* Visualizer Background */}
         <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center gap-1">
             {[1,2,3,4,5].map(i => (
                 <div 
                    key={i} 
                    className="w-2 bg-fuchsia-500 rounded-full transition-all duration-75"
                    style={{ 
                        height: status === 'connected' ? `${20 + volume * 200 * Math.random()}%` : '10%'
                    }}
                 />
             ))}
         </div>

         {/* Close Button */}
         <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10"
         >
            <X className="w-5 h-5" />
         </button>

         {/* Status Icon */}
         <div className={cn(
             "w-12 h-12 rounded-full flex items-center justify-center relative z-10",
             status === 'connected' ? "bg-gradient-to-tr from-fuchsia-600 to-cyan-600 shadow-lg animate-pulse" : "bg-slate-800"
         )}>
             {status === 'connecting' && <Loader2 className="w-6 h-6 text-white animate-spin" />}
             {status === 'connected' && <Mic className="w-6 h-6 text-white" />}
             {status === 'error' && <X className="w-6 h-6 text-red-500" />}
         </div>

         {/* Text Status */}
         <div className="flex flex-col z-10">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Voice Assistant</span>
             <span className="text-sm font-medium text-white">
                 {status === 'connecting' && "Connecting..."}
                 {status === 'connected' && (volume > 0.05 ? "Listening..." : "Nova is ready")}
                 {status === 'error' && "Connection Failed"}
             </span>
         </div>
      </div>
    </div>
  );
};
