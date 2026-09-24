import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const repo = new URL('../', import.meta.url).pathname;
const fixture = { version: 3, routes: [{ src: '^/(.*)/$', headers: { Location: '/$1' }, status: 308 }, { handle: 'filesystem' }, { src: '^/api/lead$', dest: '_render' }] };
const names = ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-Frame-Options', 'Strict-Transport-Security'];

test('vercel-headers puts one route with all six vercel.json headers first, and is idempotent', () => {
  // Run the real script on a copy: it resolves vercel.json and .vercel/output/config.json relative to itself.
  const dir = mkdtempSync(join(tmpdir(), 'vh-'));
  try {
    mkdirSync(join(dir, 'scripts')); mkdirSync(join(dir, '.vercel/output'), { recursive: true });
    cpSync(join(repo, 'scripts/vercel-headers.mjs'), join(dir, 'scripts/vercel-headers.mjs'));
    cpSync(join(repo, 'vercel.json'), join(dir, 'vercel.json'));
    const config = join(dir, '.vercel/output/config.json');
    writeFileSync(config, JSON.stringify(fixture));
    const run = () => { execFileSync(process.execPath, [join(dir, 'scripts/vercel-headers.mjs')]); return JSON.parse(readFileSync(config, 'utf8')); };
    const once = run();
    assert.equal(once.routes.length, fixture.routes.length + 1);
    assert.equal(once.routes[0].src, '/(.*)');
    assert.equal(once.routes[0].continue, true);
    assert.deepEqual(Object.keys(once.routes[0].headers).sort(), [...names].sort());
    assert.deepEqual(once.routes.slice(1), fixture.routes);
    assert.deepEqual(run(), once);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
