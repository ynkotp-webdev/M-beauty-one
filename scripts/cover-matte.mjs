// Альфа-маска головы для обложки: фон студии почти белый, поэтому альфа = насколько пиксель темнее/насыщеннее фона.
// 2026-11-23: левый край головы (светлые волосы и лоб) порог не ловит, через него на лбу проступала засечка «T».
// Поверх результата вручную залит контур (x,y на 1170px): 660,78 645,95 630,115 620,135 605,160 598,180 590,200 580,225 575,240,
// alpha=255 от контура+2px вправо до x=700. При перегенерации повторить.
import { createRequire } from 'node:module';
const sharp = createRequire('c:/webdev/Portfolio/M-beauty-one1/package.json')('sharp');
const [src, out, hS, loS, hiS] = process.argv.slice(2);
const H = +hS, lo = +loS, hi = +hiS;
const img = sharp(src).extract({ left: 0, top: 0, width: 1170, height: H });
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const a = Buffer.alloc(info.width * info.height);
const W = info.width, C = info.channels, px = (x, y, c) => data[(y * W + x) * C + c];
for (let y = 0; y < info.height; y++) {
  const L = [0, 0, 0], R = [0, 0, 0];
  for (let c = 0; c < 3; c++) { for (let x = 4; x < 44; x++) { L[c] += px(x, y, c) / 40; R[c] += px(W - 1 - x, y, c) / 40; } }
  for (let x = 0; x < W; x++) {
    const t = x / (W - 1); let d = 0;
    for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(px(x, y, c) - (L[c] + (R[c] - L[c]) * t)));
    a[y * W + x] = Math.max(0, Math.min(255, ((d - lo) / (hi - lo)) * 255));
  }
}
// всё, что ниже верхнего края волос, это голова: заливаем колонку вниз, иначе светлый лоб остаётся прозрачным
const firstRun = (x, need) => { let run = 0; for (let y = 0; y < info.height; y++) { run = a[y * W + x] >= 200 ? run + 1 : 0; if (run >= need) return y - need + 1; } return -1; };
let xL = W, xR = -1; // границы головы: колонки, где волосы идут сплошной массой
for (let x = 0; x < W; x++) if (firstRun(x, 34) >= 0) { xL = Math.min(xL, x); xR = Math.max(xR, x); }
for (let x = xL + 48; x <= xR; x++) { const y0 = firstRun(x, 4); if (y0 >= 0) for (let y = y0; y < info.height; y++) a[y * W + x] = 255; }
const alpha = await sharp(a, { raw: { width: info.width, height: info.height, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer();
await sharp(data, { raw: info }).joinChannel(alpha, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toFile(out);
// предпросмотр на тёмном фоне
await sharp(out).flatten({ background: '#3a251e' }).resize(585).jpeg({ quality: 80 }).toFile(out.replace('.png', '-preview.jpg'));
console.log('ok');
