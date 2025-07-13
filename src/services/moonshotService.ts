
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

export const sendChatCompletion = async (
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> => {
  try {
    console.log('Sending chat completion request:', request);
    
    const { data, error } = await supabase.functions.invoke("moonshot-chat", {
      body: {
        messages: request.messages,
        model: request.model || "moonshot-v1-8k",
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 2000,
        stream: request.stream || false
      }
    });

    if (error) {
      console.error("Error calling moonshot-chat function:", error);
      
      // Provide more specific error details
      let errorMessage = `Failed to get AI response: ${error.message}`;
      if (error.message?.includes('API key')) {
        errorMessage = 'AI service API key is not configured properly';
      } else if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        errorMessage = 'AI service rate limit exceeded. Please try again later';
      } else if (error.message?.includes('500') || error.message?.includes('502')) {
        errorMessage = 'AI service is temporarily unavailable. Please try again later';
      }
      
      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error('No response received from AI service');
    }

    console.log('Chat completion response received:', data);
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

// Health check function for the AI service
export const checkAIServiceHealth = async (): Promise<{ healthy: boolean; details?: any; error?: string }> => {
  try {
    console.log('Checking AI service health...');
    
    const { data, error } = await supabase.functions.invoke("moonshot-chat", {
      body: {
        messages: [{ role: "user", content: "Hello" }],
        model: "moonshot-v1-8k",
        max_tokens: 10
      }
    });

    if (error) {
      console.error('AI service health check failed:', error);
      return { 
        healthy: false, 
        error: error.message || 'Health check failed',
        details: error 
      };
    }

    return { 
      healthy: true, 
      details: data 
    };
  } catch (error) {
    console.error('AI service health check error:', error);
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error 
    };
  }
};
