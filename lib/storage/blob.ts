import { put, del, head } from '@vercel/blob';
import { StorageProvider, StoredFile } from './types';
import crypto from 'crypto';
import path from 'path';

function safeExt(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.pdf', '.doc', '.docx'];
  return allowed.includes(ext) ? ext : '';
}

function generateKey(field: string, originalName: string): string {
  const random = crypto.randomBytes(16).toString('hex');
  const ext = safeExt(originalName) || '.bin';
  return `${field}/${random}${ext}`;
}

function getToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }
  return token;
}

export const blobStorage: StorageProvider = {
  async saveFile({ buffer, originalName, mimeType, field }): Promise<StoredFile> {
    const token = getToken();
    const key = generateKey(field, originalName);
    const blob = await put(key, buffer, {
      access: 'public',
      contentType: mimeType,
      token,
    });

    return {
      key: blob.pathname,
      url: blob.url,
      originalName: path.basename(originalName),
      mimeType,
      size: buffer.length,
    };
  },

  async saveFromPath({ sourcePath, originalName, mimeType, field }): Promise<StoredFile> {
    throw new Error('saveFromPath is not supported for blob storage');
  },

  getFileUrl(key: string): string {
    // Blob URLs are absolute and stored at save time.
    // This helper is mainly for local compatibility.
    return key.startsWith('http') ? key : `https://${process.env.VERCEL_BLOB_STORE_ID || ''}.public.blob.vercel-storage.com/${key}`;
  },

  async deleteFile(key: string): Promise<void> {
    const token = getToken();
    // Accept either a full public URL or a pathname.
    const pathname = key.startsWith('http') ? new URL(key).pathname.slice(1) : key;
    if (!pathname) return;
    try {
      await del(pathname, { token });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Log but do not throw; deletion failures should not break core flows.
      console.error('Blob delete failed:', { pathname, error: message });
    }
  },
};
