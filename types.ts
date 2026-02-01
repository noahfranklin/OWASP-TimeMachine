
export enum Difficulty {
  EASY = 'Easy',
  INTERMEDIATE = 'Intermediate',
  IMPOSSIBLE = 'Impossible'
}

export enum Era {
  Y2013 = '2013',
  Y2017 = '2017',
  Y2021 = '2021',
  Y2025 = '2025'
}

export interface Vulnerability {
  id: string;
  rank: string;
  name: string;
  description: string;
  era: Era;
  theory: string;
  flag: string;
  codeSnippets: {
    [key in Difficulty]: string;
  };
  bypassLogic?: string;
  exploitHint: string;
}

export interface LabState {
  currentEra: Era;
  currentDifficulty: Difficulty;
  completedVulnerabilities: string[];
  foundFlags: string[];
}
