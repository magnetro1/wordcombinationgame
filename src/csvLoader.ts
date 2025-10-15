import { RawFlashcard, CSVParseResult } from './types.js';

/**
 * CSV parsing and loading functionality
 */

export function parseAndLoadCsvContent(
  csvContent: string,
  sourceDescription: string,
  existingMasterWordList: RawFlashcard[]
): CSVParseResult {
  const lines = csvContent.split(/\r\n|\n/);
  let importedCount = 0;
  let skippedCount = 0;
  const newlyAddedWordsThisCall: RawFlashcard[] = [];

  lines.forEach((line, index) => {
    if (index === 0) { // Skip header row
      console.log(`Skipping CSV header row from ${sourceDescription}:`, line);
      return;
    }
    line = line.trim();
    if (!line) return; // Skip empty lines

    const firstCommaIndex = line.indexOf(',');
    if (firstCommaIndex <= 0 || firstCommaIndex === line.length - 1) {
      console.warn(`Skipping malformed CSV line (no valid comma separator) from ${sourceDescription}: ${line}`);
      skippedCount++;
      return;
    }

    let term = line.substring(0, firstCommaIndex).trim();
    let definition = line.substring(firstCommaIndex + 1).trim();

    if (term.startsWith('"') && term.endsWith('"')) {
      term = term.substring(1, term.length - 1);
    }
    term = term.replace(/\"\"/g, '"');

    if (definition.startsWith('"') && definition.endsWith('"')) {
      definition = definition.substring(1, definition.length - 1);
    }
    definition = definition.replace(/\"\"/g, '"');

    if (term && definition) {
      if (!existingMasterWordList.some(item => item.term.toLowerCase() === term.toLowerCase()) &&
        !newlyAddedWordsThisCall.some(item => item.term.toLowerCase() === term.toLowerCase())) {
        newlyAddedWordsThisCall.push({ term, definition });
        importedCount++;
      } else {
        skippedCount++;
      }
    } else {
      console.warn(`Skipping CSV line due to empty term or definition after processing from ${sourceDescription}: ${line}`);
      skippedCount++;
    }
  });

  let mainMessage: string;
  const effectivelyEmpty = lines.every((line, idx) => idx === 0 || line.trim() === '');

  if (importedCount > 0) {
    mainMessage = `${sourceDescription}: ${importedCount} new words added. ${skippedCount} duplicates/invalid.`;
  } else if (effectivelyEmpty) {
    mainMessage = `${sourceDescription}: File is empty or contains only a header.`;
  } else if (skippedCount > 0 || (lines.length > 1 && importedCount === 0)) {
    mainMessage = `${sourceDescription}: No new words added. ${skippedCount} duplicates/invalid found.`;
  } else {
    mainMessage = `${sourceDescription}: No processable words found.`;
  }

  const totalWordsAfterImport = existingMasterWordList.length + importedCount;
  const totalWordsMessage = totalWordsAfterImport > 0 ? `Total words: ${totalWordsAfterImport}.` : null;

  return {
    mainMessage,
    totalWordsMessage,
    importedCount,
    skippedCount,
    success: importedCount > 0,
    newWords: newlyAddedWordsThisCall
  };
}

export async function loadInitialCsvFromDirectory(): Promise<{ content: string; fileName: string } | null> {
  try {
    // Vite specific: import.meta.glob for static analysis at build time
    // Path is relative to project root for /word-csvs/
    const csvFileModules = import.meta.glob('/word-csvs/*.csv', { as: 'raw', eager: false });
    const filePaths = Object.keys(csvFileModules);

    if (filePaths.length === 0) {
      return null;
    }

    let chosenPath: string;
    if (filePaths.length === 1) {
      chosenPath = filePaths[0];
    } else {
      chosenPath = filePaths[Math.floor(Math.random() * filePaths.length)];
    }

    const fileName = chosenPath.substring(chosenPath.lastIndexOf('/') + 1);
    const loader = csvFileModules[chosenPath];
    if (!loader) {
      throw new Error(`Could not find loader for ${chosenPath}`);
    }

    const fileContent = await loader();
    return { content: fileContent, fileName };
  } catch (error) {
    console.error("Error auto-loading CSV from directory:", error);
    throw error;
  }
}
