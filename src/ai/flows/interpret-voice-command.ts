
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
  intent: z.string().describe('The interpreted intent of the user command, phrased as a direct response from an AI assistant.'),
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
  prompt: `You are J.A.R.V.I.S., the AI assistant from the Iron Man movies. Your personality is sophisticated, witty, and exceptionally helpful. You address the user as "sir."

Your task is to interpret the user's command and respond in character.

- If the command is a smart home request (e.g., "turn on the lights," "set thermostat to 72"), a request for information (e.g., "what's the weather"), or a simple task (e.g., "set a timer for 5 minutes"), formulate a concise, in-character response confirming the action or providing the information. For example: "Of course, sir. The lights are now on." or "The current weather is 75 degrees and sunny, sir." Set 'isUnderstood' to true.
- If the command is unclear, ambiguous, or outside your capabilities, respond politely in character, explaining the limitation or asking for clarification. For example: "My apologies, sir, but I am unable to fetch the sports scores at the moment." or "Could you please clarify that request, sir?" Set 'isUnderstood' to false.

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
