import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { StorageProvider, StoredFile } from './types';

const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
const publicPrefix = process.env.UPLOAD_PUBLIC_PREFIX || '/uploads';

function ensureDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function safeExt(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  // Only allow safe extensions; fallback to .bin if missing/invalid.
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.pdf', '.doc', '.docx'];
  return allowed.includes(ext) ? ext : '';
}

function generateKey(field: string, originalName: string): string {
  const random = crypto.randomBytes(16).toString('hex');
  const ext = safeExt(originalName) || '.bin';
  return `${field}/${random}${ext}`;
}

export const localStorage: StorageProvider = {
  async saveFile({ buffer, originalName, mimeType, field }): Promise<StoredFile> {
    ensureDir();
    const key = generateKey(field, originalName);
    const filePath = path.join(uploadDir, key);
    await fs.promises.writeFile(filePath, buffer);

    return {
      key,
      url: `${publicPrefix}/${key}`,
      originalName: path.basename(originalName),
      mimeType,
      size: buffer.length,
    };
  },

  async saveFromPath({ sourcePath, originalName, mimeType, field }): Promise<StoredFile> {
    ensureDir();
    const key = generateKey(field, originalName);
    const destPath = path.join(uploadDir, key);
    await fs.promises.copyFile(sourcePath, destPath);
    const stats = await fs.promises.stat(destPath);

    return {
      key,
      url: `${publicPrefix}/${key}`,
      originalName: path.basename(originalName),
      mimeType,
      size: stats.size,
    };
  },

  getFileUrl(key: string): string {
    return `${publicPrefix}/${key}`;
  },

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(uploadDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  },
};
