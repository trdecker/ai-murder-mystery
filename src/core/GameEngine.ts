import { Character } from "../types.js";
import { gameState } from "./GameState.js";
import { CharacterConversation } from "../Conversation.js";
import OllamaAPI from "../ai/Ollama.js";
import * as readline from "readline";
import { logger } from "../Logger.js";

export interface GameConfig {
  isDebug?: boolean;
}

export class GameEngine {
  private characters: Character[] = [];
  private currentConversation?: CharacterConversation;
  private rl: readline.Interface;
  private ollamaApi: OllamaAPI;
  private gameLoop?: NodeJS.Timeout;
  public isDebug?: boolean;

  // Initialize readline interface, ollamaAPI, isDebug
  constructor({ isDebug = false }: GameConfig) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.ollamaApi = new OllamaAPI();
    this.isDebug = isDebug;
  }

  // Load the characters
  async initialize(): Promise<void> {
    console.log("🔍 AI Murder Mystery Game");
    console.log("═".repeat(50));

    // Load the characters
    try {
      const fs = await import("fs/promises");
      const charactersData = await fs.readFile(
        "./data/characters.json",
        "utf-8",
      );
      this.characters = JSON.parse(charactersData);
      logger.debug(`✅ Loaded ${this.characters.length} characters`);
    } catch (error) {
      throw new Error("Failed to load character data");
    }
  }

  async showMainMenu(): Promise<void> {
    console.clear();
    const numCharacters = this.characters.length;
    this.characters.forEach((character, i) => {
      console.log(`${i + 1}) Interrogate ${character.name}`);
    });
    console.log(`${numCharacters + 1}) Quit`);

    const choice = await this.getUserChoice(
      `Choose an action: 1-${numCharacters + 1}): `,
    );

    // Quit if that decision was chosen
    if (choice === (numCharacters + 1).toString()) {
      this.quit();
      return;
    }

    // Select character
    const index = parseInt(choice) - 1;

    if (index >= 0 && index < this.characters.length) {
      const character = this.characters[index];

      this.currentConversation = new CharacterConversation(character, this.rl);

      // Begin the conversation!
      await this.currentConversation.start();
    } else {
      this.showMainMenu();
    }
  }

  private async getUserChoice(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  quit(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.rl.close();
    console.log("\nThanks for playing! 🕵️");
    process.exit(0);
  }
}
