

import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT, TEXT_MODEL_NAME } from '../constants';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable is not set. The application may not function correctly and will likely fail API calls.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const initializeChat = (): Chat => {
  try {
    const chat = ai.chats.create({
      model: TEXT_MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });
    return chat;
  } catch (error) {
    console.error("Error initializing chat:", error);
    throw error; 
  }
};

export const sendMessageToDM = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
  try {
    const result = await chat.sendMessage({ message });
    return result;
  } catch (error) {
    console.error("Error sending message to DM:", error);
    throw error;
  }
};

// Removed generateVideoSummary function
