import { loadFile } from "./utils.js";
import { LlmError, type LlmClient, type ChatMessage } from "./ai/llmClient.js";
import { askCharacter, type CharacterReply } from "./ai/promptBuilder.js";
import type { Character } from "./types.js";
import type { Renderer, Choice } from "./cli/renderer.js";
import type { GameState } from "./core/GameState.js";

export interface CharacterConversationConfig {
  character: Character;
  llmClient: LlmClient;
  renderer: Renderer;
  state: GameState;
}

// A framing beat that opens the scene so the character has something to react
// to. Like the intro/ending copy, this could live in content rather than here.
const OPENING_BEAT =
  "(The detective walks up to your table and introduces himself.)";

const EXIT = "__exit__";

export class CharacterConversation {
  private readonly character: Character;
  private readonly llmClient: LlmClient;
  private readonly renderer: Renderer;
  private readonly state: GameState;
  private readonly systemPrompt: string;
  private readonly history: ChatMessage[] = [];

  constructor({
    character,
    llmClient,
    renderer,
    state,
  }: CharacterConversationConfig) {
    this.character = character;
    this.llmClient = llmClient;
    this.renderer = renderer;
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

    // Turn loop, driven by the suggested follow-up questions.
    while (true) {
      const choices: Choice<string>[] = [
        ...prompts.map((p) => ({ name: p, value: p })),
        { name: "❌ End conversation", value: EXIT },
      ];

      const selected = await this.renderer.select("What do you ask?", choices);
      if (selected === EXIT) return;

      const reply = await this.ask(selected, { record: true });
      if (!reply) return; // error path — bail back to the menu

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
      reply = await this.renderer.withSpinner(
        `${this.character.name} is thinking...`,
        () => askCharacter(this.llmClient, this.systemPrompt, this.history),
      );
    } catch (error) {
      this.renderer.error(
        error instanceof LlmError
          ? error.message
          : "Something went wrong talking to the model.",
      );
      return null;
    }

    this.history.push({ role: "assistant", content: reply.response });
    await this.renderer.speech(this.character.name, reply.response);

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
