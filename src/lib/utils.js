import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "@/components/ui/use-toast";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Standardized error handler for Supabase operations.
 * Logs the error and displays a toast notification.
 * @param {Error} error - The error object returned by Supabase or thrown.
 * @param {string} context - A short description of what was being attempted (e.g., "Error loading profile").
 * @returns {Array} - Returns an empty array to safely fallback for list operations.
 */
export function handleSupabaseError(error, context = "Error de operación") {
  if (!error) return [];

  console.error(`[Supabase Error] ${context}:`, error);

  // Log detailed error info if available
  if (error.details || error.hint) {
    console.error(`[Supabase Error Details]`, { details: error.details, hint: error.hint });
  }

  const message = error.message || "Ha ocurrido un error inesperado de conexión.";

  // Prevent spamming toasts for 'AbortError' or cancellations
  if (error.name !== 'AbortError') {
    toast({
      variant: "destructive",
      title: "Error",
      description: `${context}: ${message}`,
      duration: 5000,
    });
  }

  return [];
}

/**
 * Downloads an array of objects as a CSV file.
 * @param {Array<Object>} data - The data to export.
 * @param {string} filename - The name of the file to download.
 */
export function downloadCSV(data, filename) {
  if (!data || !data.length) {
    console.warn("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => headers.map(fieldName => {
      const value = row[fieldName];
      // Handle strings with commas or quotes
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value === null || value === undefined ? '' : value;
    }).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Sanitizes a file name by removing special characters and ensuring safe naming.
 * @param {string} fileName - The original file name.
 * @param {number} maxLength - Maximum length for the name part (excluding extension).
 * @returns {string} - The sanitized file name.
 */
export function sanitizeFileName(fileName, maxLength = 50) {
  if (!fileName) return "";
  
  // Split extension
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? parts.pop() : '';
  const name = parts.join('.');

  // Sanitize name: remove special chars, replace spaces with underscores
  const sanitizedName = name
    .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric with underscore
    .replace(/_{2,}/g, '_')      // Replace multiple underscores with single
    .toLowerCase();

  // Truncate if too long
  const truncatedName = sanitizedName.substring(0, maxLength);

  return extension ? `${truncatedName}.${extension}` : truncatedName;
}