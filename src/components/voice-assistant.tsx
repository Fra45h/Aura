
"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, LoaderCircle, Mic, User, X, Sparkles, BrainCircuit } from 'lucide-react';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { interpretVoiceCommand } from '@/ai/flows/interpret-voice-command';
import { generateVoiceResponse } from '@/ai/flows/generate-voice-response';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Message = {
  speaker: 'user' | 'assistant';
  text: string;
};

export function VoiceAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleAudioPlayback = (audioDataUri: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioDataUri;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  };

  const onRecordingComplete = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        const initialUserMessage = { speaker: 'user' as const, text: "Processing audio..." };
        setMessages(prev => [...prev, initialUserMessage]);

        const { textTranscription, intent, isUnderstood } = await interpretVoiceCommand({ voiceInput: base64Audio });

        setMessages(prev => prev.map(msg => msg === initialUserMessage ? { ...msg, text: textTranscription } : msg));

        const assistantMessage = { speaker: 'assistant' as const, text: intent };
        setMessages(prev => [...prev, assistantMessage]);

        if (isUnderstood) {
          const { audioDataUri } = await generateVoiceResponse({ text: intent });
          handleAudioPlayback(audioDataUri);
        }
      };
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to process voice command.",
      });
      setMessages(prev => [...prev, { speaker: 'assistant', text: "Apologies, sir. I seem to be experiencing a technical difficulty." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const { status, startRecording, stopRecording } = useMediaRecorder({
    onStop: onRecordingComplete,
    onError: (error) => {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: error.message,
      });
    }
  });


  const toggleRecording = () => {
    if (status === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl h-[90vh] bg-background/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-primary/20 overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b border-primary/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full border border-primary/20">
            <BrainCircuit className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-primary tracking-widest">J.A.R.V.I.S.</h1>
        </div>
      </header>
      
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-8">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground pt-24 flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>
                 <BrainCircuit className="h-12 w-12 text-primary z-10" />
              </div>
              <p className="mt-2 text-xl font-headline">At your service, sir.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={cn("flex items-start gap-4", message.speaker === 'user' ? 'justify-end' : 'justify-start')}>
              {message.speaker === 'assistant' && (
                <div className="p-2.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              <div className={cn(
                "max-w-md lg:max-w-lg p-4 rounded-xl border",
                message.speaker === 'user' 
                  ? 'bg-secondary/50 border-border text-foreground' 
                  : 'bg-primary/10 border-primary/20 text-primary-foreground'
              )}>
                <p className="leading-relaxed font-mono">{message.text}</p>
              </div>
              {message.speaker === 'user' && (
                <div className="p-2.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          {isProcessing && status !== 'recording' && (
             <div className="flex items-start gap-4 justify-start">
                <div className="p-2.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="p-4 rounded-xl bg-primary/10 border-primary/20 text-primary-foreground flex items-center gap-3">
                   <LoaderCircle className="h-5 w-5 animate-spin"/>
                   <span className="font-mono">Thinking...</span>
                </div>
             </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-6 flex flex-col items-center justify-center border-t border-primary/20 shrink-0 bg-background/50">
        <button
          onClick={toggleRecording}
          disabled={isProcessing && status !== 'recording'}
          className={cn(
            "relative rounded-full w-24 h-24 transition-all duration-300 ease-in-out border-2",
            "bg-primary/10 border-primary/50 text-primary",
            "hover:bg-primary/20 hover:border-primary",
            status === 'recording' && "bg-destructive/20 border-destructive text-destructive animate-pulse",
            "disabled:bg-muted disabled:border-border disabled:text-muted-foreground"
          )}
          aria-label={status === 'recording' ? 'Stop recording' : 'Start recording'}
        >
          <div className={cn(
            "absolute inset-0 rounded-full bg-primary/20",
            status === 'recording' ? 'animate-ping-slow opacity-50' : 'opacity-0'
          )}></div>
           <div className="relative z-10 flex items-center justify-center w-full h-full">
            {isProcessing && status !== 'recording' ? (
              <LoaderCircle className="h-10 w-10 animate-spin" />
            ) : status === 'recording' ? (
              <div className="w-8 h-8 bg-destructive rounded-md" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
           </div>
        </button>
        <p className="text-sm text-muted-foreground mt-4 font-mono">
          {status === 'recording' ? 'Recording...' : isProcessing ? 'Processing...' : 'Ready for command, sir.'}
        </p>
      </footer>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

