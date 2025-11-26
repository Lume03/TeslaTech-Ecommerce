import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { Genkit } from 'genkit';
import { EventEmitter } from 'events';

// Increase the max listeners to prevent warnings in serverless environments
// where initialization might occur multiple times across instances.
EventEmitter.defaultMaxListeners = 20;


let aiInstance: Genkit | null = null;

// Use a singleton pattern to ensure Genkit is only initialized once per server instance.
// This prevents the "MaxListenersExceededWarning" in serverless environments.
function getAiInstance(): Genkit {
  if (!aiInstance) {
    aiInstance = genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.5-flash',
    });
  }
  return aiInstance;
}

export const ai = getAiInstance();
