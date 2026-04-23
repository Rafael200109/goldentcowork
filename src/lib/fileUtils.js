/**
 * Sanitizes a file name by removing accents, special characters, and converting spaces to underscores.
 * Keeps only letters, numbers, hyphens, and underscores.
 * 
 * @param {string} fileName - The original file name
 * @returns {string} The sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName) return 'file';
  
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? parts.pop() : '';
  const nameWithoutExtension = parts.join('.');
  
  const sanitized = nameWithoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9\-_ ]/g, "") // Remove special chars
    .trim()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .toLowerCase();
    
  return extension ? `${sanitized}.${extension.toLowerCase()}` : sanitized;
};