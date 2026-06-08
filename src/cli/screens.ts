import type { Renderer, Choice } from "./renderer.js";
import type { Character } from "../types.js";
import { copy } from "../content/copy.js";

export type MainMenuChoice = Character | "accuse" | "quit";

export class Screens {
  constructor(private readonly r: Renderer) {}

  async intro(): Promise<void> {
    this.r.clear();
    this.r.heading(copy.title);
    this.r.rule();
    this.r.blank();
    for (const para of copy.intro) await this.r.narrate(para);
  }

  mainMenu(characters: Character[]): Promise<MainMenuChoice> {
    const choices: Choice<MainMenuChoice>[] = [
      ...characters.map((c) => ({
        name: copy.interrogateLabel(c.name),
        value: c,
      })),
      { name: copy.accuseLabel, value: "accuse" as const },
      { name: copy.quitLabel, value: "quit" as const },
    ];
    return this.r.select(copy.menuPrompt, choices);
  }

  async accusation(characters: Character[]): Promise<Character | null> {
    const accused = await this.r.select<Character>(
      copy.accusePrompt,
      characters.map((c) => ({ name: c.name, value: c })),
    );
    const sure = await this.r.confirm(copy.confirmAccuse(accused.name));
    return sure ? accused : null;
  }

  async ending(
    won: boolean,
    guiltyName: string,
    accusedName: string,
  ): Promise<void> {
    this.r.blank();
    this.r.rule();
    await this.r.narrate(
      won ? copy.win(guiltyName) : copy.lose(guiltyName, accusedName),
    );
  }

  farewell(): void {
    this.r.blank();
    this.r.line(copy.farewell);
  }
}
