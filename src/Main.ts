import { GameEngine } from "./core/GameEngine.js";
import { GameState } from "./core/GameState.js";

async function runGame(): Promise<void> {
  // console.clear();
  // console.log("🕵️  AI MURDER MYSTERY\n");

  // console.log(
  //   "In the sleepy town of Tokeland, Washington, wealthy hotel owner Don Dahlgren was found dead in the FISHY FJORD, the local pub.\n",
  // );

  // console.log(
  //   "You are the world renowned detective Ricardo Rivera. You must find the murderer!\n",
  // );

  // Check for --dev flag in command line arguments
  const isDebug = process.argv.includes("--dev");

  const state = new GameState();

  // Initialize and start the game engine
  const gameEngine = new GameEngine({
    state,
    isDebug,
  });

  await gameEngine.initialize();
  await gameEngine.runMainMenu();
}

runGame().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
