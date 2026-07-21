import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const source = 'https://safretak.vercel.app';
const dist = new URL('./dist/', import.meta.url);
rmSync(dist, { recursive: true, force: true });
mkdirSync(new URL('./dist/assets/', import.meta.url), { recursive: true });

const get = async (path) => {
  const response = await fetch(`${source}${path}`);
  if (!response.ok) throw new Error(`Unable to read ${path}`);
  return response;
};

let html = await (await get('/')).text();
const scriptPath = html.match(/src="([^"]+\.js)"/)?.[1];
const stylePath = html.match(/href="([^"]+\.css)"/)?.[1];
if (!scriptPath || !stylePath) throw new Error('Production assets were not found.');

const script = await (await get(scriptPath)).text();
const style = await (await get(stylePath)).text();
writeFileSync(new URL(`.${scriptPath}`, dist), script);
writeFileSync(new URL(`.${stylePath}`, dist), style);

const chunkNames = [...script.matchAll(/\.\/([A-Za-z0-9_-]+\.js)/g)].map((match) => match[1]);
for (const name of new Set(chunkNames)) {
  const chunk = await (await get(`/assets/${name}`)).text();
  writeFileSync(new URL(`./assets/${name}`, dist), chunk);
}

html = html.replace('</head>', '<link rel="stylesheet" href="/patch.css"></head>');
html = html.replace('</body>', '<script src="/patch.js" defer></script></body>');
writeFileSync(new URL('./dist/index.html', import.meta.url), html);
