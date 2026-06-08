import { readFile } from "fs/promises";
import { CharacterConversation } from "./conversation.js";
import type { Screens, MainMenuChoice } from "../cli/screens.js";
import type { Character } from "../types.js";
import type { LlmClient } from "../ai/llmClient.js";
import type { Renderer } from "../cli/renderer.js";
import type { GameState } from "./gameState.js";

export interface GameConfig {
  isDebug?: boolean;
  renderer: Renderer;
  screens: Screens;
  llmClient: LlmClient;
  state: GameState;
}

export class GameEngine {
  private characters: Character[] = [];
  private currentConversation?: CharacterConversation;
  private readonly renderer: Renderer;
  private readonly screens: Screens;
  private readonly llmClient: LlmClient;
  private readonly state: GameState;
  public readonly isDebug: boolean;

  constructor({
    isDebug = false,
    renderer,
    screens,
    llmClient,
    state,
  }: GameConfig) {
    this.renderer = renderer;
    this.screens = screens;
    this.llmClient = llmClient;
    this.state = state;
    this.isDebug = isDebug;
  }

  async initialize(): Promise<void> {
    // Fail fast if the model server isn't up
    if (this.llmClient.isReachable && !(await this.llmClient.isReachable())) {
      throw new Error(
        "Ollama isn't reachable. Start it with `ollama serve` and make sure your model is pulled.",
      );
    }

    // Loading data could later move to a ScenarioLoader; path should come from config.
    try {
      const raw = await readFile("./data/characters.json", "utf-8");
      this.characters = JSON.parse(raw);
      this.renderer.debug(`Loaded ${this.characters.length} characters`);
    } catch (error) {
      throw new Error("Failed to load character data");
    }
  }

  async start(): Promise<void> {
    await this.screens.intro();
    await this.runMainMenu();
  }

  private async runMainMenu(): Promise<void> {
    if (this.isDebug) {
      const gerald = this.characters.find((c) => c.id === "gerald_gottman");
      if (gerald) {
        await this.startConversation(gerald);
        return this.quit();
      }
    }

    const choice: MainMenuChoice = await this.screens.mainMenu(this.characters);

    if (choice === "quit") return this.quit();
    if (choice === "accuse") return this.runAccusation();

    // Anything else is a Character to interrogate
    await this.startConversation(choice);
    await this.runMainMenu();
  }

  private async startConversation(character: Character): Promise<void> {
    this.currentConversation = new CharacterConversation({
      character,
      llmClient: this.llmClient,
      renderer: this.renderer,
      state: this.state,
    });
    await this.currentConversation.start();
  }

  private async runAccusation(): Promise<void> {
    const accused = await this.screens.accusation(this.characters);
    if (!accused) return this.runMainMenu(); // backed out at the confirmation

    // Adjudication is DETERMINISTIC — read from scenario data, never the LLM.
    // Assumes each character record carries an `isGuilty` flag (scenario data).
    const guilty = this.characters.find((c) => c.isGuilty);
    const won = !!guilty && accused.id === guilty.id;

    // TODO: persist the outcome once GameState has a recordAccusation()/phase:
    //   this.state.recordAccusation(accused.id, won);

    await this.screens.ending(won, guilty?.name ?? "the killer", accused.name);
    this.quit();
  }

  quit(): void {
    this.screens.farewell();
    process.exit(0);
  }
}
