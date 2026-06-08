import { LlmClient, ChatMessage, ChatOptions, LlmError } from "./llmClient.js";

export interface OllamaConfig {
  baseUrl?: string;
  model?: string;
}

interface OllamaChatResponse {
  message?: { role: string; content: string };
  done: boolean;
}

export class OllamaClient implements LlmClient {
  private readonly baseUrl: string;
  private readonly model: string;

  // Config is injected (with env fallbacks) rather than read straight from the
  // environment inside the class — easier to test and to point at another
  // server. Call dotenv.config() ONCE in Main (it's a startup concern), or load
  // config there and pass it in, instead of as an import side-effect here.
  constructor(config: OllamaConfig = {}) {
    this.baseUrl =
      config.baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    this.model = config.model ?? process.env.OLLAMA_MODEL ?? "llama3.2";
  }

  async sendMessage(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<string> {
    const body = {
      model: options.model ?? this.model,
      messages, // /api/chat takes roles natively — no manual "User:/Assistant:" flattening
      stream: Boolean(options.onToken),
      ...(options.json ? { format: "json" as const } : {}),
      options: {
        ...(options.temperature !== undefined
          ? { temperature: options.temperature }
          : {}),
        ...(options.stop ? { stop: options.stop } : {}),
      },
    };

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: options.signal,
      });
    } catch (cause) {
      // Network-level failure (server down, DNS, aborted) -> the contract's error.
      throw new LlmError(
        `Could not reach Ollama at ${this.baseUrl}. Is it running? (try \`ollama serve\`)`,
        cause,
      );
    }

    if (!response.ok) {
      throw new LlmError(
        `Ollama returned ${response.status} ${response.statusText}.`,
      );
    }

    return options.onToken
      ? this.readStream(response, options.onToken)
      : this.readSingle(response);
  }

  // Optional readiness check from the port — ping the server before we start.
  async isReachable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }

  private async readSingle(response: Response): Promise<string> {
    const data = (await response.json()) as OllamaChatResponse;
    return data.message?.content ?? "";
  }

  private async readStream(
    response: Response,
    onToken: (chunk: string) => void,
  ): Promise<string> {
    if (!response.body) {
      throw new LlmError("Ollama returned an empty streaming body.");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";

    // Ollama streams newline-delimited JSON objects, one per token-ish chunk.
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;

        let chunk: OllamaChatResponse;
        try {
          chunk = JSON.parse(line);
        } catch {
          continue; // ignore a malformed/partial line
        }
        const piece = chunk.message?.content ?? "";
        if (piece) {
          full += piece;
          onToken(piece);
        }
      }
    }
    return full;
  }
}
