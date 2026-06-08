export interface QuestionExchange {
  question: string;
  answer: string;
  timestamp: number;
}

export type Mood = "cooperative" | "defensive" | "hostile";

/** Everything about ONE character that changes during a single playthrough. */
export interface CharacterState {
  exchanges: QuestionExchange[]; // this character's Q&A transcript
}

export interface GameStateData {
  characters: Record<string, CharacterState>;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

// #####  State container  #####

export class GameState {
  private state: GameStateData;
  private listeners: Array<(state: GameStateData) => void> = [];

  constructor() {
    this.state = { characters: {} };
  }

  /** Lazily create a character's state the first time we touch it. */
  private ensureCharacter(characterId: string): CharacterState {
    let cs = this.state.characters[characterId];
    if (!cs) {
      this.state.characters[characterId] = cs;
    }
    return cs;
  }

  // State getters
  getState(): Readonly<GameStateData> {
    // NOTE: shallow copy — the nested `characters` object is still shared.
    // If you need callers to be unable to mutate state, swap this for
    // `structuredClone(this.state)` (costs a clone on every read/notify).
    return { ...this.state };
  }

  recordQuestioning(
    characterId: string,
    question: string,
    answer: string,
  ): void {
    const cs = this.ensureCharacter(characterId);

    cs.exchanges.push({
      question,
      answer,
      timestamp: Date.now(),
    });

    this.notifyListeners();
  }

  // Event system
  subscribe(listener: (state: GameStateData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  // Persistence
  save(): string {
    return JSON.stringify(this.state);
  }

  load(data: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new Error("Failed to load game state: Invalid JSON");
    }
    if (!parsed || typeof parsed !== "object" || !("characters" in parsed)) {
      throw new Error("Failed to load game state: Unexpected shape");
    }
    this.state = parsed as GameStateData;
    this.notifyListeners();
  }
}

// Singleton instance
export const gameState = new GameState();
