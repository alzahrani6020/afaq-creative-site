import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const uploadDir = process.env.UPLOAD_DIR || './public/uploads';

const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function resolvePath(segments: string[]): string | null {
  const safeBase = path.resolve(uploadDir);
  const requested = path.resolve(safeBase, ...segments);
  // Ensure the requested path is inside the upload directory
  if (!requested.startsWith(safeBase + path.sep) && requested !== safeBase) {
    return null;
  }
  return requested;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

  const { path: pathSegments } = req.query;
  const segments = Array.isArray(pathSegments) ? pathSegments : [pathSegments].filter(Boolean) as string[];
  if (segments.length === 0) {
    return res.status(400).end('Bad Request');
  }

  const filePath = resolvePath(segments);
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return res.status(404).end('Not Found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  // Avoid caching ephemeral files too aggressively on Vercel
  res.setHeader('Cache-Control', 'public, max-age=60');
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
