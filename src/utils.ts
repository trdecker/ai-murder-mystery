import * as fs from "fs";
import * as path from "path";

export function loadFile(filename: string): string {
  try {
    const promptPath = path.join(process.cwd(), "prompts", filename);
    return fs.readFileSync(promptPath, "utf-8");
  } catch (error) {
    throw new Error("Failed to load file", { cause: error });
  }
}
