
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Function to set a new OpenAI API key in Supabase Edge Function Secrets
export const setOpenAIApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke("set-openai-key", {
      body: { apiKey }
    });

    if (error) {
      console.error("Error setting OpenAI API key:", error);
      throw new Error(`Failed to set API key: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("Error in setOpenAIApiKey:", error);
    throw error;
  }
};

export const sendChatCompletion = async (
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke("openai-chat", {
      body: {
        messages: request.messages,
        model: request.model || "gpt-3.5-turbo",
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens,
        stream: request.stream || false
      }
    });

    if (error) {
      console.error("Error calling openai-chat function:", error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in sendChatCompletion:", error);
    throw error;
  }
};

// Helper function to create a system message
export const createSystemMessage = (content: string): ChatMessage => ({
  role: "system",
  content
});

// Helper function to create a user message
export const createUserMessage = (content: string): ChatMessage => ({
  role: "user",
  content
});

// Helper function to extract assistant's response text
export const extractAssistantMessage = (
  response: ChatCompletionResponse
): string => {
  if (response.choices && response.choices.length > 0) {
    return response.choices[0].message.content;
  }
  return "";
};
