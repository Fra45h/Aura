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
  prompt: `Interpret the intent of the following user command. If the command is within the scope of controlling a voice assistant (e.g., "what's the weather", "tell me a joke", "set a timer"), determine the intent and set isUnderstood to true. If the command is a general question or outside the scope, respond that it is out of scope and set isUnderstood to false:

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
