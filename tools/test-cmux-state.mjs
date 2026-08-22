#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cmux-state-test-'));
fs.mkdirSync(path.join(root, 'tools'));
fs.mkdirSync(path.join(root, '.cmux'));
fs.copyFileSync(path.join(SOURCE_ROOT, 'tools/cmux-state.mjs'), path.join(root, 'tools/cmux-state.mjs'));
fs.writeFileSync(path.join(root, 'evidence.txt'), 'stable evidence\n');

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const run = (...args) => spawnSync(process.execPath, ['tools/cmux-state.mjs', ...args], { cwd: root, encoding: 'utf8' });
const commit = message => { git('add', '.'); git('commit', '-m', message); };

git('init', '-b', 'task/test');
git('config', 'user.email', 'cmux-test@example.invalid');
git('config', 'user.name', 'CMUX Test');
git('add', 'tools/cmux-state.mjs', 'evidence.txt');
git('commit', '-m', 'test fixture');
const fixtureHead = git('rev-parse', 'HEAD');

const state = {
  schemaVersion: 1, revision: 0, project: 'test/repo',
  task: { id: 'test', title: 'CMUX test', status: 'active' },
  git: { branch: 'task/test', baseBranch: 'main', headAtWrite: fixtureHead },
  executor: { provider: 'anthropic', model: 'claude', session: 'one' },
  phase: 'test', completedSteps: [], nextStep: 'continue', evidence: [],
  gates: [{ id: 'contract', required: true, authority: 'automated', status: 'pending', evidenceIds: [], decision: null }],
  blockers: [],
  handoff: { ready: false, reason: null, requestedAt: null, history: [] },
  lease: { owner: 'anthropic/claude', heartbeatAt: new Date().toISOString(), ttlMinutes: 120 },
  updatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(root, '.cmux/state.json'), `${JSON.stringify(state, null, 2)}\n`);
commit('initial state');

assert.equal(run('validate', '--strict').status, 0, 'strict validation should pass');
assert.equal(run('gate-add', '--id', 'human-review', '--authority', 'human').status, 0, 'human gate should be addable');
assert.equal(run('handoff', '--reason', 'quota').status, 0, 'handoff should be writable');
commit('handoff');
assert.equal(run('takeover', '--provider', 'openai', '--model', 'codex', '--session', 'two').status, 0, 'planned takeover should pass');
commit('takeover');

fs.writeFileSync(path.join(root, 'dirty.tmp'), 'unowned work\n');
assert.notEqual(run('takeover', '--provider', 'google', '--model', 'gemini', '--session', 'three', '--recover', '--reason', 'lost').status, 0, 'dirty takeover must fail');
fs.rmSync(path.join(root, 'dirty.tmp'));
assert.notEqual(run('takeover', '--provider', 'google', '--model', 'gemini', '--session', 'three', '--recover', '--reason', 'lost').status, 0, 'live lease recovery must fail');
const expiredState = JSON.parse(fs.readFileSync(path.join(root, '.cmux/state.json'), 'utf8'));
expiredState.lease.heartbeatAt = '2000-01-01T00:00:00.000Z';
fs.writeFileSync(path.join(root, '.cmux/state.json'), `${JSON.stringify(expiredState, null, 2)}\n`);
commit('expire lease');
assert.equal(run('takeover', '--provider', 'google', '--model', 'gemini', '--session', 'three', '--recover', '--reason', 'lost').status, 0, 'expired lease recovery should pass');
commit('recovery takeover');

const evidence = run('evidence', '--kind', 'file', '--value', 'evidence.txt');
assert.equal(evidence.status, 0, evidence.stderr);
const evidenceId = evidence.stdout.match(/evidence (ev-[0-9a-f]+)/)?.[1];
assert.ok(evidenceId, 'evidence command should return an evidence ID');
assert.notEqual(run('gate', '--id', 'human-review', '--status', 'pass', '--evidence', evidenceId).status, 0, 'human gate without actor must fail');
assert.equal(run('gate', '--id', 'human-review', '--status', 'pass', '--actor', 'test:maintainer', '--evidence', evidenceId).status, 0, 'human gate with actor and evidence should pass');
commit('evidence');
fs.writeFileSync(path.join(root, 'evidence.txt'), 'drifted evidence\n');
const drift = run('validate');
assert.notEqual(drift.status, 0, 'fingerprint drift must fail');
assert.match(drift.stderr, /fingerprint drift/);

console.log('CMUX_TEST_OK: gate authority, planned/recovery takeover, dirty-worktree guard, lease guard, and fingerprint fail-closed behavior passed');
fs.rmSync(root, { recursive: true, force: true });
