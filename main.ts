import { existsSync, mkdirSync, readFileSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const base = dirname(fileURLToPath(import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? (existsSync('/output') ? '/output' : base);
mkdirSync(output, { recursive: true });
const temporary = mkdtempSync(join(tmpdir(), 'daily-signal-'));
try {
  const png = join(temporary, 'entry.png');
  const render = spawnSync('google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--screenshot=' + png, '--window-size=1024,1024', '--virtual-time-budget=9000', '--user-data-dir=' + join(temporary, 'profile'), pathToFileURL(join(base, 'frontpage.html')).href], { encoding: 'utf8' });
  if (render.status !== 0) throw new Error('Chrome render failed: ' + render.stderr);
  const data = readFileSync(png);
  if (!data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || data.readUInt32BE(16) !== 1024 || data.readUInt32BE(20) !== 1024 || data.length < 10000) throw new Error('Invalid rendered PNG');
  copyFileSync(png, resolve(base, 'entry.png'));
  if (resolve(output) !== base) copyFileSync(png, resolve(output, 'entry.png'));
  console.log(`Rendered 1024 × 1024 PNG (${data.length} bytes): ${resolve(output, 'entry.png')}`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
