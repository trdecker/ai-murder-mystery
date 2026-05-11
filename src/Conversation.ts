import * as readline from "readline";
import OllamaAPI, {
  type OllamaMessage,
  type CustomOllamaResponse,
} from "./ai/Ollama.js";
import { loadFile } from "./utils.js";
import { Character } from "./types.js";

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

    const askQuestion = (): void => {
      // this.rl.question("\nYou: ", (userInput: string) => {
      //   if (
      //     userInput.toLowerCase() === "quit" ||
      //     userInput.toLowerCase() === "exit"
      //   ) {
      //     console.log(`\n${this.character.name}: Goodbye, detective.`);
      //     return;
      //   }
      //   // Handle async operation in a separate function
      //   this.handleUserInput(userInput, askQuestion);
      // });
    };

    askQuestion();
  }

  private async handleUserInput(
    userInput: string,
    askQuestion: () => void,
  ): Promise<void> {
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

      // Continue the conversation
      askQuestion();
    } catch (error) {
      console.error("Error getting response:", (error as Error).message);
      console.log("Please check that Ollama is running and try again.");
    }
  }
}
