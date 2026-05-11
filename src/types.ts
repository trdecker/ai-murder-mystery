export interface Character {
  name: string;
  age: number;
  gender: string;
  occupation: string;
  category: string;
  description: string;
  personality: {
    traits: string[];
    likes: string[];
    dislikes: string[];
    secrets: string[];
  };
  background: {
    family: string;
    routine: string;
    relationships: Array<{
      person: string;
      relationship: string;
    }>;
  };
  id: string;
  file: string;
}