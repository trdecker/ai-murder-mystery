import { loadFile } from "../utils.js";
import type { LlmClient, ChatMessage } from "../ai/llmClient.js";
import { askCharacter, type CharacterReply } from "../ai/promptBuilder.js";
import type { Character } from "../types.js";
import type { Screens } from "../cli/screens.js";
import type { GameState } from "./gameState.js";

export interface CharacterConversationConfig {
  character: Character;
  llmClient: LlmClient;
  screens: Screens;
  state: GameState;
}

const OPENING_BEAT =
  "(The detective walks up to your table and introduces himself.)";

export class CharacterConversation {
  private readonly character: Character;
  private readonly llmClient: LlmClient;
  private readonly screens: Screens;
  private readonly state: GameState;
  private readonly systemPrompt: string;
  private readonly history: ChatMessage[] = [];

  constructor({
    character,
    llmClient,
    screens,
    state,
  }: CharacterConversationConfig) {
    this.character = character;
    this.llmClient = llmClient;
    this.screens = screens;
    this.state = state;

    // Assemble the persona/system prompt from content. The JSON reply-format
    // instruction is NOT added here — askCharacter owns the reply schema.
    this.systemPrompt = [
      loadFile("AI_Instructions.txt"),
      loadFile(this.character.file),
      loadFile("Ricardo_Rivera.txt"),
    ].join("\n\n");
  }

  async start(): Promise<void> {
    // Opening line: seed the scene and let the character greet the detective.
    const opener = await this.ask(OPENING_BEAT, { record: false });
    if (!opener) return; // model unreachable — error already shown

    let prompts = opener.prompts;

    while (true) {
      const question = await this.screens.askQuestion(prompts);
      if (question === null) return; // player ended the conversation

      const reply = await this.ask(question, { record: true });
      if (!reply) return; // Model error; already shown

      prompts = reply.prompts;
    }
  }

  private async ask(
    detectiveLine: string,
    { record }: { record: boolean },
  ): Promise<CharacterReply | null> {
    this.history.push({ role: "user", content: detectiveLine });

    let reply: CharacterReply;
    try {
      reply = await this.screens.characterIsThinking(this.character.name, () =>
        askCharacter(this.llmClient, this.systemPrompt, this.history),
      );
    } catch (error) {
      this.screens.llmModelError(error);
      return null;
    }

    this.history.push({ role: "assistant", content: reply.response });
    await this.screens.characterSays(this.character.name, reply.response);

    if (record) {
      this.state.recordQuestioning(
        this.character.id,
        detectiveLine,
        reply.response,
      );
    }

    return reply;
  }
}
