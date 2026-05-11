import { GameEngine } from "./core/GameEngine.js";

async function runGame(): Promise<void> {
  console.clear();
  console.log("🕵️  AI MURDER MYSTERY\n");

  console.log(
    "In the sleepy town of Tokeland, Washington, wealthy hotel owner Don Dahlgren was found dead in the FISHY FJORD, the local pub.\n",
  );

  console.log(
    "You are the world renowned detective Ricardo Rivera. You must find the murderer!\n",
  );

  // Check for --dev flag in command line arguments
  const isDebug = process.argv.includes("--dev");

  // Initialize and start the game engine
  const gameEngine = new GameEngine({
    isDebug,
  });

  try {
    await gameEngine.initialize();
    await gameEngine.showMainMenu();
  } catch (error) {
    console.error("❌ Failed to start game:", error);
    process.exit(1);
  }
}

runGame().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
