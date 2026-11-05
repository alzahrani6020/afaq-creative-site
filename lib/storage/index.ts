import { del } from '@vercel/blob';
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

export function isPrivateBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('.private.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

export function getApplicantPrivateBlobToken(): string {
  const token = process.env.APPLICANT_PRIVATE_BLOB_TOKEN;
  if (!token) {
    throw new Error('APPLICANT_PRIVATE_BLOB_TOKEN is not configured');
  }
  return token;
}

export function getStoredFileFetchHeaders(url: string): HeadersInit | undefined {
  if (!isPrivateBlobUrl(url)) return undefined;
  return { Authorization: `Bearer ${getApplicantPrivateBlobToken()}` };
}

/**
 * Extract a storage key/pathname from a persisted attachment URL.
 * Supports local storage and both public/private Vercel Blob URLs.
 */
export function extractStorageKey(url: string): string | null {
  if (!url) return null;

  if (url.startsWith('/uploads/')) {
    return url.slice('/uploads/'.length);
  }

  try {
    const parsed = new URL(url);
    if (
      parsed.hostname.endsWith('.public.blob.vercel-storage.com') ||
      parsed.hostname.endsWith('.private.blob.vercel-storage.com')
    ) {
      return parsed.pathname.slice(1);
    }
  } catch {
    // Not a URL.
  }

  return null;
}

export function isStorageUrl(url: string): boolean {
  return extractStorageKey(url) !== null;
}

/**
 * Delete a persisted storage URL using the credential that owns its store.
 * Public applicant blobs keep using BLOB_READ_WRITE_TOKEN during migration;
 * new private applicant blobs use APPLICANT_PRIVATE_BLOB_TOKEN.
 */
export async function deleteStoredUrl(url: string): Promise<void> {
  if (!url) return;

  if (url.startsWith('/uploads/')) {
    const key = extractStorageKey(url);
    if (key) await localStorage.deleteFile(key);
    return;
  }

  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    return;
  }

  const isPrivate = hostname.endsWith('.private.blob.vercel-storage.com');
  const isPublic = hostname.endsWith('.public.blob.vercel-storage.com');
  if (!isPrivate && !isPublic) return;

  const token = isPrivate
    ? getApplicantPrivateBlobToken()
    : process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(isPrivate
      ? 'APPLICANT_PRIVATE_BLOB_TOKEN is not configured'
      : 'BLOB_READ_WRITE_TOKEN is not configured');
  }

  await del(url, { token });
}
