"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, LoaderCircle, Mic, User, X, Sparkles } from 'lucide-react';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { interpretVoiceCommand } from '@/ai/flows/interpret-voice-command';
import { generateVoiceResponse } from '@/ai/flows/generate-voice-response';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
        
        const initialUserMessage = { speaker: 'user' as const, text: "Listening..." };
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
      setMessages(prev => [...prev, { speaker: 'assistant', text: "Sorry, I couldn't process that." }]);
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
    <div className="flex flex-col w-full max-w-2xl h-[80vh] bg-background rounded-2xl shadow-2xl border border-primary/20">
      <header className="flex items-center justify-between p-4 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full border border-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-headline font-bold text-foreground">Aura</h1>
        </div>
      </header>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground pt-16 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-2 text-lg">Good day. How may I be of assistance?</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={cn("flex items-start gap-4", message.speaker === 'user' ? 'justify-end' : 'justify-start')}>
              {message.speaker === 'assistant' && (
                <div className="p-2.5 rounded-full bg-secondary text-primary">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              <div className={cn(
                "max-w-sm md:max-w-md p-4 rounded-xl",
                message.speaker === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none'
              )}>
                <p className="leading-relaxed">{message.text}</p>
              </div>
              {message.speaker === 'user' && (
                <div className="p-2.5 rounded-full bg-secondary text-secondary-foreground">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          {isProcessing && status !== 'recording' && (
             <div className="flex items-start gap-3 justify-start">
                <div className="p-2.5 rounded-full bg-secondary text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="p-4 rounded-xl bg-secondary flex items-center gap-2">
                   <LoaderCircle className="h-4 w-4 animate-spin"/>
                   <span>Thinking...</span>
                </div>
             </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 flex flex-col items-center justify-center border-t border-primary/20">
        <Button
          onClick={toggleRecording}
          disabled={isProcessing && status !== 'recording'}
          size="lg"
          className={cn(
            "rounded-full w-20 h-20 transition-all duration-300 ease-in-out shadow-lg",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            status === 'recording' && "bg-destructive hover:bg-destructive/90 animate-pulse-glow",
            "disabled:bg-primary/50"
          )}
          aria-label={status === 'recording' ? 'Stop recording' : 'Start recording'}
        >
          {isProcessing && status !== 'recording' ? (
            <LoaderCircle className="h-8 w-8 animate-spin" />
          ) : status === 'recording' ? (
            <div className="w-8 h-8 bg-background rounded-md" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          {status === 'recording' ? 'Recording... press to stop.' : isProcessing ? 'Processing your request...' : 'Press the button and speak.'}
        </p>
      </footer>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
