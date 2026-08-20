/**
 * Normalizes and resolves a book cover image URL from the backend.
 */
export function getBookImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }

  const trimmed = imageUrl.trim();

  // If full external URL or data URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // If path starts with /uploads/ or similar relative path
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed}`;
}
