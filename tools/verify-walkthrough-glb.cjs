#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
/* 2026-08-24 — 순례 화면이 GLB 두 개를 읽는다. 어느 파일인지는
   scripts/temple-experience.js 에서 직접 읽는다. 여기에 파일명을 또 적어 두면
   한쪽만 고쳐지는 사고가 난다(실제로 lod1 을 도려냈다가 이 화면을 깼다). */
const src = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'temple-experience.js'), 'utf8');
const urls = [...src.matchAll(/\.\/assets\/herod-temple\/ad30\/([\w.-]+\.glb)/g)].map(m => m[1]);
if (!urls.length) throw new Error('temple-experience.js 에서 GLB 경로를 찾지 못했다');
const names = [];
for (const u of urls) {
  const data = fs.readFileSync(path.join(__dirname, '..', 'assets', 'herod-temple', 'ad30', u));
  if (data.readUInt32LE(0) !== 0x46546c67 || data.readUInt32LE(4) !== 2) {
    throw new Error(`${u} is not a glTF 2.0 binary`);
  }
  const jsonLength = data.readUInt32LE(12);
  const gltf = JSON.parse(data.subarray(20, 20 + jsonLength).toString('utf8').replace(/\0+$/, '').trim());
  names.push(...(gltf.nodes || []).map(node => node.name || ''));
}
console.log(`  순례 화면이 읽는 GLB: ${urls.join(', ')}`);
const count = prefix => names.filter(name => name.startsWith(prefix)).length;
/* 움직여야 하는 부재. 두 모델이 이름 규칙이 달라 둘 다 센다.
   개수는 '적어도 이만큼'이다 — 모델을 다시 구우면 잘게 나뉠 수 있다. */
const checks = [
  ['뜰 문짝 (doorCourt_ 또는 gate_door_)', count('doorCourt_') + count('gate_door'), 8],
  ['성소 문짝 (doorHekhal_ 또는 nicanor_door)', count('doorHekhal_') + count('nicanor_door'), 2],
  ['휘장 (veil)', count('veil'), 2],
  ['성소 바닥 (sanct 또는 floor_marble)', count('sanct') + count('floor_marble'), 1],
];
let failed = 0;
for (const [label, actual, expected] of checks) {
  const ok = actual >= expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual} (최소 ${expected})`);
  if (!ok) failed++;
}
/* Josephus War 5.219: Herod's Holy of Holies contained nothing. */
const forbidden = names.filter(name => /ark|cherub/i.test(name));
const noArk = forbidden.length === 0;
console.log(`${noArk ? 'PASS' : 'FAIL'}  No invented Ark/cherub node in AD 30 Debir`);
if (!noArk) failed++;
if (failed) process.exit(1);
console.log(`\nwalkthrough GLB checks passed (${checks.length + 1})`);
