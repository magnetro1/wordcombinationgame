import { RawFlashcard } from './types.js';
import {
  LOCAL_STORAGE_LEARNED_ITEMS_KEY,
  LOCAL_STORAGE_MASTER_LIST_KEY,
  LOCAL_STORAGE_MISMATCHED_ATTEMPTS_KEY
} from './constants.js';

/**
 * Storage management for game data
 */

export function loadMasterWordList(): RawFlashcard[] {
  try {
    const storedMasterList = localStorage.getItem(LOCAL_STORAGE_MASTER_LIST_KEY);
    if (storedMasterList) {
      const itemsArray = JSON.parse(storedMasterList);
      if (Array.isArray(itemsArray)) {
        return itemsArray.filter(item => typeof item.term === 'string' && typeof item.definition === 'string');
      }
    }
  } catch (error) {
    console.error('Error loading master word list from localStorage:', error);
  }
  return [];
}

export function saveMasterWordList(masterWordList: RawFlashcard[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_MASTER_LIST_KEY, JSON.stringify(masterWordList));
  } catch (error) {
    console.error('Error saving master word list to localStorage:', error);
  }
}

export function loadLearnedItems(): RawFlashcard[] {
  try {
    const storedItems = localStorage.getItem(LOCAL_STORAGE_LEARNED_ITEMS_KEY);
    if (storedItems) {
      const itemsArray = JSON.parse(storedItems);
      if (Array.isArray(itemsArray)) {
        return itemsArray.filter(item => typeof item.term === 'string' && typeof item.definition === 'string');
      }
    }
  } catch (error) {
    console.error('Error loading learned items from localStorage:', error);
  }
  return [];
}

export function saveLearnedItems(learnedItems: RawFlashcard[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_LEARNED_ITEMS_KEY, JSON.stringify(learnedItems));
  } catch (error) {
    console.error('Error saving learned items to localStorage:', error);
  }
}

export function loadPermanentlyMismatchedAttempts(): RawFlashcard[] {
  try {
    const storedItems = localStorage.getItem(LOCAL_STORAGE_MISMATCHED_ATTEMPTS_KEY);
    if (storedItems) {
      const itemsArray = JSON.parse(storedItems);
      if (Array.isArray(itemsArray)) {
        return itemsArray.filter(item => typeof item.term === 'string' && typeof item.definition === 'string');
      }
    }
  } catch (error) {
    console.error('Error loading Mismatched Words from localStorage:', error);
  }
  return [];
}

export function savePermanentlyMismatchedAttempts(permanentlyMismatchedAttempts: RawFlashcard[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_MISMATCHED_ATTEMPTS_KEY, JSON.stringify(permanentlyMismatchedAttempts));
  } catch (error) {
    console.error('Error saving Mismatched Words to localStorage:', error);
  }
}
