import chalk from "chalk";
import ora, { Ora } from "ora";
import stripAnsi from "strip-ansi";

export class Renderer {
  private spinner: Ora | null = null;
  private typingSpeed: number = 30; // milliseconds per character

  // Color scheme
  private colors = {
    primary: chalk.cyan,
    secondary: chalk.yellow,
    success: chalk.green,
    error: chalk.red,
    warning: chalk.magenta,
    info: chalk.blue,
    dim: chalk.gray,
    highlight: chalk.bold.white,
    npc: chalk.hex("#FFA500"), // Orange for NPC dialogue
    player: chalk.hex("#87CEEB"), // Sky blue for player
    system: chalk.dim.gray,
    clue: chalk.bold.yellow,
  };

  // Typography
  private styles = {
    title: (text: string) => this.colors.primary.bold(text),
    subtitle: (text: string) => this.colors.secondary(text),
    header: (text: string) => chalk.bold.underline(text),
    divider: () => this.colors.dim("═".repeat(50)),
    bullet: (text: string) => `  ${this.colors.dim("•")} ${text}`,
  };

  // Main display methods
  displayTitle(title: string, subtitle?: string): void {
    console.clear();
    console.log();
    console.log(this.styles.divider());
    console.log(this.center(this.styles.title(title)));
    if (subtitle) {
      console.log(this.center(this.styles.subtitle(subtitle)));
    }
    console.log(this.styles.divider());
    console.log();
  }

  displayHeader(text: string): void {
    console.log();
    console.log(this.styles.header(text));
    console.log();
  }

  displaySection(title: string, content: string[]): void {
    console.log();
    console.log(this.colors.highlight(title));
    content.forEach((line) => console.log(this.styles.bullet(line)));
    console.log();
  }

  // Character dialogue
  displayCharacterDialogue(name: string, text: string): void {
    const formattedName = this.colors.npc(`[${name}]:`);
    console.log(`\n${formattedName} ${text}`);
  }

  displayPlayerDialogue(text: string): void {
    const formattedName = this.colors.player("[You]:");
    console.log(`\n${formattedName} ${text}`);
  }

  // Narrative text with optional typing effect
  async displayNarrative(
    text: string,
    useTypingEffect: boolean = false,
  ): Promise<void> {
    console.log();
    if (useTypingEffect) {
      await this.typeWriter(this.colors.dim(text));
    } else {
      console.log(this.colors.dim(text));
    }
    console.log();
  }

  // System messages
  displayInfo(message: string): void {
    console.log(this.colors.info(`ℹ ${message}`));
  }

  displaySuccess(message: string): void {
    console.log(this.colors.success(`✓ ${message}`));
  }

  displayError(message: string): void {
    console.log(this.colors.error(`✗ ${message}`));
  }

  displayWarning(message: string): void {
    console.log(this.colors.warning(`⚠ ${message}`));
  }

  displayDebug(message: string): void {
    if (process.env.DEBUG || process.argv.includes("--dev")) {
      console.log(this.colors.system(`[DEBUG] ${message}`));
    }
  }

  // Clue discovery
  displayClueDiscovered(clue: string): void {
    console.log();
    console.log(this.colors.clue("🔍 New Clue Discovered!"));
    console.log(this.colors.clue(`   "${clue}"`));
    console.log();
  }

  // Menu display
  displayMenu(title: string, options: string[]): void {
    console.log();
    console.log(this.colors.highlight(title));
    options.forEach((option, index) => {
      const number = this.colors.primary(`[${index + 1}]`);
      console.log(`  ${number} ${option}`);
    });
    console.log();
  }

  // Character list
  displayCharacterList(
    characters: Array<{
      name: string;
      occupation: string;
      description?: string;
    }>,
  ): void {
    console.log();
    characters.forEach((char, index) => {
      const number = this.colors.primary(`[${index + 1}]`);
      const name = this.colors.highlight(char.name);
      const occupation = this.colors.dim(`(${char.occupation})`);
      if (char.description) {
        console.log(`      ${this.colors.dim(char.description)}`);
      }
    });
    console.log();
  }

  // Loading spinner methods
  startSpinner(text: string): void {
    this.spinner = ora({
      text,
      color: "cyan",
      spinner: "dots",
    }).start();
  }

  updateSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  succeedSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  failSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  // Typing effect for dramatic moments
  async typeWriter(text: string, speed?: number): Promise<void> {
    const delay = speed || this.typingSpeed;
    for (const char of text) {
      process.stdout.write(char);
      await this.sleep(delay);
    }
    console.log();
  }

  // Conversation history
  displayConversationHistory(
    history: Array<{ role: string; content: string }>,
  ): void {
    console.log();
    console.log(this.styles.header("Conversation History"));
    history.forEach((entry) => {
      if (entry.role === "user") {
        console.log(this.colors.player(`[You]: ${entry.content}`));
      } else {
        console.log(this.colors.npc(`[NPC]: ${entry.content}`));
      }
    });
    console.log();
  }

  // Utility methods
  private center(text: string, width: number = 50): string {
    const textLength = stripAnsi(text).length;
    const padding = Math.max(0, Math.floor((width - textLength) / 2));
    return " ".repeat(padding) + text;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Clear screen
  clear(): void {
    console.clear();
  }

  // Raw output (for when you need unformatted text)
  raw(text: string): void {
    console.log(text);
  }

  // Line break
  lineBreak(): void {
    console.log();
  }

  // Divider line
  divider(): void {
    console.log(this.styles.divider());
  }
}

// Export a singleton instance for convenience
export const renderer = new Renderer();
