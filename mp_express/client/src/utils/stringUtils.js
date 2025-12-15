/**
 * Truncate a string to a specified length
 */
export const truncate = (str, length) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) : str;
};

/**
 * Get first N words of a string (splits by spaces)
 */
export const getFirstNWords = (str, n = 4) => {
  if (!str) return '';
  const words = str.trim().split(/\s+/);
  return words.slice(0, n).join(' ');
};

/**
 * Get first N characters of a string
 */
export const getFirstNChars = (str, n = 4) => {
  if (!str) return '';
  return truncate(str, n);
};

/**
 * Truncate client name to first 4 words
 */
export const truncateClientName = (clientName) => {
  return getFirstNWords(clientName, 4);
};
