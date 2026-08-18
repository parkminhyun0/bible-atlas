#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'assets', 'herod-temple', 'ad30', 'lod1.glb');
const data = fs.readFileSync(file);
if (data.readUInt32LE(0) !== 0x46546c67 || data.readUInt32LE(4) !== 2) {
  throw new Error('lod1.glb is not a glTF 2.0 binary');
}
const jsonLength = data.readUInt32LE(12);
const gltf = JSON.parse(data.subarray(20, 20 + jsonLength).toString('utf8').replace(/\0+$/, '').trim());
const names = (gltf.nodes || []).map(node => node.name || '');
const count = prefix => names.filter(name => name.startsWith(prefix)).length;
const checks = [
  ['Court gate leaves', count('doorCourt_'), 18],
  ['Hekhal door leaves', count('doorHekhal_'), 4],
  ['Outer veil', count('veilOuter'), 1],
  ['Debir veils', count('veilDebir'), 2],
  ['Chel stair node', count('stairsChel'), 1],
  ['Interior furnishings layer', count('interior'), 1],
];
let failed = 0;
for (const [label, actual, expected] of checks) {
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual} (expected ${expected})`);
  if (!ok) failed++;
}
/* Josephus War 5.219: Herod's Holy of Holies contained nothing. */
const forbidden = names.filter(name => /ark|cherub/i.test(name));
const noArk = forbidden.length === 0;
console.log(`${noArk ? 'PASS' : 'FAIL'}  No invented Ark/cherub node in AD 30 Debir`);
if (!noArk) failed++;
if (failed) process.exit(1);
console.log(`\nwalkthrough GLB checks passed (${checks.length + 1})`);
