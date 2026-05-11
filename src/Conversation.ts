import * as readline from "readline";
import OllamaAPI, { type OllamaMessage } from "./Ollama.js";

// Character definitions
interface Character {
  name: string;
  age: number;
  occupation: string;
}

type CharacterKey = "A" | "B" | "C" | "D";

const characters: Record<CharacterKey, Character> = {
  A: {
    name: "Gerald Gotmann",
    age: 66,
    occupation: "Fisherman",
    // personality: 'Gruff, suspicious of outsiders, knows everyone\'s business',
    // backstory: 'Has lived in Tokeland his whole life...'
  },
  B: {
    name: "Vivian Voss",
    age: 43,
    occupation: "Pub owner and bar server",
    // personality: 'Charming but secretive, protective of her business',
    // backstory: 'Owns the Fishy Fjord where the murder occurred...'
  },
  C: {
    name: "Peter Poulson",
    age: 43,
    occupation: "Local Pastor",
  },
  D: {
    name: "Fiona Fitzgerald",
    age: 43,
    occupation: "Writer and Barista",
  },
};

// Main conversation function
export async function startConversation(characterKey: CharacterKey): Promise<void> {
  const character = characters[characterKey];
  if (!character) {
    throw new Error(
      `Invalid character key: ${characterKey}. Available characters: ${Object.keys(characters).join(", ")}`,
    );
  }
  console.log(`\nYou approach ${character.name}...\n`);

  // Initialize Ollama conversation with character context
  const conversation = new CharacterConversation(character);
  await conversation.start();
}

// Character conversation class
class CharacterConversation {
  private character: Character;
  private conversationHistory: OllamaMessage[];
  private ollama: OllamaAPI;

  constructor(character: Character) {
    this.character = character;
    this.conversationHistory = [];
    try {
      this.ollama = new OllamaAPI();
    } catch (error) {
      console.error("Failed to initialize Ollama API:", (error as Error).message);
      throw new Error(
        "Could not connect to Ollama service. Please ensure Ollama is running.",
      );
    }
  }

  async start(): Promise<void> {
    console.log(`\nStarting conversation with ${this.character.name}...`);

    // Set up character system prompt
    const systemPrompt = `You are ${this.character.name}, a ${this.character.age}-year-old ${this.character.occupation} in the small town of Tokeland, Washington. A murder has occurred at the local pub (Fishy Fjord) and you are being questioned by detective Ricardo Rivera. Stay in character and respond naturally to questions. You may be innocent or guilty - respond as the character would.`;

    let rl: readline.Interface;
    try {
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
    } catch (error) {
      console.error("Failed to create readline interface:", (error as Error).message);
      throw new Error(
        "Could not initialize interactive input. This may not work in non-interactive environments.",
      );
    }

    console.log(
      `\n${this.character.name}: Hello, detective. I heard you wanted to speak with me about what happened at the pub.`,
    );

    const askQuestion = (): void => {
      rl.question("\nYou: ", (userInput: string) => {
        if (
          userInput.toLowerCase() === "quit" ||
          userInput.toLowerCase() === "exit"
        ) {
          console.log(`\n${this.character.name}: Goodbye, detective.`);
          rl.close();
          return;
        }

        // Handle async operation in a separate function
        this.handleUserInput(userInput, systemPrompt, rl, askQuestion);
      });
    };

    askQuestion();
  }

  private async handleUserInput(
    userInput: string,
    systemPrompt: string,
    rl: readline.Interface,
    askQuestion: () => void
  ): Promise<void> {
    try {
      // Add user message to conversation history
      this.conversationHistory.push({ role: "user", content: userInput });

      // Get response from Ollama
      const response = await this.ollama.sendConversation(
        this.conversationHistory,
        systemPrompt,
      );

      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: response,
      });

      console.log(`\n${this.character.name}: ${response}`);

      // Continue the conversation
      askQuestion();
    } catch (error) {
      console.error("Error getting response:", (error as Error).message);
      console.log("Please check that Ollama is running and try again.");
      rl.close();
    }
  }
}