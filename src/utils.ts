/**
 * Utility functions
 */

/**
 * Shuffles the elements of an array in random order.
 * This function creates a new array with the shuffled elements
 * and does not modify the original array.
 *
 * @template T - The type of elements in the array.
 * @param array - The array to shuffle.
 * @returns A new array with the elements shuffled in random order.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Escapes special HTML characters in a given string to their corresponding HTML entities.
 * This helps prevent issues such as XSS (Cross-Site Scripting) by ensuring that
 * special characters are properly encoded when included in HTML content.
 *
 * The following characters are escaped:
 * - `&` becomes `&amp;`
 * - `<` becomes `&lt;`
 * - `>` becomes `&gt;`
 * - `"` becomes `&quot;`
 * - `'` becomes `&#x27;`
 *
 * @param str - The input string containing potential HTML special characters.
 * @returns The escaped string with HTML entities replacing special characters.
 */
export function escapeHTML(str: string): string {
  return str.replace(/[&<>\\"']/g, function (match) {
    switch (match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#x27;';
      default: return match;
    }
  });
}
