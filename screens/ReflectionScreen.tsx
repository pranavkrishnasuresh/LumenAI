
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Book } from '../types';

interface Props {
  book: Book;
  onEnd: () => void;
}

type InteractionState = 'IDLE' | 'LISTENING' | 'SPEAKING';

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
  const [interactionState, setInteractionState] = useState<InteractionState>('IDLE');
  const [statusText, setStatusText] = useState<string>("Ready to start");
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
  const timerRef = useRef<any>(null);
  
  // Refs for turn-taking state management (avoiding stale closures in onaudioprocess)
  const stateRef = useRef<InteractionState>('IDLE');
  const playingChunksRef = useRef(0);
  const isTurnCompleteRef = useRef(false);

  const updateState = (newState: InteractionState) => {
    stateRef.current = newState;
    setInteractionState(newState);
  };

  const checkTurnEnd = () => {
    // Transition back to listening ONLY when model has finished sending and audio has finished playing
    if (isTurnCompleteRef.current && playingChunksRef.current === 0) {
      updateState('LISTENING');
      setStatusText("Listening...");
      isTurnCompleteRef.current = false;
    }
  };

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
    
    updateState('IDLE');
    setTimerActive(false);
    setStatusText("Session Ended");
  };

  useEffect(() => {
    if (interactionState === 'LISTENING' && transcription.length > 0 && !timerActive) {
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
  }, [interactionState, transcription, timerActive]);

  const startSession = async () => {
    try {
      setStatusText("Connecting...");
      updateState('IDLE');
      setTimeLeft(30);
      setTimerActive(false);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputAudioContext;
      outputContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const systemInstruction = `You are Lumen, a friendly AI reading companion. 
      The student is reading "${book.title}" Chapters 6-10.
      
      STRICT INTERACTION RULES:
      1. Be Conversational in manner, respond in a way that is conversational.
      2. Keep responses under 15 words.
      3. Do not prompt for input while you are speaking.
      4. Stay grounded in Chapters 6-10 events (Lockhart, Mandrakes, Mrs. Norris).`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            updateState('LISTENING');
            setStatusText("Listening...");
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              // STRICT TURN TAKING: Only send audio if we are in LISTENING state
              if (stateRef.current !== 'LISTENING') return;

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
            // Track transcriptions
            if (message.serverContent?.outputTranscription) {
              setAiTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
            } else if (message.serverContent?.inputTranscription) {
              setTranscription(prev => prev + message.serverContent!.inputTranscription!.text);
            }

            // Handle turn completion flag from model
            if (message.serverContent?.turnComplete) {
              isTurnCompleteRef.current = true;
              setTranscription("");
              setAiTranscription("");
              checkTurnEnd();
            }

            // Handle audio chunks
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              // Switch to SPEAKING state if we weren't already
              if (stateRef.current !== 'SPEAKING') {
                updateState('SPEAKING');
                setStatusText("Lumen Speaking...");
              }

              playingChunksRef.current++;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                playingChunksRef.current--;
                checkTurnEnd();
              };

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
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
      setStatusText("Error connecting");
      updateState('IDLE');
    }
  };

  const toggleSession = () => {
    if (interactionState !== 'IDLE') stopSession();
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
          <div className={`relative w-full bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100 transform transition-all min-h-[220px] flex flex-col justify-center ${interactionState === 'SPEAKING' ? 'ring-2 ring-primary/20' : ''}`}>
            <div className={`absolute -top-4 -left-2 rounded-xl p-2 shadow-lg transition-colors ${interactionState === 'SPEAKING' ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'}`}>
              <span className="material-symbols-outlined text-2xl">{interactionState === 'SPEAKING' ? 'volume_up' : 'chat'}</span>
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
                    {interactionState === 'IDLE' 
                      ? "Tap the microphone to start. Lumen has a question ready for you!"
                      : interactionState === 'SPEAKING' 
                        ? "Lumen is speaking..." 
                        : "Lumen is listening! According to the legend, who can control the monster in the Chamber of Secrets?"}
                  </p>
                  {interactionState === 'LISTENING' && !transcription && (
                    <p className="text-primary text-sm font-bold mt-4 animate-pulse">
                      Go ahead, I'm listening!
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
          <div className={`flex items-center justify-center h-16 w-full gap-2 transition-all duration-500 ${interactionState === 'LISTENING' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="w-1.5 bg-primary/40 rounded-full wave-bar h-4" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 bg-primary/60 rounded-full wave-bar h-8" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-1.5 bg-primary rounded-full wave-bar h-12" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-1.5 bg-primary/80 rounded-full wave-bar h-6" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 bg-primary/60 rounded-full wave-bar h-14" style={{ animationDelay: '0.4s' }}></div>
            <div className="w-1.5 bg-primary/40 rounded-full wave-bar h-8" style={{ animationDelay: '0.6s' }}></div>
          </div>

          <div className="relative group">
            {interactionState === 'LISTENING' && <div className="absolute inset-0 rounded-full bg-primary/20 pulse-ring scale-110"></div>}
            <button 
              onClick={toggleSession}
              disabled={interactionState === 'SPEAKING'}
              className={`relative z-10 flex items-center justify-center size-24 rounded-full transition-all active:scale-90 shadow-2xl ${
                interactionState === 'LISTENING' 
                  ? 'bg-red-500 shadow-red-500/40' 
                  : interactionState === 'SPEAKING'
                    ? 'bg-gray-300 shadow-none cursor-not-allowed'
                    : 'bg-primary shadow-primary/40'
              }`}
            >
              <span className="material-symbols-outlined text-5xl text-white">
                {interactionState === 'LISTENING' ? 'stop' : interactionState === 'SPEAKING' ? 'mic_off' : 'mic'}
              </span>
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <p className="text-text-primary text-sm font-bold uppercase tracking-widest">
              {timeLeft === 0 ? "Time's up!" : statusText}
            </p>
            <p className="text-text-secondary text-xs font-medium text-center max-w-[240px]">
              {interactionState === 'LISTENING' 
                ? (timeLeft === 0 ? 'Wrap up your thoughts' : 'Tap to end early') 
                : interactionState === 'SPEAKING' 
                  ? 'Microphone disabled while AI speaks' 
                  : 'Tap to start your reflection'}
            </p>
          </div>

          <div className="flex w-full items-center justify-between px-4 pt-4">
            <button className="flex items-center justify-center size-12 rounded-2xl bg-white shadow-sm border border-gray-100 text-text-secondary hover:bg-black/5">
              <span className="material-symbols-outlined">keyboard</span>
            </button>
            <div className="flex-1 text-center">
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                {interactionState === 'IDLE' ? 'STANDBY' : 'STRICT TURN-TAKING'}
               </span>
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
