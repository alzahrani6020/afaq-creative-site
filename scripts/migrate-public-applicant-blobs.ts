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

const SINGLE_ATTACHMENT_FIELDS = ['profile_photo', 'work_video', 'cv'] as const;
const MULTI_ATTACHMENT_FIELDS = ['work_photos', 'documents'] as const;

async function probePublicBlob(publicUrl: string): Promise<'accessible' | 'missing' | 'unexpected'> {
  const response = await fetch(publicUrl, {
    method: 'HEAD',
    cache: 'no-store',
    redirect: 'manual',
  });
  if (response.ok) return 'accessible';
  if (response.status === 404 || response.status === 410) return 'missing';
  return 'unexpected';
}

function collectKnownAttachmentUrls(attachments: Record<string, any>): Set<string> {
  const urls = new Set<string>();
  for (const field of SINGLE_ATTACHMENT_FIELDS) {
    const value = attachments[field];
    if (isPublicBlobUrl(value)) urls.add(value);
  }
  for (const field of MULTI_ATTACHMENT_FIELDS) {
    const values = Array.isArray(attachments[field]) ? attachments[field] : [];
    for (const value of values) {
      if (isPublicBlobUrl(value)) urls.add(value);
    }
  }
  return urls;
}

function reconcileKnownAttachmentFields(
  source: Record<string, any>,
  mapping: Map<string, string>,
  missing: Set<string>
): { attachments: Record<string, any>; removedMissingRefs: number } {
  const attachments = JSON.parse(JSON.stringify(source || {})) as Record<string, any>;
  const meta = attachments._meta && typeof attachments._meta === 'object'
    ? { ...attachments._meta }
    : {};
  let removedMissingRefs = 0;

  for (const field of SINGLE_ATTACHMENT_FIELDS) {
    const value = attachments[field];
    if (!isPublicBlobUrl(value)) continue;
    const replacement = mapping.get(value);
    if (replacement) {
      attachments[field] = replacement;
      continue;
    }
    if (missing.has(value)) {
      delete attachments[field];
      delete meta[field];
      removedMissingRefs += 1;
      continue;
    }
    throw new Error(`UNRESOLVED_PUBLIC_BLOB_${field}`);
  }

  for (const field of MULTI_ATTACHMENT_FIELDS) {
    const values = Array.isArray(attachments[field]) ? attachments[field] : [];
    const metaItems = Array.isArray(meta[field]) ? meta[field] : [];
    const nextValues: any[] = [];
    const nextMeta: any[] = [];

    for (let index = 0; index < values.length; index += 1) {
      const value = values[index];
      if (!isPublicBlobUrl(value)) {
        nextValues.push(value);
        if (index < metaItems.length) nextMeta.push(metaItems[index]);
        continue;
      }

      const replacement = mapping.get(value);
      if (replacement) {
        nextValues.push(replacement);
        if (index < metaItems.length) nextMeta.push(metaItems[index]);
        continue;
      }

      if (missing.has(value)) {
        removedMissingRefs += 1;
        continue;
      }

      throw new Error(`UNRESOLVED_PUBLIC_BLOB_${field}_${index}`);
    }

    attachments[field] = nextValues;
    meta[field] = nextMeta;
  }

  attachments._meta = meta;
  return { attachments, removedMissingRefs };
}

async function copyAndVerify(
  publicUrl: string,
  privateToken: string
): Promise<string> {
  const pathname = decodeURIComponent(new URL(publicUrl).pathname.replace(/^\/+/, ''));
  if (!pathname) throw new Error('PUBLIC_BLOB_PATHNAME_MISSING');

  const source = await fetch(publicUrl, {
    cache: 'no-store',
  });
  if (!source.ok || !source.body) {
    throw new Error(`PUBLIC_BLOB_FETCH_FAILED_${source.status}`);
  }

  const sourceSizeHeader = source.headers.get('content-length');
  const sourceSize = sourceSizeHeader ? Number(sourceSizeHeader) : null;
  if (sourceSize !== null && (!Number.isFinite(sourceSize) || sourceSize <= 0)) {
    throw new Error('PUBLIC_BLOB_SIZE_INVALID');
  }

  const copied = await put(pathname, source.body, {
    access: 'private',
    token: privateToken,
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const targetMeta = await head(copied.url, { token: privateToken });
  const targetSize = Number(targetMeta.size || 0);
  if (!Number.isFinite(targetSize) || targetSize <= 0) {
    throw new Error('PRIVATE_BLOB_SIZE_INVALID');
  }
  if (sourceSize !== null && targetSize !== sourceSize) {
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

  const privateToken = process.env.APPLICANT_PRIVATE_BLOB_TOKEN;
  if (!privateToken) {
    throw new Error('APPLICANT_PRIVATE_BLOB_TOKEN is not configured');
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

  const accessible = new Set<string>();
  const missing = new Set<string>();
  let unexpected = 0;
  let unsupported = 0;

  for (const publicUrl of Array.from(allUrls)) {
    const status = await probePublicBlob(publicUrl);
    if (status === 'accessible') accessible.add(publicUrl);
    else if (status === 'missing') missing.add(publicUrl);
    else unexpected += 1;
  }

  for (const application of parsed) {
    const known = collectKnownAttachmentUrls(application.attachments as Record<string, any>);
    for (const publicUrl of application.urls) {
      if (!known.has(publicUrl)) unsupported += 1;
    }
  }

  console.log('APPLICANT_BLOB_MIGRATION: inventory', {
    mode: MODE,
    applications: parsed.length,
    uniquePublicBlobs: allUrls.size,
    accessiblePublicBlobs: accessible.size,
    missingPublicBlobs: missing.size,
    unexpectedStatusBlobs: unexpected,
    unsupportedPublicReferences: unsupported,
  });

  if (MODE === 'dry-run' || allUrls.size === 0) {
    return;
  }
  if (unexpected > 0 || unsupported > 0) {
    throw new Error(`MIGRATION_PREFLIGHT_FAILED_unexpected_${unexpected}_unsupported_${unsupported}`);
  }

  const mapping = new Map<string, string>();
  let copied = 0;

  for (const publicUrl of Array.from(accessible)) {
    const privateUrl = await copyAndVerify(publicUrl, privateToken);
    mapping.set(publicUrl, privateUrl);
    copied += 1;
    console.log('APPLICANT_BLOB_MIGRATION: copied', { copied, total: accessible.size });
  }

  let updatedApplications = 0;
  let conflicts = 0;
  let removedMissingRefs = 0;

  for (const application of parsed) {
    const reconciled = reconcileKnownAttachmentFields(
      application.attachments as Record<string, any>,
      mapping,
      missing
    );
    const updated = await prisma.talentApplication.updateMany({
      where: {
        id: application.id,
        updatedAt: application.updatedAt,
      },
      data: {
        attachments: JSON.stringify(reconciled.attachments),
      },
    });

    if (updated.count === 1) {
      updatedApplications += 1;
      removedMissingRefs += reconciled.removedMissingRefs;
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
    removedMissingRefs,
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
