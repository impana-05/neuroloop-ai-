import React, { useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { MessageSquare, Volume2, Loader2, X, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const EXPLANATION_TEXT = `Hi there! I'm your NeuroLoop AI guide. 

NeuroLoop is an intelligent learning platform designed to help you master any subject faster. 

Here's how it works:
First, go to 'Upload & Learn' to add your study materials, like PDFs. 
Our AI then synchronizes that content into 'conceptual nodes' - think of these as the building blocks of the subject.
In 'My Content', you can start interactive 'Learning Loops' which are adaptive quizzes that focus on your cognitive gaps.
Finally, check your 'Analytics' to see your knowledge grow in real-time.

Ready to start your neural journey?`;

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const speak = async () => {
    if (isSpeaking || isLoading) return;
    
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say clearly and naturally: ${EXPLANATION_TEXT}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is a warm, helpful voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        await playPcmAudio(base64Audio);
      }
    } catch (error) {
      console.error("Assistant Speech Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playPcmAudio = async (base64Data: string) => {
    setIsSpeaking(true);
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Gemini returns 16-bit PCM Mono at 24000Hz
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const float32Data = new Float32Array(bytes.length / 2);
      const int16Data = new Int16Array(bytes.buffer);

      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768;
      }

      const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
      };

      source.start();
    } catch (err) {
      console.error("Audio Playback Error:", err);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 glass-panel p-6 shadow-2xl border-accent/20 relative mb-2"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-accent" />
              </div>
              <p className="font-bold text-sm">Neural Assistant</p>
            </div>
            
            <p className="text-sm text-text-muted leading-relaxed mb-6 whitespace-pre-wrap">
              {EXPLANATION_TEXT}
            </p>
            
            <button
              onClick={speak}
              disabled={isLoading || isSpeaking}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSpeaking ? (
                <div className="flex gap-1 items-end h-4">
                  <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                  <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1 bg-white rounded-full" />
                  <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-1 bg-white rounded-full" />
                </div>
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              {isLoading ? "Synthesizing..." : isSpeaking ? "Speaking..." : "Listen to Guide"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-accent text-white rounded-2xl shadow-xl shadow-accent/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
