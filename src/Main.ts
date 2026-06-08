import dotenv from "dotenv";
import { GameEngine } from "./core/GameEngine.js";
import { GameState } from "./core/GameState.js";
import { Renderer } from "./cli/renderer.js";
import { OllamaClient } from "./ai/Ollama.js";
import { logger } from "./Logger.js";
import { Screens } from "./cli/screens.js";

dotenv.config(); // load env ONCE, here at the entry point (out of OllamaClient)

async function runGame(): Promise<void> {
  const isDebug = process.argv.includes("--dev");

  const renderer = new Renderer({ animate: !isDebug }); // skip the typewriter in dev
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

// Single top-level error boundary; HOW the error surfaces goes through the logger.
runGame().catch((error) => {
  logger.error("Fatal error during startup", error);
  process.exit(1);
});
