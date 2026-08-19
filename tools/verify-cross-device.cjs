#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const policy = read('AGENTS.md');
const template = read('.github/PULL_REQUEST_TEMPLATE.md');
check(policy.includes('전 디바이스 동시 적용 계약'), 'AGENTS.md cross-device contract missing');
for (const label of ['Desktop 검증','Mobile/Tablet 검증','Touch/Keyboard 입력 검증']) {
  check(template.includes(`- [ ] ${label}`), `PR template evidence item missing: ${label}`);
}

for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const html = read(file);
  check(/<meta\s+name=["']viewport["']/i.test(html), `${file}: responsive viewport missing`);
}

const mobileCss = read('mobile.css');
const templeCss = read('temple-experience.css');
const responsiveUi = read('scripts/29-ui.js');
const templeJs = read('scripts/temple-experience.js');
check(/@media/u.test(mobileCss), 'mobile.css: responsive media rules missing');
check(responsiveUi.includes('pointer: coarse') && responsiveUi.includes('max-width'), 'MapLibre responsive device query missing');
check(templeCss.includes('pointer:coarse') && templeCss.includes('safe-area-inset'), 'Temple touch/safe-area CSS missing');
check(templeJs.includes('touchMode') && templeJs.includes('touchMove'), 'Temple touch input contract missing');

if (process.argv.includes('--pr')) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const base = event.pull_request?.base?.sha;
  const head = event.pull_request?.head?.sha;
  const body = event.pull_request?.body || '';
  check(base && head, 'pull request SHAs unavailable');
  if (base && head) {
    const changed = execFileSync('git', ['diff','--name-only',`${base}...${head}`], {cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const uiChanged = changed.some(file => /(?:\.html|\.css)$|^scripts\/(?!.*(?:data|spec))[^/]+\.js$|^assets\//u.test(file));
    if (uiChanged) {
      for (const label of ['Desktop 검증','Mobile/Tablet 검증','Touch/Keyboard 입력 검증']) {
        check(body.includes(`- [x] ${label}`) || body.includes(`- [X] ${label}`), `UI PR evidence unchecked: ${label}`);
      }
    }
  }
}

if (failures.length) {
  console.error('Cross-device gate failed:');
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}
console.log('Cross-device policy and responsive contracts: PASS');
