export interface Flashcard {
  term: string;
  definition: string;
  id: string; // Unique ID for each pair in the active game
}

export interface RawFlashcard {
  term: string;
  definition: string;
}

export interface SelectedItem {
  element: HTMLElement;
  text: string;
  type: 'term' | 'definition';
}

export interface CSVParseResult {
  mainMessage: string;
  totalWordsMessage: string | null;
  importedCount: number;
  skippedCount: number;
  success: boolean;
  newWords: RawFlashcard[];
}
