import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const source = 'https://safretak.vercel.app';
const dist = new URL('./dist/', import.meta.url);
const assetsDir = new URL('./dist/assets/', import.meta.url);
rmSync(dist, { recursive: true, force: true });
mkdirSync(assetsDir, { recursive: true });

const get = async (path) => {
  const response = await fetch(`${source}${path}`, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Unable to read ${path}: ${response.status}`);
  return response;
};

const seen = new Set();
const queue = [];
const addAsset = (path) => {
  if (!path || !path.startsWith('/assets/') || seen.has(path) || queue.includes(path)) return;
  queue.push(path);
};
const discoverAssets = (text) => {
  for (const match of text.matchAll(/\/assets\/([A-Za-z0-9_.-]+)/g)) addAsset(`/assets/${match[1]}`);
  for (const match of text.matchAll(/\.\/([A-Za-z0-9_.-]+\.(?:js|css|png|jpe?g|webp|svg|woff2?))/g)) addAsset(`/assets/${match[1]}`);
};

let html = await (await get('/')).text();
html = html
  .replace(/<link[^>]+href=["']\/patch\.css["'][^>]*>/g, '')
  .replace(/<script[^>]+src=["']\/patch\.js["'][^>]*><\/script>/g, '');
discoverAssets(html);

while (queue.length) {
  const path = queue.shift();
  if (!path || seen.has(path)) continue;
  seen.add(path);
  const response = await get(path);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(new URL(`.${path}`, dist), buffer);
  if (/\.(?:js|css)$/.test(path)) discoverAssets(buffer.toString('utf8'));
}

writeFileSync(new URL('./dist/patch.css', import.meta.url), readFileSync(new URL('./patch.css', import.meta.url)));
writeFileSync(new URL('./dist/patch.js', import.meta.url), readFileSync(new URL('./patch.js', import.meta.url)));
html = html.replace('</head>', '  <link rel="stylesheet" href="/patch.css">\n</head>');
html = html.replace('</body>', '  <script src="/patch.js" defer></script>\n</body>');
writeFileSync(new URL('./dist/index.html', import.meta.url), html);
console.log(`SAFRETAK production patch built with ${seen.size} mirrored assets.`);
