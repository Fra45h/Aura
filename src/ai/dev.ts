import { config } from 'dotenv';
config();

import '@/ai/flows/interpret-voice-command.ts';
import '@/ai/flows/speech-to-text.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/generate-voice-response.ts';