import { Character } from "../types.js";
import { CharacterConversation } from "../Conversation.js";
import OllamaAPI from "../ai/Ollama.js";
import * as readline from "readline";
import { logger } from "../Logger.js";
import { select } from "@inquirer/prompts";

export interface GameConfig {
  isDebug?: boolean;
}

export class GameEngine {
  private characters: Character[] = [];
  private currentConversation?: CharacterConversation;
  private ollamaApi: OllamaAPI;
  private gameLoop?: NodeJS.Timeout;
  public isDebug?: boolean;

  // Initialize readline interface, ollamaAPI, isDebug
  constructor({ isDebug = false }: GameConfig) {
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
    // Skip straight to Gerald Gottman conversation if debug mode
    if (this.isDebug) {
      const geraldGottman = this.characters.find(
        c => c.name === "Gerald Gotmann"
      );

      if (geraldGottman) {
        console.log("🔧 Debug mode: Starting conversation with Gerald Gottman");
        this.currentConversation = new CharacterConversation(geraldGottman);
        await this.currentConversation.start();
        this.quit();
        return;
      }
    }

    // Create menu choices - using string values for proper typing
    const choices = this.characters.map((character, index) => ({
      name: `🕵️ Interrogate ${character.name}`,
      value: `character_${index}`,
    }));

    choices.push({
      name: "❌ Quit Game",
      value: "quit",
    });

    const action = await select({
      message: "What would you like to do?",
      choices,
    });

    if (action === "quit") {
      this.quit();
      return;
    }

    // Extract character index and get character
    const characterIndex = parseInt(action.replace("character_", ""));
    const character = this.characters[characterIndex];

    this.currentConversation = new CharacterConversation(character);

    // Begin the conversation!
    await this.currentConversation.start();

    // Return to main menu after conversation ends
    await this.showMainMenu();
  }

  quit(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    console.log("\nThanks for playing! 🕵️");
    process.exit(0);
  }
}
