export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  model?: string;
  /** 0 = deterministic, higher = more varied. Personas often want ~0.7–0.9. */
  temperature?: number;
  /**
   * Strings that, if generated, stop the response. Handy here to keep a suspect
   * from speaking the detective's lines (e.g. stop on "\nDetective:").
   */
  stop?: string[];
  /**
   * Called with each chunk of text as it streams in. Implementations that
   * support streaming use this to feed the renderer live (a natural replacement
   * for the typewriter effect); callers that don't care can ignore it and just
   * await the full string. Optional.
   */
  onToken?: (chunk: string) => void;
  /** Abort an in-flight request (e.g. the player hit Ctrl-C). */
  signal?: AbortSignal;
  json?: boolean;
}

export interface LlmClient {
  /**
   * Send a conversation and get the model's next reply as plain text.
   *
   * Implementations MUST reject with an LlmError on connection/model failure
   * rather than returning an empty or partial string, so the engine can catch
   * it and surface a clean message via the renderer instead of crashing.
   */
  sendMessage(messages: ChatMessage[], options?: ChatOptions): Promise<string>;

  /**
   * Optional readiness check — e.g. ping the server and confirm the model is
   * pulled. Useful at startup to fail fast with a helpful message ("Is Ollama
   * running? Try `ollama serve`.") instead of dying mid-conversation.
   */
  isReachable?(): Promise<boolean>;
}

/**
 * Thrown by any LlmClient implementation when generation fails: model not
 * running, model not pulled, network error, or aborted. Catch this in the
 * engine to show a recoverable error via the renderer.
 */
export class LlmError extends Error {
  constructor(
    message: string,
    /** The original error, preserved for logging. */
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LlmError";
  }
}
