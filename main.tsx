import { RawFlashcard } from './src/types.ts';
import { MIN_CARDS_FOR_GAME } from './src/constants.ts';
import {
  loadMasterWordList,
  saveMasterWordList,
  loadLearnedItems,
  saveLearnedItems,
  loadPermanentlyMismatchedAttempts,
  savePermanentlyMismatchedAttempts
} from './src/storage.ts';
import { parseAndLoadCsvContent, /*loadInitialCsvFromDirectory*/ } from './src/csvLoader.ts';
import { displayItems, updateGameProgressDisplay } from './src/gameUI.ts';
import { populateLearnedWordsList, populateMasterListDisplay, populateMismatchedAttemptsList } from './src/wordLists.ts';
// import { pronunciationService } from './src/pronunciation.ts';
import {
  createGameState,
  resetGameState,
  handleItemClick,
  checkMatch,
  setupGame,
  processLearnedItemsFromCurrentGame,
  processGameResults,
  GameState
} from './src/gameLogic.ts';

// DOM elements
const csvFileInput = document.getElementById('csvFileInput') as HTMLInputElement;
const importCsvButton = document.getElementById('importCsvButton') as HTMLButtonElement;
const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
const termsContainer = document.getElementById('termsContainer') as HTMLDivElement;
const definitionsContainer = document.getElementById('definitionsContainer') as HTMLDivElement;
const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;
const gameBoard = document.getElementById('gameBoard') as HTMLDivElement;
const toggleLearnedWordsButton = document.getElementById('toggleLearnedWordsButton') as HTMLButtonElement;
const resetLearnedItemsButton = document.getElementById('resetLearnedItemsButton') as HTMLButtonElement;
const learnedWordsSection = document.getElementById('learnedWordsSection') as HTMLDivElement;
const learnedWordsList = document.getElementById('learnedWordsList') as HTMLDivElement;
const stopGameButton = document.getElementById('stopGameButton') as HTMLButtonElement;
const resetDatabaseButton = document.getElementById('resetDatabaseButton') as HTMLButtonElement;
const currentYearSpan = document.getElementById('currentYear') as HTMLSpanElement;
const toggleMasterListButton = document.getElementById('toggleMasterListButton') as HTMLButtonElement;
const masterListSection = document.getElementById('masterListSection') as HTMLDivElement;
const masterListDisplay = document.getElementById('masterListDisplay') as HTMLDivElement;
const cardsPerGameSelect = document.getElementById('cardsPerGameSelect') as HTMLSelectElement;
const toggleMismatchedAttemptsButton = document.getElementById('toggleMismatchedAttemptsButton') as HTMLButtonElement;
const mismatchedAttemptsSection = document.getElementById('mismatchedAttemptsSection') as HTMLDivElement;
const importSection = document.getElementById('importSection') as HTMLDivElement;
const introText = document.getElementById('introText') as HTMLParagraphElement;

// Overall progress display elements
const overallProgressDisplay = document.getElementById('overallProgressDisplay') as HTMLDivElement;
const learnedCountSpan = document.getElementById('learnedCount') as HTMLSpanElement;
const totalWordsCountSpan = document.getElementById('totalWordsCount') as HTMLSpanElement;
const learnedProgressBar = document.getElementById('learnedProgressBar') as HTMLDivElement;
const learnedPercentageSpan = document.getElementById('learnedPercentage') as HTMLSpanElement;
const mismatchedCountSpan = document.getElementById('mismatchedCount') as HTMLSpanElement;
const mismatchedMessageSpan = document.getElementById('mismatchedMessage') as HTMLSpanElement;

// Game state
const gameState: GameState = createGameState();

// Data
let masterWordList: RawFlashcard[] = [];
let learnedItems: RawFlashcard[] = [];
let permanentlyMismatchedAttempts: RawFlashcard[] = [];

// Initialize data
masterWordList = loadMasterWordList();
learnedItems = loadLearnedItems();
permanentlyMismatchedAttempts = loadPermanentlyMismatchedAttempts();

// Helper functions
function canGenerateGame(): boolean {
  const selectedCardsPerGame = parseInt(cardsPerGameSelect.value, 10);
  return masterWordList.length >= selectedCardsPerGame;
}

function resetGameUIAndState(): void {
  resetGameState(gameState);
  updateGameProgressDisplay(gameState.matchedPairsCount, gameState.mismatchedAttemptsCount);

  termsContainer.innerHTML = '';
  definitionsContainer.innerHTML = '';
  gameBoard.style.display = 'none';
  stopGameButton.style.display = 'none';

  const progressDisplay = document.getElementById('gameProgressDisplay');
  if (progressDisplay) {
    progressDisplay.style.display = 'none';
  }

  generateButton.textContent = 'Generate Game';
  generateButton.disabled = !canGenerateGame();
}

// Overall progress tracking functions
function updateOverallProgress(): void {
  const totalWords = masterWordList.length;
  const learnedWords = learnedItems.length;
  const mismatchedWords = permanentlyMismatchedAttempts.length;

  if (totalWords === 0) {
    overallProgressDisplay.style.display = 'none';
    return;
  }

  // Show the overall progress display
  overallProgressDisplay.style.display = 'block';

  // Update learned progress
  learnedCountSpan.textContent = learnedWords.toString();
  totalWordsCountSpan.textContent = totalWords.toString();

  const learnedPercentage = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;
  learnedPercentageSpan.textContent = `${learnedPercentage}%`;
  learnedProgressBar.style.width = `${learnedPercentage}%`;

  // Update mismatched count and message
  mismatchedCountSpan.textContent = mismatchedWords.toString();

  if (mismatchedWords === 0) {
    mismatchedMessageSpan.textContent = 'All caught up!';
    mismatchedMessageSpan.className = '';
  } else {
    mismatchedMessageSpan.textContent = `${mismatchedWords} word${mismatchedWords > 1 ? 's' : ''} incorrect`;
    mismatchedMessageSpan.className = 'has-mismatched';
  }

  // Show motivational messages based on progress
  if (learnedPercentage === 100 && mismatchedWords === 0) {
    const motivationalMsg = document.createElement('div');
    motivationalMsg.style.textAlign = 'center';
    motivationalMsg.style.marginTop = '10px';
    motivationalMsg.style.fontWeight = '500';
    motivationalMsg.style.color = 'var(--light-success)'; motivationalMsg.textContent = 'Congratulations! You\'ve mastered all words!';

    // Remove any existing motivational message
    const existingMsg = overallProgressDisplay.querySelector('.motivational-message');
    if (existingMsg) {
      existingMsg.remove();
    }

    motivationalMsg.className = 'motivational-message';
    overallProgressDisplay.appendChild(motivationalMsg);
  } else {
    // Remove motivational message if not complete
    const existingMsg = overallProgressDisplay.querySelector('.motivational-message');
    if (existingMsg) {
      existingMsg.remove();
    }
  }
}

function showProgressSummary(): void {
  const totalWords = masterWordList.length;
  const learnedWords = learnedItems.length;
  const mismatchedWords = permanentlyMismatchedAttempts.length;
  const unlearnedWords = totalWords - learnedWords;

  if (totalWords === 0) return; let summaryMsg = `Progress Summary: ${learnedWords}/${totalWords} words learned (${Math.round((learnedWords / totalWords) * 100)}%)`;

  if (mismatchedWords > 0) {
    summaryMsg += ` - ${mismatchedWords} word${mismatchedWords > 1 ? 's' : ''} incorrect`;
  }

  if (unlearnedWords > 0) {
    summaryMsg += ` - ${unlearnedWords} word${unlearnedWords > 1 ? 's' : ''} remaining`;
  }

  statusMessage.textContent = summaryMsg;
  statusMessage.className = 'status-message';
}

// Event handlers
function handleItemClickWrapper(element: HTMLElement, text: string, type: 'term' | 'definition'): void {
  handleItemClick(element, text, type, gameState, statusMessage, () => {
    checkMatch(gameState, masterWordList, statusMessage, () => {
      // Process game results when game is completed
      processGameResults(
        gameState,
        masterWordList,
        learnedItems,
        permanentlyMismatchedAttempts,
        mismatchedAttemptsSection,
        learnedWordsSection,
        learnedWordsList,
        updateOverallProgress // Pass callback to update progress
      );
      showProgressSummary(); // Show summary in status message
    });
  });
}

// CSV Import functionality
importCsvButton.addEventListener('click', async () => {
  const file = csvFileInput.files?.[0];
  if (!file) {
    statusMessage.textContent = "Please select a CSV file first. 📁";
    statusMessage.className = 'status-message error';
    return;
  }

  statusMessage.textContent = "Importing CSV...";
  statusMessage.className = 'status-message';
  importCsvButton.disabled = true;
  generateButton.disabled = true;
  csvFileInput.disabled = true;

  try {
    const fileContent = await file.text();
    const result = parseAndLoadCsvContent(fileContent, `Imported from ${file.name}`, masterWordList);

    if (result.success) {
      masterWordList.push(...result.newWords);
      saveMasterWordList(masterWordList);
      updateOverallProgress(); // Update progress after importing words
    }

    statusMessage.innerHTML = '';
    const mainMessageSpan = document.createElement('span');
    mainMessageSpan.textContent = result.mainMessage;
    statusMessage.appendChild(mainMessageSpan);

    if (result.totalWordsMessage) {
      const totalWordsSpan = document.createElement('span');
      totalWordsSpan.textContent = result.totalWordsMessage;
      totalWordsSpan.style.display = 'block';
      totalWordsSpan.style.color = 'green';
      statusMessage.appendChild(totalWordsSpan);
    }

    statusMessage.className = result.success ? 'status-message success' : 'status-message';
    csvFileInput.value = '';

  } catch (error) {
    console.error("Error importing CSV:", error);
    statusMessage.textContent = "Error importing CSV file. Please ensure it's a valid CSV.";
    statusMessage.className = 'status-message error';
  } finally {
    importCsvButton.disabled = false;
    csvFileInput.disabled = false;
    generateButton.disabled = !canGenerateGame();
  }
});

// Auto-load CSV from directory (DISABLED - users must import their own CSV files)
async function handleInitialCsvLoad(): Promise<void> {
  csvFileInput.disabled = false;
  importCsvButton.disabled = false;

  statusMessage.textContent = "Import your CSV file to get started. Format: Term,Definition";
  statusMessage.className = 'status-message';

  // Auto-loading disabled to keep word lists private
  return;

  /*
  try {
    const csvData = await loadInitialCsvFromDirectory();

    if (!csvData) {
      statusMessage.textContent = "No local CSVs found in 'word-csvs'. Use 'Import Words from CSV' to load your own.";
      return;
    }

    statusMessage.textContent = `Loading initial words from ${csvData.fileName}...`;
    const result = parseAndLoadCsvContent(csvData.content, `Auto-loaded from ${csvData.fileName}`, masterWordList);

    if (result.success) {
      masterWordList.push(...result.newWords);
      saveMasterWordList(masterWordList);
      updateOverallProgress(); // Update progress after auto-loading words
    }

    statusMessage.innerHTML = '';
    const mainMessageSpanAuto = document.createElement('span');
    mainMessageSpanAuto.textContent = result.mainMessage;
    statusMessage.appendChild(mainMessageSpanAuto);

    if (result.totalWordsMessage) {
      const totalWordsSpanAuto = document.createElement('span');
      totalWordsSpanAuto.textContent = result.totalWordsMessage;
      totalWordsSpanAuto.style.display = 'block';
      totalWordsSpanAuto.style.color = 'green';
      statusMessage.appendChild(totalWordsSpanAuto);
    }
    statusMessage.className = result.success ? 'status-message success' : 'status-message';

  } catch (error) {
    console.error("Error auto-loading CSV from directory:", error);
    statusMessage.textContent = "Could not auto-load CSV from 'word-csvs' directory. Please use manual import.";
    statusMessage.className = 'status-message error';
  } finally {
    csvFileInput.disabled = false;
    importCsvButton.disabled = false;
    generateButton.disabled = !canGenerateGame();
  }
}
*/
}

// Generate game
generateButton.addEventListener('click', () => {
  if (gameState.matchedPairsCount > 0 && gameState.matchedPairsCount < gameState.activeFlashcards.length) {
    processLearnedItemsFromCurrentGame(
      gameState,
      learnedItems,
      permanentlyMismatchedAttempts,
      learnedWordsSection,
      learnedWordsList,
      mismatchedAttemptsSection,
      updateOverallProgress // Pass callback to update progress
    );
  } else if (gameState.matchedPairsCount === gameState.activeFlashcards.length && gameState.activeFlashcards.length > 0) {
    // Game was completed, process all results
    processGameResults(
      gameState,
      masterWordList,
      learnedItems,
      permanentlyMismatchedAttempts,
      mismatchedAttemptsSection,
      learnedWordsSection,
      learnedWordsList,
      updateOverallProgress // Pass callback to update progress
    );
  }

  if (masterWordList.length === 0) {
    statusMessage.textContent = 'Your word list is empty. Please import a CSV file.';
    statusMessage.className = 'status-message error';
    resetGameUIAndState();
    generateButton.disabled = true;
    return;
  }

  const selectedCardsPerGame = parseInt(cardsPerGameSelect.value, 10);

  if (masterWordList.length < selectedCardsPerGame) {
    statusMessage.textContent = `You have ${masterWordList.length} words. Need at least ${selectedCardsPerGame} to generate a game. Please import more.`;
    statusMessage.className = 'status-message error';
    resetGameUIAndState();
    generateButton.disabled = false;
    return;
  }

  statusMessage.textContent = 'Setting up game...';
  statusMessage.className = 'status-message';
  generateButton.disabled = true;
  generateButton.textContent = 'Setting up...';

  resetGameState(gameState);
  updateGameProgressDisplay(gameState.matchedPairsCount, gameState.mismatchedAttemptsCount);

  gameBoard.style.display = 'none';

  try {
    setupGame(masterWordList, learnedItems, selectedCardsPerGame, gameState);
    displayItems(gameState.activeFlashcards, termsContainer, definitionsContainer, gameBoard, stopGameButton, handleItemClickWrapper);
    statusMessage.textContent = 'Game ready! 🎉 Select a term.';
    statusMessage.className = 'status-message';
    importSection.style.display = 'none';
    introText.style.display = 'none';

  } catch (error: unknown) {
    console.error('Error setting up game:', error);
    const detailedError = (error as Error)?.message || 'An unknown error occurred';
    statusMessage.textContent = detailedError;
    statusMessage.className = 'status-message error';
    resetGameUIAndState();
  } finally {
    generateButton.disabled = false;
    if (generateButton.textContent === "Setting up...") {
      generateButton.textContent = 'Generate Game';
    }
  }
});

// Cards per game selection change
cardsPerGameSelect.addEventListener('change', () => {
  generateButton.disabled = !canGenerateGame();

  const selectedCardsPerGame = parseInt(cardsPerGameSelect.value, 10);
  if (masterWordList.length > 0 && masterWordList.length < selectedCardsPerGame) {
    statusMessage.textContent = `You have ${masterWordList.length} words. Need at least ${selectedCardsPerGame} to generate a game.`;
    statusMessage.className = 'status-message';
  } else if (masterWordList.length >= selectedCardsPerGame) {
    statusMessage.textContent = `Ready to play with ${selectedCardsPerGame} cards per game!`;
    statusMessage.className = 'status-message';
  }
});

// Stop game
stopGameButton.addEventListener('click', () => {
  // Process game results before stopping to capture any mismatched words
  if (gameState.activeFlashcards.length > 0) {
    processGameResults(
      gameState,
      masterWordList,
      learnedItems,
      permanentlyMismatchedAttempts,
      mismatchedAttemptsSection,
      learnedWordsSection,
      learnedWordsList,
      updateOverallProgress // Pass callback to update progress
    );
  }

  resetGameUIAndState();
  statusMessage.textContent = 'Game stopped. 🛑 Ready to generate a new game or import words.';
  statusMessage.className = 'status-message';
  importSection.style.display = 'flex';
  introText.style.display = 'block';
});

// Toggle sections
toggleLearnedWordsButton.addEventListener('click', () => {
  const isHidden = learnedWordsSection.style.display === 'none' || learnedWordsSection.hidden;
  if (isHidden) {
    learnedWordsSection.style.display = 'block';
    learnedWordsSection.hidden = false;
    toggleLearnedWordsButton.textContent = 'Hide Learned Words';
    toggleLearnedWordsButton.setAttribute('aria-expanded', 'true');
    populateLearnedWordsList(learnedItems, learnedWordsList);
  } else {
    learnedWordsSection.style.display = 'none';
    learnedWordsSection.hidden = true;
    toggleLearnedWordsButton.textContent = 'Show Learned Words';
    toggleLearnedWordsButton.setAttribute('aria-expanded', 'false');
  }
});

toggleMismatchedAttemptsButton.addEventListener('click', () => {
  const isHidden = mismatchedAttemptsSection.style.display === 'none' || mismatchedAttemptsSection.hidden;
  if (isHidden) {
    mismatchedAttemptsSection.style.display = 'block';
    mismatchedAttemptsSection.hidden = false;
    toggleMismatchedAttemptsButton.textContent = 'Hide Mismatched Words';
    toggleMismatchedAttemptsButton.setAttribute('aria-expanded', 'true');
    populateMismatchedAttemptsList(permanentlyMismatchedAttempts);
  } else {
    mismatchedAttemptsSection.style.display = 'none';
    mismatchedAttemptsSection.hidden = true;
    toggleMismatchedAttemptsButton.textContent = 'Show Mismatched Words';
    toggleMismatchedAttemptsButton.setAttribute('aria-expanded', 'false');
  }
});

toggleMasterListButton.addEventListener('click', () => {
  const isHidden = masterListSection.style.display === 'none' || masterListSection.hidden;
  if (isHidden) {
    masterListSection.style.display = 'block';
    masterListSection.hidden = false;
    toggleMasterListButton.textContent = 'Hide Full Dictionary';
    toggleMasterListButton.setAttribute('aria-expanded', 'true');
    populateMasterListDisplay(masterWordList, masterListDisplay);
  } else {
    masterListSection.style.display = 'none';
    masterListSection.hidden = true;
    toggleMasterListButton.textContent = 'Show Full Dictionary';
    toggleMasterListButton.setAttribute('aria-expanded', 'false');
  }
});

// Reset functions
resetLearnedItemsButton.addEventListener('click', () => {
  const confirmed = confirm("Are you sure you want to reset your learned words progress? This action cannot be undone.");
  if (confirmed) {
    learnedItems.length = 0;
    saveLearnedItems(learnedItems);
    gameState.successfullyMatchedTermsThisGame.clear();

    if (gameBoard.style.display === 'flex') {
      resetGameUIAndState();
      statusMessage.textContent = "Learning progress reset. Generate a new game or import words.";
    } else {
      statusMessage.textContent = "Learning progress has been reset.";
    }

    generateButton.textContent = 'Generate Game';
    generateButton.disabled = !canGenerateGame();

    if (learnedWordsSection.style.display !== 'none' && !learnedWordsSection.hidden) {
      populateLearnedWordsList(learnedItems, learnedWordsList);
    }
    updateOverallProgress(); // Update progress after reset
    statusMessage.className = 'status-message success';
  }
});

resetDatabaseButton.addEventListener('click', () => {
  const confirmed = confirm("Are you sure you want to reset ALL imported words and learning progress? This action cannot be undone.");
  if (confirmed) {
    masterWordList.length = 0;
    learnedItems.length = 0;
    permanentlyMismatchedAttempts.length = 0;

    saveMasterWordList(masterWordList);
    saveLearnedItems(learnedItems);
    savePermanentlyMismatchedAttempts(permanentlyMismatchedAttempts);

    resetGameUIAndState();

    if (learnedWordsSection.style.display !== 'none' && !learnedWordsSection.hidden) {
      populateLearnedWordsList(learnedItems, learnedWordsList);
    }
    if (mismatchedAttemptsSection.style.display !== 'none' && !mismatchedAttemptsSection.hidden) {
      populateMismatchedAttemptsList(permanentlyMismatchedAttempts);
    }

    updateOverallProgress(); // Update progress after database reset
    statusMessage.textContent = "All imported words, learning progress, and Mismatched Words have been reset. Please import a CSV file.";
    statusMessage.className = 'status-message success';
    generateButton.disabled = true;
    importSection.style.display = 'flex';
    introText.style.display = 'block';
  }
});

// Initial setup
if (currentYearSpan) {
  currentYearSpan.textContent = new Date().getFullYear().toString();
}

csvFileInput.disabled = false;
importCsvButton.disabled = false;
generateButton.disabled = true;

if (masterWordList.length >= MIN_CARDS_FOR_GAME) {
  generateButton.disabled = false;
  statusMessage.textContent = `Loaded ${masterWordList.length} words from storage. Ready to play.`;
  updateOverallProgress(); // Show initial progress
} else if (masterWordList.length > 0) {
  statusMessage.textContent = `Loaded ${masterWordList.length} words from storage. Need at least ${MIN_CARDS_FOR_GAME} to play.`;
  updateOverallProgress(); // Show initial progress
} else {
  statusMessage.textContent = "Import a CSV or place one in 'word-csvs' to begin.";
}

// Initial UI state
gameBoard.style.display = 'none';
stopGameButton.style.display = 'none';
generateButton.textContent = 'Generate Game';

learnedWordsSection.style.display = 'none';
learnedWordsSection.hidden = true;
toggleLearnedWordsButton.setAttribute('aria-expanded', 'false');

if (mismatchedAttemptsSection) {
  mismatchedAttemptsSection.style.display = 'none';
  mismatchedAttemptsSection.hidden = true;
}
if (toggleMismatchedAttemptsButton) {
  toggleMismatchedAttemptsButton.textContent = 'Show Mismatched Words';
  toggleMismatchedAttemptsButton.setAttribute('aria-expanded', 'false');
}

if (masterListSection) {
  masterListSection.style.display = 'none';
  masterListSection.hidden = true;
}
if (toggleMasterListButton) {
  toggleMasterListButton.setAttribute('aria-expanded', 'false');
}

// Load initial CSV after setup
handleInitialCsvLoad();
