import {
  select as promptSelect,
  input as promptInput,
  confirm as promptConfirm,
} from "@inquirer/prompts";
import ora from "ora";

const style = {
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** A selectable option: a display label and the value returned when chosen. */
export interface Choice<T> {
  name: string;
  value: T;
}

export interface RendererOptions {
  animate?: boolean;
  isDebug?: boolean;
  typeSpeedMs?: number;
}

export class Renderer {
  private readonly animate: boolean;
  private readonly isDebug: boolean;
  private readonly typeSpeedMs: number;

  constructor({ animate, isDebug, typeSpeedMs }: RendererOptions = {}) {
    this.isDebug = isDebug ?? false;
    this.animate = animate ?? true;
    this.typeSpeedMs = typeSpeedMs ?? 12;
  }

  // #####  Output primitives  #####

  clear(): void {
    console.clear();
  }

  blank(): void {
    console.log();
  }

  /** A horizontal rule. Decoration, not copy. */
  rule(width = 50): void {
    console.log(style.dim("─".repeat(width)));
  }

  /** A bold banner/heading. Text supplied by the caller. */
  heading(text: string): void {
    console.log(style.bold(text));
  }

  /** A plain line, printed instantly. */
  line(text: string): void {
    console.log(text);
  }

  /** Scene-setting narration: dimmed, with the typewriter effect. */
  async narrate(text: string): Promise<void> {
    await this.type(text, style.dim);
    this.blank();
  }

  /** A character speaking: highlighted name, then typed dialogue. */
  async speech(name: string, text: string): Promise<void> {
    process.stdout.write(style.cyan(style.bold(`${name}: `)));
    await this.type(text);
    this.blank();
  }

  /** Debug message */
  debug(text: string): void {
    if (this.isDebug) console.log(style.yellow(text));
  }

  /** A recoverable, user-facing error (fatal ones still go through the logger). */
  error(text: string): void {
    console.log(style.red(`⚠️  ${text}`));
  }

  // #####  Input primitives  #####

  select<T>(message: string, choices: Choice<T>[]): Promise<T> {
    return promptSelect<T>({ message, choices });
  }

  /** Free-text input, trimmed. The caller interprets "" however it likes. */
  async input(message: string): Promise<string> {
    const answer = await promptInput({ message });
    return answer.trim();
  }

  confirm(message: string, defaultValue = false): Promise<boolean> {
    return promptConfirm({ message, default: defaultValue });
  }

  // #####  Async feedback  #####

  /** Run an async task behind a spinner. Stops on success, fails (and rethrows) on error. */
  async withSpinner<T>(label: string, task: () => Promise<T>): Promise<T> {
    const spinner = ora(label).start();
    try {
      const result = await task();
      spinner.stop();
      return result;
    } catch (error) {
      spinner.fail();
      throw error;
    }
  }

  // #####  Internals  #####

  /** Typewriter print; styling applied per-character so escapes aren't split. */
  private async type(
    text: string,
    color: (s: string) => string = (s) => s,
  ): Promise<void> {
    if (!this.animate) {
      console.log(color(text));
      return;
    }
    for (const char of text) {
      process.stdout.write(color(char));
      await sleep(this.typeSpeedMs);
    }
    process.stdout.write("\n");
  }
}
