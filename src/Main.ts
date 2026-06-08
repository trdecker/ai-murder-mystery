import dotenv from "dotenv";
import { GameEngine } from "./core/GameEngine.js";
import { GameState } from "./core/GameState.js";
import { Renderer } from "./cli/renderer.js";
import { OllamaClient } from "./ai/Ollama.js";
import { Screens } from "./cli/screens.js";

dotenv.config();

async function runGame(): Promise<void> {
  const isDebug = process.argv.includes("--dev");

  const renderer = new Renderer({ animate: !isDebug, isDebug }); // skip the typewriter in dev
  const screens = new Screens(renderer);
  const llmClient = new OllamaClient();
  const state = new GameState();

  const gameEngine = new GameEngine({
    isDebug,
    renderer,
    screens,
    llmClient,
    state,
  });

  await gameEngine.initialize();
  await gameEngine.start();
}

runGame().catch((error) => {
  console.error("Fatal error during startup: ", error);
  process.exit(1);
});
