#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] ||
  path.join(__dirname, '..', '..', 'data', 'herod-temple', 'master-plan', 'master_floor_plan_v0.1.json');
const J = JSON.parse(fs.readFileSync(file, 'utf8'));
const eps = 1e-6;
const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };
const near = (a,b,t=eps) => Math.abs(a-b) <= t;
const sum = xs => xs.reduce((a,b)=>a+b,0);

ok(near(J.units.cubit_m, 0.525), 'cubit must remain 0.525 m');
ok(J.frames.site.scale === 1.0, 'runtime/site scale must be 1.0');
ok(sum([11,11,32,22,100,11]) === 187, 'Azarah E-W chain != 187 cubits');
ok(sum([5,11,6,40,1,20,6,6,5]) === 100, 'Sanctuary E-W chain != 100 cubits');
ok(sum([5,3,5,6,6,20,6,6,5,3,5]) === 70, 'Sanctuary N-S chain != 70 cubits');
ok(32 + 32 - 2 === 62, 'Altar+ramp floor span != 62 cubits');

function rectSize(id){
  const r = J.features[id].r;
  return [r[1]-r[0], r[3]-r[2]];
}
let s = rectSize('azarah');
ok(near(s[0], 187*0.525) && near(s[1], 135*0.525), 'Azarah metric size mismatch');
s = rectSize('court_women');
ok(near(s[0], 135*0.525) && near(s[1], 135*0.525), 'Court of Women metric size mismatch');
s = rectSize('altar_mid');
ok(near(s[0], 32*0.525) && near(s[1], 32*0.525), 'Middot altar size mismatch');
s = rectSize('altar_ramp_mid');
ok(near(s[0], 16*0.525) && near(s[1], 32*0.525), 'Ramp must be 16c wide × 32c long');

const H0 = J.frames.arch.H0_site_xyz_m;
ok(near(H0[0],88.574617) && near(H0[2],225.758621), 'H0 site coordinate drift');

const E = J.frames.arch.E_basis_site_xz;
const N = J.frames.arch.N_basis_site_xz;
ok(near(Math.hypot(...E),1,1e-9), 'E basis not unit');
ok(near(Math.hypot(...N),1,1e-9), 'N basis not unit');
ok(near(E[0]*N[0]+E[1]*N[1],0,1e-9), 'E/N basis not orthogonal');

if (fail.length){
  console.error('MASTER PLAN VALIDATION FAIL');
  fail.forEach(x=>console.error(' -',x));
  process.exit(1);
}
console.log('MASTER PLAN VALIDATION PASS');
console.log('Features:', Object.keys(J.features).length);
console.log('Cubit:', J.units.cubit_m, 'm');
console.log('H0 site:', H0.join(', '));
