#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'temple-experience.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'temple-experience.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'scripts', 'temple-experience.js'), 'utf8');

const checks = [
  ['desktop F sprint input', js.includes("keys.has('KeyF')") && html.includes('F + 이동키')],
  ['touch move pad', html.includes('id="movePad"') && js.includes("movePad.addEventListener('pointerdown'")],
  ['touch look drag', html.includes('id="lookZone"') && js.includes("lookZone.addEventListener('pointermove'")],
  ['touch sprint and jump', html.includes('id="sprintButton"') && html.includes('id="jumpButton"') && js.includes('touchSprint')],
  ['coarse pointer responsive UI', css.includes('(pointer:coarse)') && css.includes('body.touch-active #touchControls')],
  ['safe area support', css.includes('env(safe-area-inset-left)') && css.includes('env(safe-area-inset-right)')],
  ['mobile render cap', js.includes('touchMode ? 1.5 : 2')],
  ['first/third-person toggle', html.includes('id="viewToggle"') && js.includes('function setThirdPerson(')],
  ['procedural visitor avatar', js.includes('function createVisitorAvatar()') && js.includes("group.name = 'visitorAvatar'")],
  ['walk/run limb animation', js.includes('avatarWalkTime') && js.includes('visitorAvatar.userData.limbs')],
  ['third-person wall-safe chase camera', js.includes('function updateView()') && js.includes('safeDistance')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log(`\ntemple experience input checks passed (${checks.length})`);
