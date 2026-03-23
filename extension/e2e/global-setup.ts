import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function globalSetup() {
  const extensionDir = path.resolve(__dirname, '..');
  console.log('[e2e] Building extension...');
  execSync('pnpm build', { cwd: extensionDir, stdio: 'inherit' });
  console.log('[e2e] Extension built.');
}
