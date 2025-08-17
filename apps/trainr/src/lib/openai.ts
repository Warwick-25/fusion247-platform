// apps/trainr/src/lib/openai.ts
import OpenAI from "openai";

// IMPORTANT: Never import this from client components.
// This file must only be used in server routes or server actions.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple guard so we fail fast if the key is missing on the server
export function assertOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY. Add it to .env.local and Vercel.");
  }
}
