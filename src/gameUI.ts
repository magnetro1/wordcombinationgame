import { Flashcard } from './types.js';
import { shuffleArray } from './utils.js';
import { pronunciationService } from './pronunciation.js';

/**
 * Game UI and display management
 */

export function displayItems(
  activeFlashcards: Flashcard[],
  termsContainer: HTMLDivElement,
  definitionsContainer: HTMLDivElement,
  gameBoard: HTMLDivElement,
  stopGameButton: HTMLButtonElement,
  handleItemClick: (element: HTMLElement, text: string, type: 'term' | 'definition') => void
): void {
  termsContainer.innerHTML = '';
  definitionsContainer.innerHTML = '';
  gameBoard.style.display = 'flex';
  stopGameButton.style.display = 'inline-block';

  const terms = shuffleArray(activeFlashcards.map((card) => card.term));
  const definitions = shuffleArray(activeFlashcards.map((card) => card.definition));

  terms.forEach((termText) => {
    const itemEl = document.createElement('div');
    itemEl.classList.add('game-item');
    itemEl.dataset['term'] = termText;
    itemEl.setAttribute('role', 'button');
    itemEl.setAttribute('tabindex', '0');

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('game-item-content');

    // Add term text
    const termSpan = document.createElement('span');
    termSpan.textContent = termText;
    termSpan.classList.add('term-text');
    contentWrapper.appendChild(termSpan);

    // Add pronunciation button if supported
    if (pronunciationService.isSupported()) {
      const pronounceBtn = document.createElement('button');
      pronounceBtn.classList.add('pronounce-btn');
      pronounceBtn.textContent = '🔊'; // Speaker icon
      pronounceBtn.title = `Pronounce "${termText}"`;
      pronounceBtn.setAttribute('aria-label', `Pronounce ${termText}`);

      pronounceBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the term selection
        pronunciationService.pronounce(termText);
      });

      contentWrapper.appendChild(pronounceBtn);
    }

    itemEl.appendChild(contentWrapper);

    itemEl.addEventListener('click', () =>
      handleItemClick(itemEl, termText, 'term'),
    );
    itemEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleItemClick(itemEl, termText, 'term');
      }
    });
    termsContainer.appendChild(itemEl);
  });

  definitions.forEach((defText) => {
    const itemEl = document.createElement('div');
    itemEl.classList.add('game-item');
    itemEl.textContent = defText;
    itemEl.dataset['definition'] = defText;
    itemEl.setAttribute('role', 'button');
    itemEl.setAttribute('tabindex', '0');
    itemEl.addEventListener('click', () =>
      handleItemClick(itemEl, defText, 'definition'),
    );
    itemEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleItemClick(itemEl, defText, 'definition');
      }
    });
    definitionsContainer.appendChild(itemEl);
  });
}

export function updateGameProgressDisplay(matchedPairsCount: number, mismatchedAttemptsCount: number): void {
  const progressMatchesSpan = document.querySelector('.progress-matches') as HTMLSpanElement;
  const progressMismatchesSpan = document.querySelector('.progress-mismatches') as HTMLSpanElement;

  if (progressMatchesSpan) {
    progressMatchesSpan.textContent = `Matches: ${matchedPairsCount}`;
  }
  if (progressMismatchesSpan) {
    progressMismatchesSpan.textContent = `Mismatches: ${mismatchedAttemptsCount}`;
  }
}
