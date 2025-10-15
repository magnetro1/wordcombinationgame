import { RawFlashcard } from './types.js';
import { escapeHTML } from './utils.js';
import { pronunciationService } from './pronunciation.js';

/**
 * Functions for managing and displaying word lists
 */

export function populateLearnedWordsList(
  learnedItems: RawFlashcard[],
  learnedWordsList: HTMLDivElement
): void {
  learnedWordsList.innerHTML = '';
  if (learnedItems.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No learned words yet. Match words correctly without mistakes to add them here.';
    p.style.color = 'var(--light-text-secondary)';
    learnedWordsList.appendChild(p);
    return;
  }

  const ul = document.createElement('ul');
  ul.classList.add('word-list');

  learnedItems.sort((a, b) => a.term.localeCompare(b.term)).forEach(item => {
    const li = document.createElement('li');
    li.classList.add('word-list-item');

    // Create content wrapper
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('word-item-content');

    // Add term and definition
    const textSpan = document.createElement('span');
    textSpan.innerHTML = `<strong>${escapeHTML(item.term)}</strong>: ${escapeHTML(item.definition)}`;
    contentDiv.appendChild(textSpan);

    // Add pronunciation button if supported
    if (pronunciationService.isSupported()) {
      const pronounceBtn = document.createElement('button');
      pronounceBtn.classList.add('pronounce-btn', 'dictionary-pronounce');
      pronounceBtn.textContent = '🔊'; // Speaker icon
      pronounceBtn.title = `Pronounce "${item.term}"`;
      pronounceBtn.setAttribute('aria-label', `Pronounce ${item.term}`);

      pronounceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pronunciationService.pronounce(item.term);
      });

      contentDiv.appendChild(pronounceBtn);
    }

    li.appendChild(contentDiv);
    ul.appendChild(li);
  });
  learnedWordsList.appendChild(ul);
}

export function populateMasterListDisplay(
  masterWordList: RawFlashcard[],
  masterListDisplay: HTMLDivElement
): void {
  masterListDisplay.innerHTML = '';
  if (masterWordList.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No words imported yet. Import a CSV file to see all your words here.';
    p.style.color = 'var(--light-text-secondary)';
    masterListDisplay.appendChild(p);
    return;
  }

  const ul = document.createElement('ul');
  ul.classList.add('word-list');

  // Sort for consistency, e.g., by term
  [...masterWordList].sort((a, b) => a.term.localeCompare(b.term)).forEach(item => {
    const li = document.createElement('li');
    li.classList.add('word-list-item');

    // Create content wrapper
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('word-item-content');

    // Add term and definition
    const textSpan = document.createElement('span');
    textSpan.innerHTML = `<strong>${escapeHTML(item.term)}</strong>: ${escapeHTML(item.definition)}`;
    contentDiv.appendChild(textSpan);

    // Add pronunciation button if supported
    if (pronunciationService.isSupported()) {
      const pronounceBtn = document.createElement('button');
      pronounceBtn.classList.add('pronounce-btn', 'dictionary-pronounce');
      pronounceBtn.textContent = '🔊'; // Speaker icon
      pronounceBtn.title = `Pronounce "${item.term}"`;
      pronounceBtn.setAttribute('aria-label', `Pronounce ${item.term}`);

      pronounceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pronunciationService.pronounce(item.term);
      });

      contentDiv.appendChild(pronounceBtn);
    }

    li.appendChild(contentDiv);
    ul.appendChild(li);
  });
  masterListDisplay.appendChild(ul);
}

export function populateMismatchedAttemptsList(
  permanentlyMismatchedAttempts: RawFlashcard[]
): void {
  const mismatchedAttemptsListElement = document.getElementById('mismatched-attempts-list');
  if (!mismatchedAttemptsListElement) {
    console.error('mismatchedAttemptsListElement not found');
    return;
  }

  mismatchedAttemptsListElement.innerHTML = '';

  console.log("Populating Mismatched Words. Current permanentlyMismatchedAttempts:", permanentlyMismatchedAttempts);

  if (permanentlyMismatchedAttempts.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No mismatched words yet. Words you match incorrectly will appear here for review.';
    p.style.color = 'var(--light-text-secondary)';
    mismatchedAttemptsListElement.appendChild(p);
  } else {
    const ul = document.createElement('ul');
    ul.classList.add('word-list');

    // Sort for consistency
    [...permanentlyMismatchedAttempts].sort((a, b) => a.term.localeCompare(b.term)).forEach(item => {
      const li = document.createElement('li');
      li.classList.add('word-list-item');

      // Create content wrapper
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('word-item-content');

      // Add term and definition
      const textSpan = document.createElement('span');
      textSpan.innerHTML = `<strong>${escapeHTML(item.term)}</strong>: ${escapeHTML(item.definition)}`;
      contentDiv.appendChild(textSpan);

      // Add pronunciation button if supported
      if (pronunciationService.isSupported()) {
        const pronounceBtn = document.createElement('button');
        pronounceBtn.classList.add('pronounce-btn', 'dictionary-pronounce');
        pronounceBtn.textContent = '🔊'; // Speaker icon
        pronounceBtn.title = `Pronounce "${item.term}"`;
        pronounceBtn.setAttribute('aria-label', `Pronounce ${item.term}`);

        pronounceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          pronunciationService.pronounce(item.term);
        });

        contentDiv.appendChild(pronounceBtn);
      }

      li.appendChild(contentDiv);
      ul.appendChild(li);
    });
    mismatchedAttemptsListElement.appendChild(ul);
  }
}
