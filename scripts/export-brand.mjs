import { spawnSync } from 'node:child_process';

const script = new URL('./finalize-logo.py', import.meta.url).pathname;
const reference = new URL('../public/brand/source/approved-reference.png', import.meta.url).pathname;
const result = spawnSync('python3', [script, reference], { stdio: 'inherit' });

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
