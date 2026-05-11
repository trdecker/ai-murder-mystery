import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

interface OllamaMessage {
  role: "user" | "assistant";
  content: string;
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface CustomOllamaResponse {
  response: string;
  prompts: string[];
}

class OllamaAPI {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama2";
  }

  async sendMessage(message: string, systemPrompt?: string): Promise<CustomOllamaResponse> {
    try {
      let prompt = message;
      const prompts: string[] = [message];

      if (systemPrompt) {
        prompt = `${systemPrompt}\n\nUser: ${message}`;
        prompts.unshift(systemPrompt);
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
        } as OllamaGenerateRequest),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: OllamaGenerateResponse = await response.json();
      return {
        response: data.response,
        prompts: prompts
      };
    } catch (error) {
      console.error(
        "Error sending message to Ollama:",
        (error as Error).message,
      );
      throw error;
    }
  }

  async sendConversation(
    messages: OllamaMessage[],
    systemPrompt?: string,
  ): Promise<CustomOllamaResponse> {
    try {
      // Convert messages to a single prompt format for Ollama
      let prompt = "";
      const prompts: string[] = [];

      if (systemPrompt) {
        prompt += `${systemPrompt}\n\n`;
        prompts.push(systemPrompt);
      }

      // Convert conversation format to text
      messages.forEach((msg) => {
        if (msg.role === "user") {
          prompt += `User: ${msg.content}\n`;
          prompts.push(`User: ${msg.content}`);
        } else if (msg.role === "assistant") {
          prompt += `Assistant: ${msg.content}\n`;
          prompts.push(`Assistant: ${msg.content}`);
        }
      });

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
        } as OllamaGenerateRequest),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: OllamaGenerateResponse = await response.json();
      return {
        response: data.response,
        prompts: prompts
      };
    } catch (error) {
      console.error(
        "Error sending conversation to Ollama:",
        (error as Error).message,
      );
      throw error;
    }
  }
}

export default OllamaAPI;
export type { OllamaMessage, CustomOllamaResponse };
