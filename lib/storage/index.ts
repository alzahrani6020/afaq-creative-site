import { localStorage } from './local';
import { blobStorage } from './blob';
import type { StorageProvider } from './types';

export * from './types';
export { localStorage } from './local';
export { blobStorage } from './blob';

export function getStorage(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  if (provider === 'blob') {
    return blobStorage;
  }
  return localStorage;
}

/**
 * Extract a storage key/pathname from a persisted attachment URL.
 * Supports both local (/uploads/key) and Vercel Blob URLs.
 */
export function extractStorageKey(url: string): string | null {
  if (!url) return null;

  // Local storage: /uploads/{key}
  if (url.startsWith('/uploads/')) {
    return url.slice('/uploads/'.length);
  }

  // Vercel Blob public URL: https://{storeId}.public.blob.vercel-storage.com/{pathname}
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('.public.blob.vercel-storage.com')) {
      return parsed.pathname.slice(1);
    }
  } catch {
    // Not a URL
  }

  return null;
}

/**
 * Determine whether a persisted attachment URL points to a file in storage
 * (as opposed to an external portfolio link).
 */
export function isStorageUrl(url: string): boolean {
  return extractStorageKey(url) !== null;
}
