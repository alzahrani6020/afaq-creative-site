import { head, put } from '@vercel/blob';
import { prisma } from '../lib/prisma';

const MODE = process.env.APPLICANT_BLOB_MIGRATION_MODE || 'off';
const PUBLIC_HOST_SUFFIX = '.public.blob.vercel-storage.com';

function isPublicBlobUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).hostname.endsWith(PUBLIC_HOST_SUFFIX);
  } catch {
    return false;
  }
}

function collectPublicBlobUrls(value: unknown, out = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (isPublicBlobUrl(value)) out.add(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectPublicBlobUrls(item, out);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectPublicBlobUrls(item, out);
    }
  }
  return out;
}

function replaceBlobUrls(value: unknown, mapping: Map<string, string>): unknown {
  if (typeof value === 'string') {
    return mapping.get(value) || value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceBlobUrls(item, mapping));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        replaceBlobUrls(item, mapping),
      ])
    );
  }
  return value;
}

async function copyAndVerify(
  publicUrl: string,
  publicToken: string,
  privateToken: string
): Promise<string> {
  const pathname = decodeURIComponent(new URL(publicUrl).pathname.replace(/^\/+/, ''));
  if (!pathname) throw new Error('PUBLIC_BLOB_PATHNAME_MISSING');

  const sourceMeta = await head(publicUrl, { token: publicToken });
  const sourceSize = Number(sourceMeta.size || 0);
  if (!Number.isFinite(sourceSize) || sourceSize <= 0) {
    throw new Error('PUBLIC_BLOB_SIZE_INVALID');
  }

  const source = await fetch(publicUrl, {
    headers: { Authorization: `Bearer ${publicToken}` },
    cache: 'no-store',
  });
  if (!source.ok || !source.body) {
    throw new Error(`PUBLIC_BLOB_FETCH_FAILED_${source.status}`);
  }

  const copied = await put(pathname, source.body, {
    access: 'private',
    token: privateToken,
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const targetMeta = await head(copied.url, { token: privateToken });
  const targetSize = Number(targetMeta.size || 0);
  if (targetSize !== sourceSize) {
    throw new Error(`BLOB_SIZE_MISMATCH_${sourceSize}_${targetSize}`);
  }

  return copied.url;
}

async function main() {
  if (!['off', 'dry-run', 'execute'].includes(MODE)) {
    throw new Error('APPLICANT_BLOB_MIGRATION_MODE must be off, dry-run, or execute');
  }
  if (MODE === 'off') {
    console.log('APPLICANT_BLOB_MIGRATION: OFF');
    return;
  }

  const publicToken = process.env.BLOB_READ_WRITE_TOKEN;
  const privateToken = process.env.APPLICANT_PRIVATE_BLOB_TOKEN;
  if (!publicToken || !privateToken) {
    throw new Error('Required Blob credentials are not configured');
  }

  const applications = await prisma.talentApplication.findMany({
    where: { attachments: { contains: PUBLIC_HOST_SUFFIX } },
    select: {
      id: true,
      applicationNumber: true,
      attachments: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const allUrls = new Set<string>();
  const parsed: Array<{
    id: string;
    applicationNumber: string;
    updatedAt: Date;
    attachments: unknown;
    urls: string[];
  }> = [];

  for (const application of applications) {
    let attachments: unknown;
    try {
      attachments = JSON.parse(application.attachments || '{}');
    } catch {
      console.error('APPLICANT_BLOB_MIGRATION: invalid attachments JSON', {
        applicationNumber: application.applicationNumber,
      });
      if (MODE === 'execute') throw new Error('INVALID_ATTACHMENTS_JSON');
      continue;
    }
    const urls = Array.from(collectPublicBlobUrls(attachments));
    urls.forEach((url) => allUrls.add(url));
    if (urls.length > 0) {
      parsed.push({
        id: application.id,
        applicationNumber: application.applicationNumber,
        updatedAt: application.updatedAt,
        attachments,
        urls,
      });
    }
  }

  console.log('APPLICANT_BLOB_MIGRATION: inventory', {
    mode: MODE,
    applications: parsed.length,
    uniquePublicBlobs: allUrls.size,
  });

  if (MODE === 'dry-run' || allUrls.size === 0) {
    return;
  }

  const mapping = new Map<string, string>();
  let copied = 0;

  for (const publicUrl of Array.from(allUrls)) {
    const privateUrl = await copyAndVerify(publicUrl, publicToken, privateToken);
    mapping.set(publicUrl, privateUrl);
    copied += 1;
    console.log('APPLICANT_BLOB_MIGRATION: copied', { copied, total: allUrls.size });
  }

  let updatedApplications = 0;
  let conflicts = 0;

  for (const application of parsed) {
    const nextAttachments = replaceBlobUrls(application.attachments, mapping);
    const updated = await prisma.talentApplication.updateMany({
      where: {
        id: application.id,
        updatedAt: application.updatedAt,
      },
      data: {
        attachments: JSON.stringify(nextAttachments),
      },
    });

    if (updated.count === 1) {
      updatedApplications += 1;
      continue;
    }

    conflicts += 1;
    console.error('APPLICANT_BLOB_MIGRATION: concurrency conflict', {
      applicationNumber: application.applicationNumber,
    });
  }

  console.log('APPLICANT_BLOB_MIGRATION: complete', {
    copied,
    updatedApplications,
    conflicts,
    publicBlobsDeleted: 0,
  });

  if (conflicts > 0) {
    throw new Error(`APPLICANT_BLOB_MIGRATION_CONFLICTS_${conflicts}`);
  }
}

main()
  .catch((error) => {
    console.error('APPLICANT_BLOB_MIGRATION: failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
