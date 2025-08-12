
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, LoaderCircle, Mic, User } from 'lucide-react';
import { useMediaRecorder } from '@/hooks/use-media-recorder';
import { interpretVoiceCommand } from '@/ai/flows/interpret-voice-command';
import { generateVoiceResponse } from '@/ai/flows/generate-voice-response';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {runFlow} from '@genkit-ai/next/client';

type Message = {
  id: number;
  speaker: 'user' | 'assistant';
  text: string;
};

export function VoiceAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  let messageIdCounter = 0;

  const handleAudioPlayback = (audioDataUri: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioDataUri;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  };

  const onRecordingComplete = useCallback(async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        const userMessageId = messageIdCounter++;
        const assistantMessageId = messageIdCounter++;
        
        const initialUserMessage = { id: userMessageId, speaker: 'user' as const, text: "Processing audio..." };
        setMessages(prev => [...prev, initialUserMessage]);

        let userMessageUpdated = false;

        await runFlow(interpretVoiceCommand, { voiceInput: base64Audio }, async ({ textTranscription, intentChunk, isFinal }) => {
          if (!userMessageUpdated) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === userMessageId ? { ...msg, text: textTranscription } : msg
              )
            );
            userMessageUpdated = true;
            // Add the initial assistant message bubble
            setMessages(prev => [...prev, { id: assistantMessageId, speaker: 'assistant', text: '' }]);
          }

          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId ? { ...msg, text: intentChunk } : msg
            )
          );
          
          if (isFinal) {
            const { audioDataUri } = await generateVoiceResponse({ text: intentChunk });
            handleAudioPlayback(audioDataUri);
            setIsProcessing(false);
          }
        });
      };
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to process voice command.",
      });
      setMessages(prev => [...prev, { id: messageIdCounter++, speaker: 'assistant', text: "Apologies, sir. I seem to be experiencing a technical difficulty." }]);
      setIsProcessing(false);
    }
  }, [toast, messageIdCounter]);


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
    <div className="flex flex-col w-full max-w-4xl h-[90vh] bg-background/80 backdrop-blur-sm rounded-2xl shadow-2xl border-primary/20 overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-primary/20 shrink-0 bg-background/50">
            <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full border border-primary/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary"><path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-18.19 40a28 28 0 1 1-33.62 33.62A28 28 0 0 1 109.81 64m-41 120.7a28 28 0 1 1 33.62-33.62a28 28 0 0 1-33.62 33.62m82.38 0a28 28 0 1 1 33.62-33.62a28 28 0 0 1-33.62 33.62m-8.58-64.7a28 28 0 1 1-33.62-33.62a28 28 0 0 1 33.62 33.62m58.19-22.4a28 28 0 1 1 0 39.6a28 28 0 0 1 0-39.6"/></svg>
            </div>
            <h1 className="text-2xl font-headline font-bold text-primary tracking-widest">AURA</h1>
            </div>
        </header>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-8">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground pt-12 flex flex-col items-center gap-6">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping-slow"></div>
                <div className="absolute inset-4 rounded-full border-2 border-dashed border-primary/30 animate-spin-slow"></div>
                <div className="absolute inset-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-16 w-16 text-primary/80"><path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-18.19 40a28 28 0 1 1-33.62 33.62A28 28 0 0 1 109.81 64m-41 120.7a28 28 0 1 1 33.62-33.62a28 28 0 0 1-33.62 33.62m82.38 0a28 28 0 1 1 33.62-33.62a28 28 0 0 1-33.62 33.62m-8.58-64.7a28 28 0 1 1-33.62-33.62a28 28 0 0 1 33.62 33.62m58.19-22.4a28 28 0 1 1 0 39.6a28 28 0 0 1 0-39.6"/></svg>
                </div>
              </div>
              <p className="mt-2 text-xl font-headline text-primary">Awaiting your command.</p>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={cn("flex items-start gap-4", message.speaker === 'user' ? 'justify-end' : 'justify-start')}>
              {message.speaker === 'assistant' && (
                <div className="p-2.5 rounded-full bg-primary/20 text-primary border border-primary/30 shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              <div className={cn(
                "max-w-md lg:max-w-lg p-4 rounded-xl border",
                message.speaker === 'user'
                  ? 'bg-secondary/50 border-border text-foreground'
                  : 'bg-primary/10 border-primary/20 text-primary-foreground'
              )}>
                <p className="leading-relaxed font-body">{message.text || '...'}</p>
              </div>
              {message.speaker === 'user' && (
                <div className="p-2.5 rounded-full bg-secondary text-secondary-foreground border border-border shrink-0">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          {isProcessing && status !== 'recording' && messages[messages.length-1]?.speaker !== 'assistant' &&(
             <div className="flex items-start gap-4 justify-start">
                <div className="p-2.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="p-4 rounded-xl bg-primary/10 border-primary/20 text-primary-foreground flex items-center gap-3">
                   <LoaderCircle className="h-5 w-5 animate-spin"/>
                   <span className="font-body">Thinking...</span>
                </div>
             </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-6 flex flex-col items-center justify-center border-t border-primary/20 shrink-0 bg-transparent min-h-[220px]">
        <button
          onClick={toggleRecording}
          disabled={isProcessing && status !== 'recording'}
          className="relative w-32 h-32 flex items-center justify-center"
          aria-label={status === 'recording' ? 'Stop recording' : 'Start recording'}
        >
          <div className={cn(
            "absolute inset-0 rounded-full transition-all duration-300",
            status === 'recording' ? 'bg-accent/50 animate-pulse' : 'bg-primary/30',
            isProcessing && status !== 'recording' ? "" : ""
          )}></div>
          <div className={cn(
            "absolute inset-2 rounded-full bg-background transition-all duration-300",
             isProcessing && status !== 'recording' ? "bg-background/90" : ""
          )}></div>
          <div className={cn(
            "absolute inset-0 rounded-full border-4 border-primary/50 glow transition-all duration-300",
            status === 'recording' ? 'border-accent' : '',
            isProcessing && status !== 'recording' ? "border-dashed border-primary/80 animate-spin-slow" : ""
          )}></div>
           <div className="relative z-10 text-primary">
            {isProcessing && status !== 'recording' ? (
              <LoaderCircle className="h-12 w-12" />
            ) : status === 'recording' ? (
              <Mic className="h-12 w-12 text-accent" />
            ) : (
              <Mic className="h-12 w-12" />
            )}
           </div>
        </button>
        <p className="text-sm text-muted-foreground mt-6 font-mono h-5">
          {status === 'recording' ? 'Recording...' : isProcessing ? 'Processing...' : messages.length > 0 ? '' : 'Ready for command, sir.'}
        </p>
      </footer>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
