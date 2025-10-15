import { RawFlashcard, Flashcard, SelectedItem } from './types.js';
import { shuffleArray } from './utils.js';
import { LEARNED_WORD_REVIEW_CHANCE } from './constants.js';
import { saveLearnedItems, savePermanentlyMismatchedAttempts } from './storage.js';
import { updateGameProgressDisplay } from './gameUI.js';
import { populateMismatchedAttemptsList, populateLearnedWordsList } from './wordLists.js';

/**
 * Game logic and state management
 */

export interface GameState {
  activeFlashcards: Flashcard[];
  selectedTerm: SelectedItem | null;
  selectedDefinition: SelectedItem | null;
  matchedPairsCount: number;
  mismatchedAttemptsCount: number;
  currentGameRawFlashcards: RawFlashcard[];
  successfullyMatchedTermsThisGame: Set<string>;
  incorrectlyAttemptedTermsThisGameSession: Set<string>;
  currentGameMatchedWords: Set<string>;
  currentGameMismatchedWords: Set<string>;
  currentGameMismatchCount: number;
}

export function createGameState(): GameState {
  return {
    activeFlashcards: [],
    selectedTerm: null,
    selectedDefinition: null,
    matchedPairsCount: 0,
    mismatchedAttemptsCount: 0,
    currentGameRawFlashcards: [],
    successfullyMatchedTermsThisGame: new Set(),
    incorrectlyAttemptedTermsThisGameSession: new Set(),
    currentGameMatchedWords: new Set(),
    currentGameMismatchedWords: new Set(),
    currentGameMismatchCount: 0,
  };
}

export function resetGameState(gameState: GameState): void {
  gameState.activeFlashcards = [];
  gameState.selectedTerm = null;
  gameState.selectedDefinition = null;
  gameState.matchedPairsCount = 0;
  gameState.mismatchedAttemptsCount = 0;
  gameState.currentGameRawFlashcards = [];
  gameState.successfullyMatchedTermsThisGame.clear();
  gameState.incorrectlyAttemptedTermsThisGameSession.clear();
  gameState.currentGameMatchedWords.clear();
  gameState.currentGameMismatchedWords.clear();
  gameState.currentGameMismatchCount = 0;
}

export function handleItemClick(
  element: HTMLElement,
  text: string,
  type: 'term' | 'definition',
  gameState: GameState,
  statusMessage: HTMLDivElement,
  checkMatchCallback: () => void
): void {
  if (element.classList.contains('matched')) return;

  statusMessage.textContent = '';
  statusMessage.className = 'status-message';

  if (type === 'term') {
    if (gameState.selectedTerm?.element === element) {
      gameState.selectedTerm.element.classList.remove('selected');
      gameState.selectedTerm = null;
    } else {
      if (gameState.selectedTerm) {
        gameState.selectedTerm.element.classList.remove('selected');
      }
      element.classList.add('selected');
      gameState.selectedTerm = { element, text, type };
    }
  } else {
    if (gameState.selectedDefinition?.element === element) {
      gameState.selectedDefinition.element.classList.remove('selected');
      gameState.selectedDefinition = null;
    } else {
      if (gameState.selectedDefinition) {
        gameState.selectedDefinition.element.classList.remove('selected');
      }
      element.classList.add('selected');
      gameState.selectedDefinition = { element, text, type };
    }
  }
  checkMatchCallback();
}

export function checkMatch(
  gameState: GameState,
  masterWordList: RawFlashcard[],
  statusMessage: HTMLDivElement,
  processGameResultsCallback?: () => void
): void {
  if (gameState.selectedTerm && gameState.selectedDefinition) {
    const termItem = gameState.selectedTerm;
    const defItem = gameState.selectedDefinition;

    const originalCardInGame = gameState.activeFlashcards.find(
      (card) => card.term === termItem.text,
    );
    const originalCardMaster = masterWordList.find(
      (card) => card.term === termItem.text
    );

    if (originalCardInGame && originalCardInGame.definition === defItem.text) {
      // CORRECT MATCH
      termItem.element.classList.add('matched');
      defItem.element.classList.add('matched');
      termItem.element.classList.remove('selected');
      defItem.element.classList.remove('selected');
      termItem.element.setAttribute('aria-disabled', 'true');
      defItem.element.setAttribute('aria-disabled', 'true');

      gameState.successfullyMatchedTermsThisGame.add(termItem.text);
      gameState.currentGameMatchedWords.add(termItem.text);

      gameState.matchedPairsCount++;
      statusMessage.textContent = 'Correct Match!';
      statusMessage.className = 'status-message success';

      updateGameProgressDisplay(gameState.matchedPairsCount, gameState.mismatchedAttemptsCount);

      if (gameState.matchedPairsCount === gameState.activeFlashcards.length) {
        statusMessage.textContent = "Congratulations! You've matched all pairs!";
        statusMessage.className = 'status-message success large-success';

        const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
        const stopGameButton = document.getElementById('stopGameButton') as HTMLButtonElement;
        generateButton.textContent = 'Play Again?';
        stopGameButton.style.display = 'none';

        // Process all game results after the game ends
        if (processGameResultsCallback) {
          processGameResultsCallback();
        }
      }
      gameState.selectedTerm = null;
      gameState.selectedDefinition = null;
    } else {
      // INCORRECT MATCH
      termItem.element.classList.add('incorrect');
      defItem.element.classList.add('incorrect');
      statusMessage.textContent = 'Incorrect match. Try again.';
      statusMessage.className = 'status-message error';

      if (termItem && originalCardMaster) {
        const termToAdd = termItem.text;
        gameState.currentGameMismatchedWords.add(termToAdd);
        gameState.currentGameMismatchCount++;
        gameState.mismatchedAttemptsCount++;

        if (!gameState.incorrectlyAttemptedTermsThisGameSession.has(termToAdd)) {
          gameState.incorrectlyAttemptedTermsThisGameSession.add(termToAdd);
          console.log(`[SESSION MISMATCH] Added term to incorrectlyAttemptedTermsThisGameSession: "${termToAdd}". Current set:`, Array.from(gameState.incorrectlyAttemptedTermsThisGameSession));
        }
      }

      updateGameProgressDisplay(gameState.matchedPairsCount, gameState.mismatchedAttemptsCount);

      setTimeout(() => {
        termItem.element.classList.remove('incorrect');
        defItem.element.classList.remove('incorrect');
        if (defItem.element.classList.contains('selected')) {
          defItem.element.classList.remove('selected');
        }
        gameState.selectedDefinition = null;
        if (!statusMessage.classList.contains('success')) {
          const currentStatus = statusMessage.textContent;
          if (currentStatus !== 'Correct Match!') {
            statusMessage.textContent = gameState.selectedTerm ? 'Pick a definition.' : 'Select a term.';
            statusMessage.className = 'status-message';
          }
        }
      }, 1200);
    }
  }
}

export function setupGame(
  masterWordList: RawFlashcard[],
  learnedItems: RawFlashcard[],
  selectedCardsPerGame: number,
  gameState: GameState
): Flashcard[] {
  const availableForGame = masterWordList.filter(
    (card) => !learnedItems.some(item => item.term.toLowerCase() === card.term.toLowerCase()),
  );

  if (availableForGame.length < selectedCardsPerGame) {
    throw new Error(`Not enough new words (found ${availableForGame.length}, need ${selectedCardsPerGame}). Add more words or reset learning progress.`);
  }

  let shuffledAvailableCards = shuffleArray(availableForGame);
  let numCardsToTake = Math.min(selectedCardsPerGame, shuffledAvailableCards.length);
  let cardsForThisGameRaw = shuffledAvailableCards.slice(0, numCardsToTake);

  // LEARNED WORD REVIEW FEATURE: 1-in-20 chance to include a learned word for review
  if (learnedItems.length > 0 && Math.random() < LEARNED_WORD_REVIEW_CHANCE) {
    const randomLearnedWord = learnedItems[Math.floor(Math.random() * learnedItems.length)];
    if (cardsForThisGameRaw.length > 0) {
      const randomIndex = Math.floor(Math.random() * cardsForThisGameRaw.length);
      cardsForThisGameRaw[randomIndex] = randomLearnedWord;
      console.log(`[LEARNED REVIEW] Including learned word for review: "${randomLearnedWord.term}"`);
    }
  }

  gameState.currentGameRawFlashcards = [...cardsForThisGameRaw];

  const activeFlashcards = cardsForThisGameRaw.map((card, index) => ({
    ...card,
    id: `card-${index}-${Date.now()}`,
  }));

  gameState.activeFlashcards = activeFlashcards;
  return activeFlashcards;
}

export function processLearnedItemsFromCurrentGame(
  gameState: GameState,
  learnedItems: RawFlashcard[],
  permanentlyMismatchedAttempts: RawFlashcard[],
  learnedWordsSection: HTMLDivElement,
  learnedWordsList: HTMLDivElement,
  mismatchedAttemptsSection: HTMLDivElement,
  updateProgressCallback?: () => void
): boolean {
  let newItemsLearned = false;
  gameState.currentGameRawFlashcards.forEach(card => {
    if (gameState.successfullyMatchedTermsThisGame.has(card.term) &&
      !gameState.incorrectlyAttemptedTermsThisGameSession.has(card.term) &&
      !learnedItems.some(item => item.term.toLowerCase() === card.term.toLowerCase())) {
      learnedItems.push(card);
      newItemsLearned = true;
    }
  });

  if (newItemsLearned) {
    saveLearnedItems(learnedItems);
    removeLearnedWordsFromMismatchedAttempts(learnedItems, permanentlyMismatchedAttempts, mismatchedAttemptsSection);

    if (learnedWordsSection.style.display !== 'none' && !learnedWordsSection.hidden) {
      populateLearnedWordsList(learnedItems, learnedWordsList);
    }

    // Call the progress update callback if provided
    if (updateProgressCallback) {
      updateProgressCallback();
    }
  }

  return newItemsLearned;
}

export function removeLearnedWordsFromMismatchedAttempts(
  learnedItems: RawFlashcard[],
  permanentlyMismatchedAttempts: RawFlashcard[],
  mismatchedAttemptsSection: HTMLDivElement
): boolean {
  let removedAny = false;
  const originalLength = permanentlyMismatchedAttempts.length;

  // Filter out any words that are now in learnedItems
  const filteredAttempts = permanentlyMismatchedAttempts.filter(mismatchedItem =>
    !learnedItems.some(learnedItem =>
      learnedItem.term.toLowerCase() === mismatchedItem.term.toLowerCase()
    )
  );

  if (filteredAttempts.length < originalLength) {
    removedAny = true;
    permanentlyMismatchedAttempts.length = 0;
    permanentlyMismatchedAttempts.push(...filteredAttempts);
    savePermanentlyMismatchedAttempts(permanentlyMismatchedAttempts);

    if (mismatchedAttemptsSection.style.display !== 'none' && !mismatchedAttemptsSection.hidden) {
      populateMismatchedAttemptsList(permanentlyMismatchedAttempts);
    }
  }

  return removedAny;
}

export function processGameResults(
  gameState: GameState,
  masterWordList: RawFlashcard[],
  learnedItems: RawFlashcard[],
  permanentlyMismatchedAttempts: RawFlashcard[],
  mismatchedAttemptsSection: HTMLDivElement,
  learnedWordsSection: HTMLDivElement,
  learnedWordsList: HTMLDivElement,
  updateProgressCallback?: () => void
): void {
  console.log(`[GAME RESULTS] Processing game with ${gameState.currentGameMatchedWords.size} matched words and ${gameState.currentGameMismatchedWords.size} mismatched words`);

  // Process matched words (move from mismatched to learned if they were in mismatched list)
  gameState.currentGameMatchedWords.forEach(termText => {
    const originalCard = masterWordList.find(card => card.term === termText);

    if (originalCard) {
      const mismatchedIndex = permanentlyMismatchedAttempts.findIndex(item =>
        item.term.toLowerCase() === termText.toLowerCase()
      );
      if (mismatchedIndex !== -1) {
        permanentlyMismatchedAttempts.splice(mismatchedIndex, 1);
        console.log(`[GAME RESULTS] Removed "${termText}" from Mismatched Words (was matched correctly)`);
      }
    }
  });

  // Process mismatched words (move from learned to mismatched, add to mismatched if not there)
  gameState.currentGameMismatchedWords.forEach(termText => {
    const originalCard = masterWordList.find(card => card.term === termText);

    if (originalCard) {
      const learnedIndex = learnedItems.findIndex(item =>
        item.term.toLowerCase() === termText.toLowerCase()
      );
      if (learnedIndex !== -1) {
        learnedItems.splice(learnedIndex, 1);
        console.log(`[GAME RESULTS] Removed "${termText}" from learned items (was mismatched)`);
      }

      const alreadyMismatched = permanentlyMismatchedAttempts.some(item =>
        item.term.toLowerCase() === termText.toLowerCase()
      );
      if (!alreadyMismatched) {
        permanentlyMismatchedAttempts.push(originalCard);
        console.log(`[GAME RESULTS] Added "${termText}" to Mismatched Words`);
      }
    }
  });

  saveLearnedItems(learnedItems);
  savePermanentlyMismatchedAttempts(permanentlyMismatchedAttempts);

  if (mismatchedAttemptsSection.style.display !== 'none' && !mismatchedAttemptsSection.hidden) {
    populateMismatchedAttemptsList(permanentlyMismatchedAttempts);
  }
  if (learnedWordsSection.style.display !== 'none' && !learnedWordsSection.hidden) {
    populateLearnedWordsList(learnedItems, learnedWordsList);
  }

  processLearnedItemsFromCurrentGame(gameState, learnedItems, permanentlyMismatchedAttempts, learnedWordsSection, learnedWordsList, mismatchedAttemptsSection, updateProgressCallback);

  // Call the progress update callback if provided
  if (updateProgressCallback) {
    updateProgressCallback();
  }
}
