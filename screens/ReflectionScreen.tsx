
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Book } from '../types';

interface Props {
  book: Book;
  onEnd: () => void;
}

// Audio Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ReflectionScreen: React.FC<Props> = ({ book, onEnd }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>("Ready to start");
  const [transcription, setTranscription] = useState("");
  const [aiTranscription, setAiTranscription] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  // Fix: Use any or a browser-safe type instead of NodeJS.Timeout to avoid namespace errors in some environments
  const timerRef = useRef<any>(null);

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }
    for (const source of sourcesRef.current) {
      source.stop();
    }
    sourcesRef.current.clear();
    if (timerRef.current) clearInterval(timerRef.current);
    
    setIsActive(false);
    setTimerActive(false);
    setStatus("Session Ended");
  };

  // Start timer when user starts talking
  useEffect(() => {
    if (isActive && transcription.length > 0 && !timerActive) {
      setTimerActive(true);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isActive, transcription, timerActive]);

  const startSession = async () => {
    try {
      setStatus("Connecting...");
      setIsActive(true);
      setTimeLeft(30);
      setTimerActive(false);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputAudioContext;
      outputContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const systemInstruction = `You are Lumen, a friendly AI reading companion. Make sure you finish asking your question before stopping because you heard background noise or anything else, don't get distracted.
      The student is reading "${book.title}" Chapters 6-10.
      
      CRITICAL RULES:
      1. START IMMEDIATELY by asking this exact question: "How does Gilderoy Lockhart’s behavior in his lesson differ from what we were led to expect earlier?"
      2. BE BRIEF. Keep every response under 15 words. 
      3. Focus on Chapters 6-10 (Lockhart, Mandrakes, the mysterious voice Harry hears, and the discovery of Mrs. Norris).
      4. Only ask ONE question at a time.
      5. Stay encouraging and warm and don't be on topic, be specific, grounded to the events in the chapters 6-10 of harry potter and chamber of secrets, don't add fluff.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus("Listening...");
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setAiTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
            } else if (message.serverContent?.inputTranscription) {
              setTranscription(prev => prev + message.serverContent!.inputTranscription!.text);
            }

            if (message.serverContent?.turnComplete) {
              setTranscription("");
              setAiTranscription("");
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus("Lumen Speaking...");
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus("Listening...");
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current) s.stop();
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => {
            console.error(e);
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus("Error connecting");
      setIsActive(false);
    }
  };

  const toggleSession = () => {
    if (isActive) stopSession();
    else startSession();
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="flex flex-col h-full bg-background-light">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pb-2 z-10">
        <button onClick={onEnd} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 text-text-secondary">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm uppercase tracking-wider font-bold text-text-secondary">Reflection Session</h2>
        </div>
        <button 
          onClick={onEnd}
          className="flex h-10 px-4 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
        >
          <p className="text-xs font-bold uppercase">End</p>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-between px-6 pb-8 pt-4">
        {/* Context & Progress */}
        <div className="w-full space-y-4 text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-white shadow-sm border border-gray-100">
            <span className="material-symbols-outlined text-primary text-xl mr-2" style={{fontVariationSettings: "'FILL' 1"}}>book_2</span>
            <div className="flex flex-col items-start">
               <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Chapters 6-10</span>
               <span className="text-sm font-bold text-text-primary leading-none">{book.title}</span>
            </div>
          </div>
          
          {/* Timer Visual */}
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="h-1.5 w-full max-w-[120px] bg-gray-200 rounded-full overflow-hidden">
               <div 
                className={`h-full transition-all duration-1000 ${timeLeft < 10 ? 'bg-red-500' : 'bg-primary'}`} 
                style={{ width: `${(timeLeft / 30) * 100}%` }}
               />
            </div>
            <span className={`text-xs font-black tabular-nums ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-text-secondary'}`}>
              00:{timeLeft.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Conversation Display */}
        <div className="flex-1 flex flex-col items-center justify-center w-full my-6">
          <div className="relative w-full bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100 transform transition-all min-h-[220px] flex flex-col justify-center">
            <div className="absolute -top-4 -left-2 bg-primary text-white rounded-xl p-2 shadow-lg">
              <span className="material-symbols-outlined text-2xl">chat</span>
            </div>
            
            <div className="space-y-4">
              {aiTranscription ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">Lumen AI</p>
                  <p className="text-text-primary text-xl font-bold leading-tight tracking-tight">{aiTranscription}</p>
                </div>
              ) : (
                <div className="text-center">
                   <p className="text-text-secondary text-base font-medium leading-relaxed italic">
                    {isActive ? "Lumen is ready to hear your thoughts..." : "Tap the microphone to start. Lumen has a question ready for you!"}
                  </p>
                  {status === "Listening..." && !aiTranscription && (
                    <p className="text-primary text-sm font-bold mt-4 animate-pulse">
                      "What did you think of Lockhart's first lesson?"
                    </p>
                  )}
                </div>
              )}

              {transcription && (
                <div className="pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-bottom-1">
                  <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">You</p>
                  <p className="text-text-secondary text-sm italic">"{transcription}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interaction Zone */}
        <div className="w-full flex flex-col items-center justify-end gap-6 mb-4">
          <div className={`flex items-center justify-center h-16 w-full gap-2 transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="w-1.5 bg-primary/40 rounded-full wave-bar h-4" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 bg-primary/60 rounded-full wave-bar h-8" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-1.5 bg-primary rounded-full wave-bar h-12" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-1.5 bg-primary/80 rounded-full wave-bar h-6" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 bg-primary/60 rounded-full wave-bar h-14" style={{ animationDelay: '0.4s' }}></div>
            <div className="w-1.5 bg-primary/40 rounded-full wave-bar h-8" style={{ animationDelay: '0.6s' }}></div>
          </div>

          <div className="relative group">
            {isActive && <div className="absolute inset-0 rounded-full bg-primary/20 pulse-ring scale-110"></div>}
            <button 
              onClick={toggleSession}
              className={`relative z-10 flex items-center justify-center size-24 rounded-full transition-all active:scale-90 shadow-2xl ${
                isActive ? 'bg-red-500 shadow-red-500/40' : 'bg-primary shadow-primary/40'
              }`}
            >
              <span className="material-symbols-outlined text-5xl text-white">
                {isActive ? 'stop' : 'mic'}
              </span>
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <p className="text-text-primary text-sm font-bold uppercase tracking-widest">
              {timeLeft === 0 ? "Time's up!" : status}
            </p>
            <p className="text-text-secondary text-xs font-medium">
              {isActive ? (timeLeft === 0 ? 'Wrap up your thoughts' : 'Tap to end early') : 'Tap to speak with Lumen'}
            </p>
          </div>

          <div className="flex w-full items-center justify-between px-4 pt-4">
            <button className="flex items-center justify-center size-12 rounded-2xl bg-white shadow-sm border border-gray-100 text-text-secondary hover:bg-black/5">
              <span className="material-symbols-outlined">keyboard</span>
            </button>
            <div className="flex-1 text-center">
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{isActive ? 'LIVE REFLECTION' : 'STANDBY'}</span>
            </div>
            <button className="flex items-center justify-center size-12 rounded-2xl bg-white shadow-sm border border-gray-100 text-text-secondary hover:bg-black/5">
              <span className="material-symbols-outlined">settings_voice</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReflectionScreen;
