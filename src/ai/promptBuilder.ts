import { LlmClient, type ChatMessage } from "./llmClient.js";

export interface CharacterReply {
  /** The in-character line shown to the player. */
  response: string;
  /** Suggested follow-up questions the detective could ask next. */
  prompts: string[];
}

// Relocated from the old Ollama.ts — what we ask the model to return each turn.
const STRUCTURED_OUTPUT_INSTRUCTION = `
You must respond with a JSON object in exactly this format, and nothing else:
{
  "response": "<your in-character reply to the detective>",
  "prompts": ["<follow-up question 1>", "<follow-up question 2>", "<follow-up question 3>"]
}

The "prompts" array should contain 3 to 5 short, distinct follow-up questions the
detective could plausibly ask next, each a single first-person sentence (e.g.
"Where were you that night?"). Do not number them. Output nothing outside the JSON object.
`.trim();

/**
 * Ask a character for their next line. Assembles the messages (persona as the
 * system role + the reply-format instruction, then the conversation so far),
 * requests JSON, and parses the result with a fallback.
 */
export async function askCharacter(
  client: LlmClient,
  systemPrompt: string,
  history: ChatMessage[],
): Promise<CharacterReply> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n${STRUCTURED_OUTPUT_INSTRUCTION}`,
    },
    ...history,
  ];

  const raw = await client.sendMessage(messages, {
    json: true,
    stop: ["\nDetective:"], // keep the suspect from speaking the detective's lines
  });

  return parseReply(raw);
}

/** Parse the model's JSON reply, with a graceful fallback if it isn't valid. */
export function parseReply(raw: string): CharacterReply {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const response = typeof parsed.response === "string" ? parsed.response : "";
    const prompts = Array.isArray(parsed.prompts)
      ? parsed.prompts.filter(
          (p: unknown): p is string => typeof p === "string",
        )
      : [];
    return { response, prompts };
  } catch {
    // Model didn't return valid JSON — show its raw text and offer generic
    // follow-ups so the player isn't stuck.
    return {
      response: cleaned,
      prompts: ["Tell me more.", "What happened next?", "Why?"],
    };
  }
}
