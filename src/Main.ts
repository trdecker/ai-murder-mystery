import * as readline from "readline";
import { startConversation } from "./Conversation.js";

function runInteractivePrompt(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.clear();
  console.log("AI MURDER MYSTERY\n");

  console.log(
    "In the sleepy town of Tokeland, Washington, wealthy hotel owner Don Dahlgren was found dead in the FISHY FJORD, the local pub.\n",
  );

  console.log(
    "You are the world renowned detective Ricardo Rivera. You must find the murderer!\n",
  );

  console.log("### SUSPECTS ###\n");

  console.log("Gerald Gotmann: 66, male. Fisherman.");
  console.log("Vivian Voss: 43, female. Pub owner and bar server.");
  console.log("Peter Poulson: 51, male. Pastor.");
  console.log("Fiona Fitzgerald: 66, male. Writer.\n");

  console.log("CHOOSE A SUSPECT TO INTERROGATE:\n");

  console.log("A) Gerald");
  console.log("B) Vivian");
  console.log("C) Peter");
  console.log("D) Fiona");

  rl.question("", async (answer: string) => {
    const choice = answer.toUpperCase().trim() as "A" | "B" | "C" | "D";

    if (["A", "B", "C", "D"].includes(choice)) {
      await startConversation(choice);
    } else {
      console.log("Invalid selection. Please choose A, B, C, or D.");
    }

    rl.close();
  });
}

runInteractivePrompt();