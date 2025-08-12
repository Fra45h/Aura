import { VoiceAssistant } from '@/components/voice-assistant';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 bg-grid-primary/10 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <VoiceAssistant />
      </div>
    </main>
  );
}
