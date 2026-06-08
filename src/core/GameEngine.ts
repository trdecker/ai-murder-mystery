import { Character } from "../types.js";
import { CharacterConversation } from "../Conversation.js";
import { GameState } from "./GameState.js";
import { readFile } from "fs/promises";

export interface GameConfig {
  state: GameState;
  isDebug?: boolean;
}

export class GameEngine {
  private characters: Character[] = [];
  private currentConversation?: CharacterConversation;
  private readonly state: GameState;
  private gameLoop?: NodeJS.Timeout;
  public readonly isDebug?: boolean;

  constructor({ state, isDebug = false }: GameConfig) {
    this.state = state;
    this.isDebug = isDebug;
  }

  // Load the characters
  async initialize(): Promise<void> {
    // console.log("🔍 AI Murder Mystery Game");
    // console.log("═".repeat(50));

    // Load the characters
    try {
      const charactersData = await readFile("./data/characters.json", "utf-8");
      this.characters = JSON.parse(charactersData);
      // logger.debug(`✅ Loaded ${this.characters.length} characters`);
    } catch (error) {
      throw new Error("Failed to load character data");
    }
  }

  async start(): Promise<void> {
    // this.renderer.showIntro();
    await this.runMainMenu();
  }

  async runMainMenu(): Promise<void> {
    // Skip straight to Gerald Gottman conversation if debug mode
    if (this.isDebug) {
      const geraldGottman = this.characters.find(
        (c) => c.name === "Gerald Gottmann",
      );

      if (geraldGottman) {
        // console.log("🔧 Debug mode: Starting conversation with Gerald Gottman");
        await this.startConversation(geraldGottman);
        this.quit();
      } else {
        // TODO: log error
      }
    }

    // // Create menu choices - using string values for proper typing
    // const choices = this.characters.map((character, index) => ({
    //   name: `🕵️ Interrogate ${character.name}`,
    //   value: `character_${index}`,
    // }));

    // choices.push({
    //   name: "❌ Quit Game",
    //   value: "quit",
    // });

    // const action = await select({
    //   message: "What would you like to do?",
    //   choices,
    // });

    // if (action === "quit") {
    //   this.quit();
    //   return;
    // }

    // // Extract character index and get character
    // const characterIndex = parseInt(action.replace("character_", ""));
    // const character = this.characters[characterIndex];

    // this.currentConversation = new CharacterConversation(character);

    // Begin the conversation!
    // await this.currentConversation.start();

    // Return to main menu after conversation ends
    await this.runMainMenu();
  }

  private async startConversation(character: Character): Promise<void> {
    this.currentConversation = new CharacterConversation(character);
    await this.currentConversation.start();
  }

  quit(): void {
    process.exit(0);
  }
}
