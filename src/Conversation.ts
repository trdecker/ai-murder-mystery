import OllamaAPI, {
  type OllamaMessage,
  type CustomOllamaResponse,
} from "./ai/Ollama.js";
import { loadFile } from "./utils.js";
import { Character } from "./types.js";
import { select } from "@inquirer/prompts";

// Character conversation class
export class CharacterConversation {
  private character: Character;
  private characterPrompt: string;
  private conversationHistory: OllamaMessage[];
  private ollama: OllamaAPI;
  private systemPrompt: string;
  private playerPrompt: string;

  constructor(character: Character) {
    // Initialize fields
    this.character = character;
    const characterPrompt = loadFile(character.file);
    this.characterPrompt = characterPrompt;
    this.conversationHistory = [];
    this.systemPrompt = loadFile("AI_Instructions.txt");
    this.playerPrompt = loadFile("Ricardo_Rivera.txt");

    // Start ollama
    try {
      this.ollama = new OllamaAPI();
    } catch (error) {
      console.error(
        "Failed to initialize Ollama API:",
        (error as Error).message,
      );
      throw new Error(
        "Could not connect to Ollama service. Please ensure Ollama is running.",
      );
    }
  }

  async start(): Promise<void> {
    console.log(`\nStarting conversation with ${this.character.name}...`);

    const conversationPrompt =
      this.systemPrompt +
      "\n\n" +
      this.characterPrompt +
      "\n\n" +
      this.playerPrompt;

    // Initialize chat with context
    const result = await this.ollama.sendConversation(
      this.conversationHistory,
      conversationPrompt +
        " For this first message, please respond as if I, the detective, have just walked up and greeted you.",
    );

    // Add assistant response to conversation history
    this.conversationHistory.push({
      role: "assistant",
      content: result.response,
    });

    // Display response
    console.log(`\n${this.character.name}: ${result.response}`);

    // Main conversation loop — driven by suggested prompts
    let currentPrompts = result.prompts;

    while (true) {
      const choices = [
        ...currentPrompts.map((prompt) => ({ name: prompt, value: prompt })),
        { name: "❌ End conversation", value: "__exit__" },
      ];

      const selected = await select({
        message: "What do you ask?",
        choices,
      });

      if (selected === "__exit__") {
        console.log(`\n${this.character.name}: Goodbye, detective.`);
        return;
      }

      const next = await this.handleUserInput(selected);
      if (!next) {
        // Error path — bail out of the loop
        return;
      }
      currentPrompts = next;
    }
  }

  private async handleUserInput(userInput: string): Promise<string[] | null> {
    try {
      // Add user message to conversation history
      this.conversationHistory.push({ role: "user", content: userInput });

      // Get response from Ollama
      const result = await this.ollama.sendConversation(
        this.conversationHistory,
        this.systemPrompt,
      );

      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: result.response,
      });

      console.log(`\n${this.character.name}: ${result.response}`);

      return result.prompts;
    } catch (error) {
      console.error("Error getting response:", (error as Error).message);
      console.log("Please check that Ollama is running and try again.");
      return null;
    }
  }
}
