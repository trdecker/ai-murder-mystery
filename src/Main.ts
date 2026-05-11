import inquirer from "inquirer";
import { startConversation } from "./Conversation.js";
import type { CharacterKey } from "./Conversation.js";

interface SuspectChoice {
  name: string;
  description: string;
  value: CharacterKey;
}

async function runInteractivePrompt(): Promise<void> {
  console.clear();
  console.log("🕵️  AI MURDER MYSTERY\n");

  console.log(
    "In the sleepy town of Tokeland, Washington, wealthy hotel owner Don Dahlgren was found dead in the FISHY FJORD, the local pub.\n",
  );

  console.log(
    "You are the world renowned detective Ricardo Rivera. You must find the murderer!\n",
  );

  const suspects: SuspectChoice[] = [
    {
      name: "Gerald Gotmann",
      description: "66, male. Fisherman.",
      value: "A",
    },
    {
      name: "Vivian Voss",
      description: "43, female. Pub owner and bar server.",
      value: "B",
    },
    {
      name: "Peter Poulson",
      description: "51, male. Pastor.",
      value: "C",
    },
    {
      name: "Fiona Fitzgerald",
      description: "66, male. Writer.",
      value: "D",
    },
  ];

  const answer = await inquirer.prompt([
    {
      type: "select",
      name: "suspect",
      message: "🔍 Choose a suspect to interrogate:",
      choices: suspects.map((suspect) => ({
        name: `${suspect.name} - ${suspect.description}`,
        value: suspect.value,
      })),
      pageSize: 4,
    },
  ]);

  await startConversation(answer.suspect);
}

runInteractivePrompt();
