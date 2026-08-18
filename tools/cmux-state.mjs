#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE_PATH = path.join(ROOT, '.cmux/state.json');
const VALID_GATE = new Set(['pending', 'pass', 'fail', 'waived']);
const VALID_KIND = new Set(['file', 'command', 'url', 'note']);

function die(message) {
  console.error(`CMUX_FAIL: ${message}`);
  process.exit(1);
}

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    die(`git ${args.join(' ')} failed: ${(error.stderr || error.message).toString().trim()}`);
  }
}

function now() { return new Date().toISOString(); }
function load() { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); }
function save(state) {
  state.revision += 1;
  state.updatedAt = now();
  state.git.branch = git('branch', '--show-current');
  state.git.headAtWrite = git('rev-parse', 'HEAD');
  const temp = `${STATE_PATH}.tmp-${process.pid}`;
  fs.writeFileSync(temp, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o644 });
  fs.renameSync(temp, STATE_PATH);
}

function parse(argv) {
  const command = argv[0] || 'status';
  const flags = new Map();
  for (let i = 1; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) die(`unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    if (!flags.has(key)) flags.set(key, []);
    flags.get(key).push(value);
  }
  return { command, one: key => flags.get(key)?.at(-1), all: key => flags.get(key) || [], has: key => flags.has(key) };
}

function hashFile(relative) {
  const absolute = path.resolve(ROOT, relative);
  if (absolute !== ROOT && !absolute.startsWith(`${ROOT}${path.sep}`)) die(`evidence path escapes repository: ${relative}`);
  if (!fs.statSync(absolute, { throwIfNoEntry: false })?.isFile()) die(`evidence file missing: ${relative}`);
  return crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
}

function idsUnique(items, label) {
  const ids = items.map(item => item.id);
  if (new Set(ids).size !== ids.length) die(`${label} IDs must be unique`);
}

function validate(state, { strict = false, takeover = false } = {}) {
  if (state.schemaVersion !== 1) die(`unsupported schemaVersion ${state.schemaVersion}`);
  if (!Number.isInteger(state.revision) || state.revision < 0) die('revision must be a non-negative integer');
  if (!['active', 'blocked', 'complete'].includes(state.task?.status)) die('invalid task status');
  if (!state.git?.branch || !/^[0-9a-f]{40}$/.test(state.git?.headAtWrite || '')) die('invalid git checkpoint');
  if (!Array.isArray(state.completedSteps) || !Array.isArray(state.evidence) || !Array.isArray(state.gates) || !Array.isArray(state.blockers)) die('state arrays missing');
  idsUnique(state.completedSteps, 'completed step');
  idsUnique(state.evidence, 'evidence');
  idsUnique(state.gates, 'gate');
  idsUnique(state.blockers, 'blocker');
  const evidenceIds = new Set(state.evidence.map(item => item.id));
  for (const item of state.evidence) {
    if (!VALID_KIND.has(item.kind)) die(`invalid evidence kind: ${item.kind}`);
    if (item.replacedBy && !evidenceIds.has(item.replacedBy)) die(`evidence ${item.id} references missing replacement ${item.replacedBy}`);
    if (item.kind === 'file' && !item.replacedBy && hashFile(item.value) !== item.sha256) die(`evidence fingerprint drift: ${item.id} (${item.value})`);
  }
  for (const step of state.completedSteps) for (const id of step.evidenceIds) if (!evidenceIds.has(id)) die(`step ${step.id} references missing evidence ${id}`);
  for (const gate of state.gates) {
    if (!VALID_GATE.has(gate.status)) die(`invalid gate status: ${gate.id}`);
    if (!['automated', 'human', 'external'].includes(gate.authority)) die(`invalid gate authority: ${gate.id}`);
    for (const id of gate.evidenceIds) if (!evidenceIds.has(id)) die(`gate ${gate.id} references missing evidence ${id}`);
    if (['pass', 'waived'].includes(gate.status) && gate.evidenceIds.length === 0) die(`${gate.status} gate ${gate.id} requires evidence`);
    if (['human', 'external'].includes(gate.authority) && ['pass', 'waived'].includes(gate.status) && !gate.decision?.actor) die(`${gate.authority} gate ${gate.id} requires a decision actor`);
  }
  if (state.task.status === 'complete') {
    if (state.nextStep !== null || state.blockers.length) die('complete task cannot have nextStep or blockers');
    const open = state.gates.filter(gate => gate.required && !['pass', 'waived'].includes(gate.status));
    if (open.length) die(`complete task has open required gates: ${open.map(g => g.id).join(', ')}`);
  }
  if (strict || takeover) {
    const branch = git('branch', '--show-current');
    if (branch !== state.git.branch) die(`branch mismatch: state=${state.git.branch}, current=${branch}`);
    try { execFileSync('git', ['merge-base', '--is-ancestor', state.git.headAtWrite, 'HEAD'], { cwd: ROOT, stdio: 'ignore' }); }
    catch { die(`checkpoint head ${state.git.headAtWrite} is not an ancestor of current HEAD`); }
  }
  if (takeover) {
    const dirty = git('status', '--porcelain');
    if (dirty) die('takeover requires a clean worktree');
    const failed = state.gates.filter(gate => gate.required && gate.status === 'fail');
    if (failed.length) die(`required gates failed: ${failed.map(g => g.id).join(', ')}`);
  }
  return state;
}

function newEvidence(state, kind, value) {
  if (!VALID_KIND.has(kind)) die(`invalid evidence kind: ${kind}`);
  const sha256 = kind === 'file' ? hashFile(value) : null;
  const id = `ev-${crypto.createHash('sha256').update(`${kind}\0${value}\0${sha256 || ''}`).digest('hex').slice(0, 12)}`;
  if (!state.evidence.some(item => item.id === id)) state.evidence.push({ id, kind, value, sha256, recordedAt: now() });
  return id;
}

function leaseExpired(state) {
  if (!state.lease.heartbeatAt) return true;
  return Date.now() - Date.parse(state.lease.heartbeatAt) > state.lease.ttlMinutes * 60_000;
}

function printStatus(state) {
  console.log(JSON.stringify({
    task: state.task, revision: state.revision, branch: state.git.branch,
    phase: state.phase, executor: state.executor, nextStep: state.nextStep,
    blockers: state.blockers, gates: state.gates, handoff: state.handoff,
    lease: { ...state.lease, expired: leaseExpired(state) }
  }, null, 2));
}

const cli = parse(process.argv.slice(2));
const state = load();

switch (cli.command) {
  case 'status':
    validate(state);
    printStatus(state);
    break;
  case 'validate':
    validate(state, { strict: cli.has('strict') });
    console.log('CMUX_OK: state contract valid');
    break;
  case 'evidence': {
    const kind = cli.one('kind');
    const value = cli.one('value');
    if (!kind || !value) die('evidence requires --kind and --value');
    const id = newEvidence(state, kind, value);
    save(state);
    console.log(`CMUX_OK: evidence ${id}`);
    break;
  }
  case 'checkpoint': {
    validate(state);
    const phase = cli.one('phase');
    const next = cli.one('next');
    if (phase) state.phase = phase;
    const addedEvidence = cli.all('evidence').map(value => newEvidence(state, 'file', value));
    const complete = cli.one('complete');
    if (complete) {
      if (state.completedSteps.some(step => step.id === complete)) die(`step already completed: ${complete}`);
      state.completedSteps.push({ id: complete, completedAt: now(), evidenceIds: addedEvidence });
    }
    if (next === true) die('--next requires text');
    if (next) state.nextStep = next;
    state.lease.heartbeatAt = now();
    save(state);
    console.log('CMUX_OK: checkpoint written; commit and push .cmux/state.json');
    break;
  }
  case 'gate-add': {
    validate(state);
    const id = cli.one('id');
    const authority = cli.one('authority');
    if (!id || id === true || !['automated', 'human', 'external'].includes(authority)) {
      die('gate-add requires --id and --authority automated|human|external');
    }
    if (state.gates.some(item => item.id === id)) die(`gate already exists: ${id}`);
    state.gates.push({ id, required: !cli.has('optional'), authority, status: 'pending', evidenceIds: [], decision: null });
    save(state);
    console.log(`CMUX_OK: gate ${id} added (${authority}, ${cli.has('optional') ? 'optional' : 'required'})`);
    break;
  }
  case 'gate': {
    validate(state);
    const id = cli.one('id');
    const status = cli.one('status');
    if (!id || !VALID_GATE.has(status)) die('gate requires --id and valid --status');
    const gate = state.gates.find(item => item.id === id);
    if (!gate) die(`unknown gate: ${id}`);
    const evidenceIds = cli.all('evidence');
    const actor = cli.one('actor');
    for (const ev of evidenceIds) if (!state.evidence.some(item => item.id === ev)) die(`unknown evidence: ${ev}`);
    if (['pass', 'waived'].includes(status) && evidenceIds.length === 0) die(`${status} gate requires --evidence`);
    if (['human', 'external'].includes(gate.authority) && ['pass', 'waived'].includes(status) && (!actor || actor === true)) die(`${gate.authority} gate requires --actor`);
    gate.status = status;
    gate.evidenceIds = evidenceIds;
    gate.decision = ['pass', 'fail', 'waived'].includes(status) ? { actor: actor && actor !== true ? actor : state.lease.owner || 'cmux', at: now() } : null;
    save(state);
    console.log(`CMUX_OK: gate ${id}=${status}`);
    break;
  }
  case 'handoff': {
    validate(state);
    const reason = cli.one('reason');
    if (!reason || reason === true) die('handoff requires --reason');
    state.handoff.ready = true;
    state.handoff.reason = reason;
    state.handoff.requestedAt = now();
    state.lease.heartbeatAt = now();
    save(state);
    console.log('CMUX_OK: EXECUTOR_HANDOFF_READY; commit and push before exit');
    break;
  }
  case 'takeover': {
    validate(state, { takeover: true });
    const provider = cli.one('provider');
    const model = cli.one('model');
    const session = cli.one('session');
    const reason = cli.one('reason');
    const recovery = cli.has('recover');
    if (!provider || !model || !session) die('takeover requires --provider --model --session');
    if (!state.handoff.ready) {
      if (!recovery) die('planned takeover requires handoff.ready=true');
      if (!leaseExpired(state)) die('recovery takeover requires an expired lease');
      if (!reason || reason === true) die('recovery takeover requires --reason');
    }
    const from = state.lease.owner;
    const to = `${provider}/${model}`;
    state.handoff.history.push({ from, to, at: now(), mode: recovery ? 'recovery' : 'planned', reason: reason || state.handoff.reason || 'planned handoff' });
    state.executor = { provider, model, session };
    state.lease.owner = to;
    state.lease.heartbeatAt = now();
    state.handoff.ready = false;
    state.handoff.reason = null;
    state.handoff.requestedAt = null;
    save(state);
    console.log(`CMUX_OK: takeover by ${to}; resume only at nextStep: ${state.nextStep}`);
    break;
  }
  case 'heartbeat':
    validate(state);
    state.lease.heartbeatAt = now();
    save(state);
    console.log('CMUX_OK: heartbeat recorded');
    break;
  case 'block': {
    validate(state);
    const id = cli.one('id');
    const reason = cli.one('reason');
    if (!id || !reason || reason === true) die('block requires --id and --reason');
    if (state.blockers.some(item => item.id === id)) die(`blocker already exists: ${id}`);
    state.blockers.push({ id, reason, since: now() });
    state.task.status = 'blocked';
    save(state);
    console.log(`CMUX_OK: blocker ${id} recorded`);
    break;
  }
  case 'unblock': {
    validate(state);
    const id = cli.one('id');
    if (!id) die('unblock requires --id');
    const before = state.blockers.length;
    state.blockers = state.blockers.filter(item => item.id !== id);
    if (state.blockers.length === before) die(`unknown blocker: ${id}`);
    if (state.blockers.length === 0 && state.task.status === 'blocked') state.task.status = 'active';
    save(state);
    console.log(`CMUX_OK: blocker ${id} cleared`);
    break;
  }
  case 'start': {
    validate(state);
    if (state.task.status !== 'complete') die('start requires the current task to be complete');
    const id = cli.one('id');
    const title = cli.one('title');
    const next = cli.one('next');
    if (!id || !title || !next || next === true) die('start requires --id --title --next');
    state.task = { id, title, status: 'active' };
    state.phase = cli.one('phase') || 'planning';
    state.completedSteps = [];
    state.nextStep = next;
    state.evidence = [];
    state.gates = [];
    state.blockers = [];
    state.handoff = { ready: false, reason: null, requestedAt: null, history: [] };
    state.lease.heartbeatAt = now();
    save(state);
    console.log(`CMUX_OK: started task ${id}`);
    break;
  }
  case 'complete':
    validate(state);
    state.task.status = 'complete';
    state.nextStep = null;
    validate(state);
    save(state);
    console.log('CMUX_OK: task complete');
    break;
  default:
    die(`unknown command: ${cli.command}`);
}
