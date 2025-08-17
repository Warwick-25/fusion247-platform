// apps/trainr/lib/openai.ts

import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const assertOpenAIKey = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API key.");
  }
};
