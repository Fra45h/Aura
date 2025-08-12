'use server';

/**
 * @fileOverview Converts speech to text using the Gemini API.
 *
 * - speechToText - A function that takes audio data as input and returns the transcribed text.
 * - SpeechToTextInput - The input type for the speechToText function, expects a data URI.
 * - SpeechToTextOutput - The return type for the speechToText function, which is a string.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
    text: z.string().describe('The transcribed text.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async input => {
    const {text} = await ai.generate({
      prompt: [{media: {url: input.audioDataUri}}],
      model: 'googleai/gemini-2.0-flash',
      config: {responseModalities: ['TEXT']},
    });
    return {text: text!};
  }
);
