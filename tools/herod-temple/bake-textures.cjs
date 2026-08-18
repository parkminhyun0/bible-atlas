#!/usr/bin/env node
/* 헤롯 성전 PBR 텍스처 굽기 — 기획서 §7

   상류(openbibleinfo/3D-Temple-Mount, MIT)의 20-textures.js 는 캔버스에 절차적으로
   재질을 그린다 — 헤롯식 드래프트 마진 애슐러, 대리석, 금판, 청동, 백향목, 기와.
   외부 사진 텍스처를 쓰지 않으므로 라이선스가 깨끗하고, 시드가 고정돼 매번 같다.

   그 생성기를 헤드리스 브라우저에서 그대로 실행해 PNG 로 굽는다. 우리가 색을
   다시 만들지 않고 상류 것을 쓰는 이유는, 재질 값이 이미 사료(요세푸스의 '흰
   대리석', '금판')에 맞춰져 있고 우리가 손대면 근거가 흐려지기 때문이다.

   모델에는 이미 UV(TEXCOORD_0)가 들어 있다. 텍스처만 붙이면 바로 쓰인다.

   실행:  node tools/herod-temple/bake-textures.cjs
   산출:  assets/herod-temple/ad30/textures/<재질>.jpg
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const ROOT = path.join(__dirname, '..', '..');
const SRC = process.env.OBI_SRC || path.join(ROOT, 'vendor/3d-temple-mount/src');
const OUT = path.join(ROOT, 'assets/herod-temple/ad30/textures');

/* GLB 에 쓰는 재질 이름 → 상류 생성기 이름과 인자.
   이름이 같으면 인자만 비운다. */
const WANT = {
  ashlar:      ['ashlar', null],
  ashlarFine:  ['ashlarFine', null],
  ashlarWhite: ['ashlarWhite', null],
  paving:      ['paving', null],
  marble:      ['marble', null],
  marbleFloor: ['marbleFloor', null],
  gold:        ['gold', null],
  bronze:      ['bronze', null],
  cedar:       ['cedar', null],
  plaster:     ['plaster', null],
  roof:        ['roofing', null],
  roofTile:    ['roofTiles', null],
  water:       ['water', null],
  veil:        ['veil', null],
  lattice:     ['lattice', null],
  rock:        ['bedrock', null],
};

(async () => {
  const req = createRequire('/Users/parkminhyeon/bible-mindmap-local/bible-mindmap/package.json');
  let chromium;
  try { ({ chromium } = req('playwright')); }
  catch (e) {
    console.error('playwright 를 찾지 못했습니다. 텍스처 굽기는 헤드리스 브라우저가 필요합니다.');
    process.exit(2);
  }

  for (const f of ['10-math.js', '20-textures.js']) {
    if (!fs.existsSync(path.join(SRC, f))) {
      console.error(`상류 소스가 없습니다: ${path.join(SRC, f)}`);
      process.exit(2);
    }
  }
  const mathSrc = fs.readFileSync(path.join(SRC, '10-math.js'), 'utf8');
  const texSrc = fs.readFileSync(path.join(SRC, '20-textures.js'), 'utf8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent('<!doctype html><meta charset="utf-8"><body></body>');
  await page.addScriptTag({ content: mathSrc });
  await page.addScriptTag({ content: texSrc });

  const has = await page.evaluate(() => typeof TexLib === 'object' && Object.keys(TexLib).length);
  if (!has) { console.error('TexLib 를 불러오지 못했습니다.'); await browser.close(); process.exit(1); }

  fs.mkdirSync(OUT, { recursive: true });
  const report = [];
  for (const [matName, [fnName, opt]] of Object.entries(WANT)) {
    const dataUrl = await page.evaluate(({ fnName, opt }) => {
      const fn = TexLib[fnName];
      if (typeof fn !== 'function') return null;
      const c = fn(opt || undefined);
      if (!c || !c.toDataURL) return null;
      /* baseColor 는 JPEG 로 굽는다. 알파가 필요한 것(격자·휘장)만 PNG. */
      const needsAlpha = fnName === 'lattice';
      return { url: c.toDataURL(needsAlpha ? 'image/png' : 'image/jpeg', 0.86),
               w: c.width, h: c.height, png: needsAlpha };
    }, { fnName, opt });

    if (!dataUrl) { report.push({ matName, ok: false, why: `TexLib.${fnName} 없음` }); continue; }
    const ext = dataUrl.png ? 'png' : 'jpg';
    const b64 = dataUrl.url.split(',')[1];
    const buf = Buffer.from(b64, 'base64');
    const file = path.join(OUT, `${matName}.${ext}`);
    fs.writeFileSync(file, buf);
    report.push({ matName, ok: true, file: `${matName}.${ext}`, size: buf.length, w: dataUrl.w, h: dataUrl.h });
  }
  await browser.close();

  console.log('\n■ 텍스처 굽기 완료');
  let total = 0;
  report.forEach(r => {
    if (!r.ok) { console.log(`  ✗ ${r.matName.padEnd(12)} ${r.why}`); return; }
    total += r.size;
    console.log(`  ✓ ${r.matName.padEnd(12)} ${String(r.w).padStart(4)}x${String(r.h).padEnd(4)} ${(r.size / 1024).toFixed(0).padStart(5)} KB  ${r.file}`);
  });
  console.log(`  합계 ${(total / 1048576).toFixed(2)} MB · ${report.filter(r => r.ok).length}개`);
  console.log(`  위치 ${path.relative(ROOT, OUT)}\n`);
})();
