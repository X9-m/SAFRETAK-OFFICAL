import { access, mkdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const outputDirectory = path.resolve('public/media');
const forceRefresh = process.env.SAFRETAK_REFRESH_MEDIA === '1';
const timeoutMs = 15_000;
const maxBytes = 8 * 1024 * 1024;

const unsplash = (photoId, width) =>
  `https://images.unsplash.com/photo-${photoId}?fit=crop&w=${width}&q=82&fm=jpg`;

const assets = [
  ['office-dallas-cover.jpg', unsplash('1548786811-dd6e453ccca7', 1600)],
  ['office-plaza-cover.jpg', unsplash('1572252009286-268acec5ca0a', 1600)],
  ['service-petra.jpg', unsplash('1548786811-dd6e453ccca7', 1400)],
  ['service-petra-gallery-1.jpg', unsplash('1548786811-dd6e453ccca7', 1400)],
  ['service-petra-gallery-2.jpg', unsplash('1572252009286-268acec5ca0a', 1400)],
  ['service-dead-sea.jpg', unsplash('1564501049412-61c2a3083791', 1400)],
  ['service-flight.jpg', unsplash('1436491865332-7a61a109cc05', 1400)],
  ['service-car.jpg', unsplash('1549317661-bd32c8ce0db2', 1400)],
  ['service-umrah.jpg', unsplash('1565552645632-d725f8bfc19a', 1400)],
  ['service-visa.jpg', unsplash('1526778548025-fa2f459cd5c1', 1400)],
  ['service-jordan-tour.jpg', unsplash('1572252009286-268acec5ca0a', 1400)],
  ['service-bus.jpg', unsplash('1544620347-c4fd4a3d5957', 1400)],
  ['service-consultation.jpg', unsplash('1488646953014-85cb44e25828', 1400)],
  ['ad-jordan.jpg', unsplash('1548786811-dd6e453ccca7', 1600)],
];

await mkdir(outputDirectory, { recursive: true });

const exists = async (filePath) => {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

const download = async (name, url) => {
  const target = path.join(outputDirectory, name);
  if (!forceRefresh && await exists(target)) return { name, status: 'cached' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'image/jpeg,image/*;q=0.8',
        'User-Agent': 'SAFRETAK/0.1.0 media builder',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > maxBytes) throw new Error('Invalid image size');

    await writeFile(target, bytes);
    return { name, status: 'downloaded', bytes: bytes.length };
  } catch (error) {
    return {
      name,
      status: 'fallback',
      reason: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
};

const results = await Promise.all(assets.map(([name, url]) => download(name, url)));
const downloaded = results.filter((item) => item.status === 'downloaded').length;
const cached = results.filter((item) => item.status === 'cached').length;
const fallback = results.filter((item) => item.status === 'fallback');

console.log(`SAFRETAK media: ${downloaded} downloaded, ${cached} cached, ${fallback.length} using UI fallback.`);
for (const item of fallback) console.warn(`- ${item.name}: ${item.reason}`);
