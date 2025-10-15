# Word Card Game - AI Coding Agent Instructions

## Project Overview
Interactive vocabulary memorization game built with TypeScript + Vite. Users import CSV files of term/definition pairs, play matching games, and track learning progress via localStorage.

## Architecture

### Core Components (all in `src/`)
- **`main.tsx`**: Entry point, DOM management, event handlers, and app initialization
- **`gameLogic.ts`**: Game state (`GameState` interface), match validation, learned word review (5% chance to include mastered words)
- **`storage.ts`**: localStorage persistence for master word list, learned items, and mismatched attempts
- **`csvLoader.ts`**: CSV parsing with duplicate detection and validation
- **`gameUI.ts`**: Rendering game board, progress displays, and visual feedback
- **`pronunciation.ts`**: Web Speech API integration for text-to-speech
- **`types.ts`**: Core data structures (`RawFlashcard`, `Flashcard`, `SelectedItem`)

### Data Flow
1. CSV → `parseAndLoadCsvContent()` → `masterWordList` → localStorage
2. Game generation → `setupGame()` filters unlearned words → creates `Flashcard[]` with unique IDs
3. User interactions → `handleItemClick()` + `checkMatch()` → updates `GameState`
4. Game completion → `processLearnedItemsFromCurrentGame()` moves successfully matched (without mismatches) to `learnedItems`

## Key Patterns

### State Management
```typescript
// Centralized game state (single instance in main.tsx)
const gameState: GameState = createGameState();
// Never recreate - pass by reference to all game logic functions
```

### Learning Logic Rules
- Words matched **without any incorrect attempts** → added to `learnedItems`
- Words with ≥1 mismatch → tracked in `permanentlyMismatchedAttempts`, never marked learned
- 5% chance (`LEARNED_WORD_REVIEW_CHANCE`) to include a learned word for review in new games

### localStorage Keys (constants.ts)
- `flashcardGameMasterList`: All imported words
- `flashcardGameLearnedItems`: Successfully mastered words
- `flashcardGameMismatchedAttempts`: Words with incorrect match attempts

### CSV Format
```csv
Term,Definition
word1,definition for word1
"term with, comma","definition with, comma"
```
First line is header (skipped). Supports quoted fields with embedded commas.

## Development Workflow

### Run Locally
```bash
npm install
npm run dev  # Vite dev server on port 5173
```

### Build for Production
```bash
npm run build  # Output to dist/
```

### File Structure Conventions
- All TypeScript source in `src/` with `.ts` extensions
- Use `.js` extensions in import statements (Vite/ES module requirement)
- No React/JSX despite `.tsx` extension on `main.tsx` (legacy naming)

### CSV Loading
- Auto-loads from `word-csvs/words.csv` on startup (if exists)
- Manual import via file picker as fallback
- Duplicates detected case-insensitively and skipped

## Critical Implementation Details

### DOM Element Management
All DOM elements declared at top of `main.tsx` with type assertions:
```typescript
const termsContainer = document.getElementById('termsContainer') as HTMLDivElement;
```

### Match Validation Flow
1. User selects term → stored in `gameState.selectedTerm`
2. User selects definition → stored in `gameState.selectedDefinition`
3. `checkMatch()` compares via `activeFlashcards` array lookup
4. Correct: add to `currentGameMatchedWords`, mark DOM elements as `.matched`
5. Incorrect: add to `currentGameMismatchedWords`, flash `.incorrect` class for 1.2s

### Progress Tracking
- **Overall progress**: `learnedItems.length / masterWordList.length`
- **Game progress**: `matchedPairsCount` vs total pairs in current game
- Updates after each match and on game completion

## Common Tasks

### Adding New Game Modes
Modify `setupGame()` in `gameLogic.ts` to change word selection logic. Current mode: random unlearned words with 5% learned review rate.

### Adjusting Learning Criteria
Change `processLearnedItemsFromCurrentGame()` in `gameLogic.ts`. Current: requires **zero mismatches** in session to mark learned.

### Extending Storage
Add new localStorage key to `constants.ts`, create save/load functions in `storage.ts` following existing pattern.

### UI Customizations
CSS in `index.css`. Game board uses flexbox with `.game-column` containers for terms/definitions.

## Browser APIs Used
- **Web Speech API**: `window.speechSynthesis` for pronunciation (see `pronunciation.ts`)
- **localStorage**: Persistent data storage (no backend)
- **File API**: CSV import via `<input type="file">`

## Testing Notes
No automated tests. Manual testing workflow:
1. Import CSV with 6+ words
2. Play game, intentionally mismatch some pairs
3. Complete game, verify learned words exclude mismatched ones
4. Check localStorage in DevTools (Application → Local Storage)
