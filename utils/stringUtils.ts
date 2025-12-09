/**
 * Truncate a string to a specified length
 */
export const truncate = (str: string, length: number): string => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) : str;
};

/**
 * Get first N words of a string (splits by spaces)
 */
export const getFirstNWords = (str: string | null | undefined, n: number = 4): string => {
  if (!str) return '';
  const words = str.trim().split(/\s+/);
  return words.slice(0, n).join(' ');
};

/**
 * Get first N characters of a string (commonly used for client names)
 */
export const getFirstNChars = (str: string | null | undefined, n: number = 4): string => {
  if (!str) return '';
  return truncate(str, n);
};

/**
 * Truncate client name to first 4 words
 * Example: "SDA galaxy unit trust LTD BPY" -> "SDA galaxy unit trust"
 */
export const truncateClientName = (clientName: string | null | undefined): string => {
  return getFirstNWords(clientName, 4);
};

