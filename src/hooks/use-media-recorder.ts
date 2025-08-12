"use client";

import { useState, useRef, useCallback } from 'react';

type Status = 'idle' | 'permission_requested' | 'recording' | 'stopped' | 'error';

type UseMediaRecorderOptions = {
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
};

export function useMediaRecorder({ onStop, onError }: UseMediaRecorderOptions = {}) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const getMicrophonePermission = useCallback(async () => {
    setStatus('permission_requested');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus('idle');
      return stream;
    } catch (err) {
      const e = new Error('Microphone permission denied.');
      setError(e);
      setStatus('error');
      if (onError) onError(e);
      return null;
    }
  }, [onError]);

  const startRecording = useCallback(async () => {
    const stream = await getMicrophonePermission();
    if (!stream) return;

    setStatus('recording');
    audioChunksRef.current = [];
    
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (onStop) {
        onStop(audioBlob);
      }
      setStatus('stopped');
      // Stop all tracks to turn off the microphone indicator
      stream.getTracks().forEach(track => track.stop());
    };
    
    recorder.onerror = (event) => {
        const e = new Error(`MediaRecorder error: ${(event as any).error.name}`);
        setError(e);
        setStatus('error');
        if (onError) onError(e);
    }

    recorder.start();
  }, [getMicrophonePermission, onStop, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return { status, error, startRecording, stopRecording };
}
