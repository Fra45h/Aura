import { VoiceAssistant } from '@/components/voice-assistant';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 bg-grid-primary/10">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background"></div>
      <VoiceAssistant />
    </main>
  );
}
