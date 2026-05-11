export interface QuestioningRecord {
  characterId: string;
  questions: Array<{
    question: string;
    answer: string;
    timestamp: number;
    suspicionChange?: number;
  }>;
}

export interface GameStateData {
  // Character tracking
  charactersQuestioned: QuestioningRecord[];
  suspicionLevels: Record<string, number>; // 0-100
  characterMoods: Record<string, "cooperative" | "defensive" | "hostile">;
}

export class GameState {
  private state: GameStateData;
  private listeners: Array<(state: GameStateData) => void> = [];

  constructor() {
    this.state = {
      charactersQuestioned: [],
      suspicionLevels: {},
      characterMoods: {},
    };
  }

  // State getters
  getState(): Readonly<GameStateData> {
    return { ...this.state };
  }

  getSuspicionLevel(characterId: string): number {
    return this.state.suspicionLevels[characterId] || 0;
  }

  hasQuestionedCharacter(characterId: string): boolean {
    return this.state.charactersQuestioned.some(
      (record) => record.characterId === characterId,
    );
  }

  recordQuestioning(
    characterId: string,
    question: string,
    answer: string,
    suspicionChange?: number,
  ): void {
    let record = this.state.charactersQuestioned.find(
      (r) => r.characterId === characterId,
    );

    if (!record) {
      record = { characterId, questions: [] };
      this.state.charactersQuestioned.push(record);
    }

    record.questions.push({
      question,
      answer,
      timestamp: Date.now(),
      suspicionChange,
    });

    // Update suspicion if provided
    if (suspicionChange) {
      this.adjustSuspicion(characterId, suspicionChange);
    }

    this.notifyListeners();
  }

  adjustSuspicion(characterId: string, change: number): void {
    const current = this.state.suspicionLevels[characterId] || 0;
    this.state.suspicionLevels[characterId] = Math.max(
      0,
      Math.min(100, current + change),
    );

    // Update character mood based on suspicion
    const suspicion = this.state.suspicionLevels[characterId];
    if (suspicion < 30) {
      this.state.characterMoods[characterId] = "cooperative";
    } else if (suspicion < 70) {
      this.state.characterMoods[characterId] = "defensive";
    } else {
      this.state.characterMoods[characterId] = "hostile";
    }

    this.notifyListeners();
  }

  // Event system
  subscribe(listener: (state: GameStateData) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
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
    try {
      this.state = JSON.parse(data);
      this.notifyListeners();
    } catch (error) {
      throw new Error("Failed to load game state: Invalid data format");
    }
  }
}

// Singleton instance
export const gameState = new GameState();
