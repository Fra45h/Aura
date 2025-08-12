
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

const InterpretVoiceCommandOutputStreamSchema = z.object({
  textTranscription: z.string().describe('The text transcription of the voice input.'),
  intentChunk: z.string().describe('A chunk of the interpreted intent of the user command.'),
  isFinal: z.boolean().describe('Whether this is the final chunk of the intent.'),
});
export type InterpretVoiceCommandOutputStream = z.infer<typeof InterpretVoiceCommandOutputStreamSchema>;


export async function interpretVoiceCommand(
  input: InterpretVoiceCommandInput,
  // Genkit's streaming helper.
  stream: (chunk: InterpretVoiceCommandOutputStream) => void
): Promise<void> {
  await interpretVoiceCommandFlow(input, stream);
}

const interpretVoiceCommandFlow = ai.defineFlow(
  {
    name: 'interpretVoiceCommandFlow',
    inputSchema: InterpretVoiceCommandInputSchema,
    outputSchema: z.void(),
    streamSchema: InterpretVoiceCommandOutputStreamSchema,
  },
  async (input, stream) => {
    const { text: textTranscription } = await speechToText({ audioDataUri: input.voiceInput });
    
    const systemPrompt = `You are J.A.R.V.I.S., the AI assistant from the Iron Man movies. Your personality is sophisticated, witty, and exceptionally helpful. You address the user as "sir."

Your task is to interpret the user's command and respond in character.

- If the command is a smart home request (e.g., "turn on the lights," "set thermostat to 72"), a request for information (e.g., "what's the weather"), or a simple task (e.g., "set a timer for 5 minutes"), formulate a concise, in-character response confirming the action or providing the information. For example: "Of course, sir. The lights are now on." or "The current weather is 75 degrees and sunny, sir."
- If the command is unclear, ambiguous, or outside your capabilities, respond politely in character, explaining the limitation or asking for clarification. For example: "My apologies, sir, but I am unable to fetch the sports scores at the moment." or "Could you please clarify that request, sir?"
- You must only output the direct response to the user. Do not add any extra fields or JSON formatting.`;


    const { stream: intentStream, response: intentResponse } = await ai.generateStream({
        model: 'googleai/gemini-2.0-flash',
        prompt: textTranscription,
        config: {
            systemPrompt: systemPrompt,
        }
    });
    
    let fullIntent = '';
    for await (const chunk of intentStream) {
        fullIntent += chunk.text;
        stream({
            textTranscription,
            intentChunk: fullIntent,
            isFinal: false,
        });
    }

    const finalResponse = await intentResponse;
    const finalOutput = finalResponse.text;

    stream({
      textTranscription,
      intentChunk: finalOutput!,
      isFinal: true,
    });
  }
);
