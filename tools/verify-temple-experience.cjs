#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'temple-experience.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'temple-experience.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'scripts', 'temple-experience.js'), 'utf8');
const avatarHigh = path.join(root, 'assets', 'herod-temple', 'character', 'visitor-realistic-high.glb');
const avatarMobile = path.join(root, 'assets', 'herod-temple', 'character', 'visitor-realistic-mobile.glb');

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
  ['reference-derived visitor material', js.includes('visitor-cloak-weave-v1.png') && js.includes('scarfCap') && js.includes('pouch')],
  ['device-specific realistic visitor GLBs', fs.existsSync(avatarHigh) && fs.existsSync(avatarMobile) && js.includes('AVATAR_MODEL_URL')],
  ['realistic visitor safe fallback', js.includes('loadRealisticVisitorAvatar') && js.includes('keeping procedural fallback')],
  ['realistic visitor runtime pivots', ['armLeft','armRight','legLeft','legRight'].every(name => js.includes(name))],
  ['FPS camera-relative movement basis', js.includes("desired.add(forward)") && js.includes("desired.sub(forward)") && js.includes("desired.add(right)") && js.includes("desired.sub(right)")],
  ['third-person body turns toward travel', js.includes('Math.atan2(desired.x,desired.z)') && js.includes('yawDelta') && js.includes('Math.exp(-12*frameDt)')],
  ['model-specific forward axes', js.includes('group.userData.forwardOffset=0') && js.includes('loaded.userData.forwardOffset = 0')],
  ['skinned avatar preserves anatomical rest pose', js.includes('walkRestRotationX') && js.includes('restX(node)+offset')],
  ['articulated gait and jump pose', ['forearmLeft','shinLeft','avatarJumpBlend','gaitLift','poseX(shins[0]'].every(token => js.includes(token))],
  ['continuous indoor safety floor', js.includes('MAX_INTERIOR_FLOOR_DROP') && js.includes('hasNearbyRoof') && js.includes('lastFloorHeight')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log(`\ntemple experience input checks passed (${checks.length})`);
