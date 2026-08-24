#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const planPath = path.join(ROOT, 'data/herod-temple/spec/master_floor_plan_v0_1.json');
const alignPath = path.join(ROOT, 'data/herod-temple/spec/world_alignment.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const align = JSON.parse(fs.readFileSync(alignPath, 'utf8'));

let errors = 0, warnings = 0;
const fail = (m) => { console.error('FAIL:', m); errors++; };
const warn = (m) => { console.warn('WARN:', m); warnings++; };
const pass = (m) => console.log('PASS:', m);
const eq = (a,b,t=1e-6) => Math.abs(a-b) <= t;
const sum = a => a.reduce((x,y)=>x+y,0);

if (eq(plan.units.cubit_live_m, 0.525)) pass('live cubit = 0.525 m');
else fail('live cubit changed from approved 0.525 m');

for (const [id,check] of Object.entries({
  inner_court_EW_cubit:187, sanctuary_EW_cubit:100, sanctuary_NS_cubit:70
})) {
  const got = sum(plan.dimension_checks[id].segments);
  if (got === check) pass(`${id} checksum = ${check} cubits`);
  else fail(`${id} checksum ${got}, expected ${check}`);
}
if (plan.dimension_checks.women_court_cubit[0] === 135 &&
    plan.dimension_checks.women_court_cubit[1] === 135) pass('Court of Women = 135 × 135 cubits');
else fail('Court of Women checksum');

const hoh = plan.features.find(f => f.id === 'HOLY_OF_HOLIES_INTERIOR');
if (!hoh) fail('Holy of Holies feature missing');
else {
  const r=hoh.rect_m;
  if (eq((r.xmin+r.xmax)/2,0) && eq((r.ymin+r.ymax)/2,0) &&
      eq(r.xmax-r.xmin,20*0.525) && eq(r.ymax-r.ymin,20*0.525))
    pass('H0 exactly centers 20 × 20 cubit Holy of Holies');
  else fail('H0 / Holy of Holies geometry mismatch');
}

const outer = plan.outer_platform.polygon_H0_m;
function dist(a,b){ return Math.hypot(a[0]-b[0], a[1]-b[1]); }
const lens = {
  north:dist(outer[0],outer[1]),
  east:dist(outer[1],outer[2]),
  south:dist(outer[3],outer[2]),
  west:dist(outer[0],outer[3])
};
for (const k of Object.keys(lens)) {
  const expected=plan.outer_platform.wall_lengths_m[k];
  if (eq(lens[k], expected, 0.002)) pass(`outer ${k} wall = ${expected.toFixed(3)} m`);
  else fail(`outer ${k} wall ${lens[k]} != ${expected}`);
}

if (align.scale === 1) pass('world alignment scale locked at 1.000');
else fail(`world alignment scale is ${align.scale}; plan must never be rescaled to imagery`);

const h0=plan.frames.architectural_H0;
const e=h0.basis_in_site_xz.east, n=h0.basis_in_site_xz.north;
if (eq(Math.hypot(...e),1,1e-9) && eq(Math.hypot(...n),1,1e-9) &&
    eq(e[0]*n[0]+e[1]*n[1],0,1e-9)) pass('H0 east/north basis is orthonormal');
else fail('H0 basis is not orthonormal');

for (const f of plan.features.filter(f => f.geometry === 'rect')) {
  const r=f.rect_m;
  if (!(r.xmin < r.xmax && r.ymin < r.ymax)) fail(`invalid rectangle: ${f.id}`);
}
if (!errors) pass(`all ${plan.features.length} plan features structurally valid`);

if (align.status !== 'alignment-final') warn(`world alignment status = ${align.status}`);
if (Number.isFinite(align.rms_horizontal_m) && align.rms_horizontal_m > 1)
  warn(`absolute horizontal RMS = ${align.rms_horizontal_m} m; do not claim sub-metre placement`);
if (align.solution && align.solution.vertical_datum == null)
  warn('historical vertical datum unresolved; relative Z only');
if (plan.unresolved && plan.unresolved.length)
  warn(`${plan.unresolved.length} explicit unresolved/variant items retained`);

console.log(`\nMaster Floor Plan v0.1 validation: ${errors ? 'FAIL' : 'PASS'} · ${errors} errors · ${warnings} warnings`);
process.exitCode = errors ? 1 : 0;
