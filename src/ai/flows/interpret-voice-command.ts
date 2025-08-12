// src/ai/flows/interpret-voice-command.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to interpret voice commands.
 *
 * - interpretVoiceCommand - A function that takes voice input and returns the interpreted intent.
 * - InterpretVoiceCommandInput - The input type for the interpretVoiceCommand function.
 * - InterpretVoiceCommandOutput - The return type for the interpretVoiceCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { speechToText } from './speech-to-text';

const InterpretVoiceCommandInputSchema = z.object({
  voiceInput: z
    .string()
    .describe(
      'The voice input from the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // data URI
    ),
});
export type InterpretVoiceCommandInput = z.infer<typeof InterpretVoiceCommandInputSchema>;

const InterpretVoiceCommandOutputSchema = z.object({
  textTranscription: z.string().describe('The text transcription of the voice input.'),
  intent: z.string().describe('The interpreted intent of the user command.'),
  isUnderstood: z.boolean().describe('Whether the assistant understood the command or not.'),
});
export type InterpretVoiceCommandOutput = z.infer<typeof InterpretVoiceCommandOutputSchema>;

export async function interpretVoiceCommand(input: InterpretVoiceCommandInput): Promise<InterpretVoiceCommandOutput> {
  return interpretVoiceCommandFlow(input);
}

const interpretIntentPrompt = ai.definePrompt({
  name: 'interpretIntentPrompt',
  input: {schema: z.object({textTranscription: z.string()})},
  output: {schema: z.object({intent: z.string(), isUnderstood: z.boolean()})},
  prompt: `You are Aura, a sophisticated AI assistant inspired by Jarvis from Iron Man. Your personality is helpful, insightful, and you have a touch of wit. You are not just a command processor; you anticipate needs and provide context-aware assistance.

Interpret the user's command below. Your primary functions are controlling smart home devices, managing schedules, playing media, and providing information from the web.

- If the command is within your scope (e.g., "turn on the lights," "what's the weather," "play some jazz," "set a timer for 10 minutes"), determine the user's intent and formulate a concise, helpful response. Set 'isUnderstood' to true.
- If the command is a general question you can answer, provide the information. Set 'isUnderstood' to true.
- If the command is outside your capabilities or too vague, politely state that you cannot perform the request and, if possible, explain why or ask for clarification. Set 'isUnderstood' to false.

User Command: {{{textTranscription}}}`,
});

const interpretVoiceCommandFlow = ai.defineFlow(
  {
    name: 'interpretVoiceCommandFlow',
    inputSchema: InterpretVoiceCommandInputSchema,
    outputSchema: InterpretVoiceCommandOutputSchema,
  },
  async input => {
    const { text: textTranscription } = await speechToText({ audioDataUri: input.voiceInput });
    
    const intentResult = await interpretIntentPrompt({ textTranscription });

    return {
      textTranscription: textTranscription,
      intent: intentResult.output!.intent,
      isUnderstood: intentResult.output!.isUnderstood,
    };
  }
);
