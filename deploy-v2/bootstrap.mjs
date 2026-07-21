import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const payloadDir = join(root, 'payload');
const appDir = join(root, 'app');
const archivePath = join(root, 'source.tar.gz');
const outputDir = join(root, 'dist');

const chunks = readdirSync(payloadDir)
  .filter((name) => name.endsWith('.b64'))
  .sort()
  .map((name) => readFileSync(join(payloadDir, name), 'utf8').trim())
  .join('');

if (!chunks) throw new Error('Missing SAFRETAK source payload.');

rmSync(appDir, { recursive: true, force: true });
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(appDir, { recursive: true });
writeFileSync(archivePath, Buffer.from(chunks, 'base64'));
execFileSync('tar', ['-xzf', archivePath, '-C', appDir], { stdio: 'inherit' });

writeFileSync(join(appDir, '.env.production'), [
  'VITE_SUPABASE_URL=https://uspibifgqtowyvoonkca.supabase.co',
  'VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_qQzTwzsWKOaaZDg2OcYjDQ_fqVIZfZR',
  '',
].join('\n'));

execFileSync('npm', ['ci'], { cwd: appDir, stdio: 'inherit' });
execFileSync('npm', ['run', 'test'], { cwd: appDir, stdio: 'inherit' });
execFileSync('npm', ['run', 'lint'], { cwd: appDir, stdio: 'inherit' });
execFileSync('npm', ['run', 'build'], { cwd: appDir, stdio: 'inherit' });
cpSync(join(appDir, 'dist'), outputDir, { recursive: true });
copyFileSync(join(appDir, 'vercel.json'), join(root, 'source-vercel.json'));
