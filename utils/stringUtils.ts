/**
 * Truncate a string to a specified length
 */
export const truncate = (str: string, length: number): string => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) : str;
};

/**
 * Get first N characters of a string (commonly used for client names)
 */
export const getFirstNChars = (str: string | null | undefined, n: number = 4): string => {
  if (!str) return '';
  return truncate(str, n);
};

/**
 * Truncate client name to first 4 characters
 */
export const truncateClientName = (clientName: string | null | undefined): string => {
  return getFirstNChars(clientName, 4);
};

