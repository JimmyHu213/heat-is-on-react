import { build } from 'esbuild';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnv } from 'vite';

const environment = { ...loadEnv('production', process.cwd(), 'VITE_'),
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'))) };
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.DEMO_EMULATORS === '1') {
  environment.VITE_FIREBASE_PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-heat-is-on-react';
}

const directory = await mkdtemp(join(tmpdir(), 'heat-is-on-demo-'));
try {
  const outfile = join(directory, 'seed.cjs');
  await build({
    entryPoints: [process.argv[2] || 'scripts/seed-demo.mjs'], outfile,
    bundle: true, platform: 'node', format: 'cjs',
    define: {'import.meta.env': JSON.stringify(environment)},
  });
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [outfile], {stdio: 'inherit'});
    child.on('error', reject);
    child.on('exit', code => resolve(code ?? 1));
  });
  process.exitCode = exitCode;
} finally {
  await rm(directory, {recursive: true, force: true});
}
