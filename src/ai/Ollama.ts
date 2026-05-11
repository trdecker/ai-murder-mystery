import dotenv from "dotenv";

dotenv.config();

interface OllamaMessage {
  role: "user" | "assistant";
  content: string;
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  format?: "json";
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

// What we ask the model to return on every turn.
const STRUCTURED_OUTPUT_INSTRUCTION = `
You must respond with a JSON object in exactly this format, and nothing else:
{
  "response": "<your in-character reply to the detective>",
  "prompts": ["<follow-up question 1>", "<follow-up question 2>", "<follow-up question 3>"]
}

The "prompts" array should contain 3 to 5 short, distinct follow-up questions or statements the detective could plausibly say next. Each prompt should be a single sentence, written from the detective's first-person perspective (e.g. "Where were you that night?"). Do not number them. Do not include any text outside the JSON object.
`.trim();

class OllamaAPI {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama2";
  }

  private async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        format: "json",
      } as OllamaGenerateRequest),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: OllamaGenerateResponse = await response.json();
    return data.response;
  }

  private parseStructuredResponse(raw: string): CustomOllamaResponse {
    // Strip code fences if the model added them despite format: "json".
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      const response =
        typeof parsed.response === "string" ? parsed.response : "";
      const prompts = Array.isArray(parsed.prompts)
        ? parsed.prompts.filter(
            (p: unknown): p is string => typeof p === "string",
          )
        : [];
      return { response, prompts };
    } catch {
      // Fallback: model didn't return valid JSON. Show the raw text and
      // offer a generic continuation so the player isn't stuck.
      return {
        response: cleaned,
        prompts: ["Tell me more.", "What happened next?", "Why?"],
      };
    }
  }

  async sendMessage(
    message: string,
    systemPrompt?: string,
  ): Promise<CustomOllamaResponse> {
    try {
      const prompt =
        (systemPrompt ? `${systemPrompt}\n\n` : "") +
        `${STRUCTURED_OUTPUT_INSTRUCTION}\n\n` +
        `User: ${message}\nAssistant:`;

      const raw = await this.generate(prompt);
      return this.parseStructuredResponse(raw);
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
      let prompt = "";

      if (systemPrompt) {
        prompt += `${systemPrompt}\n\n`;
      }
      prompt += `${STRUCTURED_OUTPUT_INSTRUCTION}\n\n`;

      messages.forEach((msg) => {
        if (msg.role === "user") {
          prompt += `User: ${msg.content}\n`;
        } else if (msg.role === "assistant") {
          prompt += `Assistant: ${msg.content}\n`;
        }
      });
      prompt += "Assistant:";

      const raw = await this.generate(prompt);
      return this.parseStructuredResponse(raw);
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
