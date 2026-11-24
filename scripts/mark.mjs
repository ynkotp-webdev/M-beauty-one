// Знак M Beauty One (арка с монограммой «m»): ручная перерисовка в вектор для концепта, НЕ официальный вектор салона.
// Источник: public/logo-mark.png (584×580, белый знак на прозрачном). Знак разобран на пять заливных контуров:
// арка с основанием, стебель, петля, два плеча «m». Точки краёв сняты с альфа-канала по строкам и столбцам
// с точностью до долей пикселя, кривые идут через них (Catmull-Rom -> Безье). Половины меряются отдельно:
// знак только выглядит зеркальным, правая сторона арки в растре толще левой на 1,5–3 px.
// Контуры заходят друг в друга в узле, у вершины и у основания, чтобы на стыках не было волосяных швов.
//   node scripts/mark.mjs                    -> src/assets/mark.json: shapes (контуры) и axes (оси штрихов для масок)
//   node scripts/mark.mjs --check <out.png>  -> расхождение с оригиналом в цифрах и наложение ×3 (--axes: с осями)
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const { data, info } = await sharp('public/logo-mark.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const al = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : data[(y * W + x) * C + 3] / 255);

// Края непрозрачных участков вдоль линии пикселей; пиксель i занимает [i, i+1)
const edges = (get, n) => {
  const out = [];
  for (let i = 0, on = false; i <= n; i++) {
    const v = i < n && get(i) > 0.5;
    if (v !== on) out.push(on ? i - 1 + get(i - 1) + get(i) : i + 1 - get(i - 1) - get(i));
    on = v;
  }
  return out;
};
const row = (y) => edges((x) => al(x, y), W);
const col = (x) => edges((y) => al(x, y), H);

// --- сборка пути: часть из двух точек это отрезок, из трёх и больше гладкая кривая ---------------------
const n1 = (v) => +v.toFixed(1);
const pt = ([x, y]) => `${n1(x)},${n1(y)}`;
const smooth = (pts) => {
  const p = [pts[0], ...pts, pts.at(-1)];
  let d = '';
  for (let i = 1; i < p.length - 2; i++) {
    const [a, b, c, e] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    d += `C${pt([b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6])} ${pt([c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6])} ${pt(c)}`;
  }
  return d;
};
const open = (...parts) => {
  let d = `M${pt(parts[0][0])}`, last = parts[0][0];
  for (const s of parts) {
    if (pt(s[0]) !== pt(last)) d += `L${pt(s[0])}`;
    d += s.length > 2 ? smooth(s) : `L${pt(s[1])}`;
    last = s.at(-1);
  }
  return d;
};
const closed = (...parts) => open(...parts) + 'Z';
const back = (pts) => pts.slice(0, -1).reverse(); // вторая половина симметричного контура, без общей средней точки

const MID = 300; // ось для точек, заданных числом (все они внутри заливки, на край не выходят)
const bottom = col(100).at(-1), baseTop = col(60).at(2), c299 = col(299);
const stemMid = (row(100)[2] + row(100)[3]) / 2;

// Одна половина знака: s = 0 левая, 1 правая. Порядок точек в обеих одинаковый.
const half = (s) => {
  const X = (x) => (s ? 2 * MID - x : x);
  const R = (ys, k) => ys.map((y) => [row(y).at(s ? -1 - k : k), y + 0.5]); // k-й край от своего бока в строках ys
  const Cl = (xs, k) => xs.map((x) => [X(x + 0.5), col(s ? 2 * MID - 1 - x : x).at(k)]); // k-й край сверху в столбцах xs
  const midR = (ys, a, b) => ys.map((y) => [(R([y], a)[0][0] + R([y], b)[0][0]) / 2, y + 0.5]);
  const midC = (xs, a, b) => xs.map((x) => [X(x + 0.5), (Cl([x], a)[0][1] + Cl([x], b)[0][1]) / 2]);
  const [aOut, aIn, legOut, legIn] = [0, 1, 2, 3].map((k) => R([400], k)[0][0]);
  const stemX = R([100], 2)[0][0];
  const aMid = (aOut + aIn) / 2, legMid = (legOut + legIn) / 2, baseMid = (baseTop + bottom) / 2;
  return {
    aOut, aIn, stemX,
    // арка: от прямого бока вверх до вершины
    archOut: [[aOut, 330.5], ...R([290, 255, 220, 185, 150, 118, 90], 0), ...Cl([135, 165, 197, 230, 264], 0), [MID, c299[0]]],
    archIn: [[aIn, 320.5], ...R([280, 250, 220, 190, 160, 132, 108], 1), ...Cl([140, 170, 200, 230, 258, 278], 1), [MID, col(283)[1]]],
    // стебель: скругление в месте примыкания к арке
    fillet: [[X(278), 20], ...Cl([282, 284, 286, 288, 290, 292], 1), ...R([30, 32, 34], 2), [stemX, 38]],
    // петля: от узла вниз до нижней точки; внутри капля с остриём сверху
    loopOut: [...R([238, 241, 245, 251, 260, 272, 288, 308, 332, 358, 384, 410, 434, 456, 474, 488, 499, 507, 513, 518, 521, 524], 4), ...Cl([294], -3), [MID, c299[3]]],
    loopIn: [[MID, c299[1]], ...R([260, 262, 266, 272, 282, 296, 314, 336, 360, 385, 410, 435, 458, 476, 490, 500, 507, 512, 516, 518], 5), [MID, c299[2]]],
    // плечо «m»: тонкая ветвь из узла, горб, толстая ножка с засечками у основания
    shoulder: [
      // нижний край ветви и низ горба, потом внутренний край ножки
      [...R([238, 236, 233, 229, 224], 4), ...Cl([278, 271, 262, 252, 241, 229, 217, 205, 193, 182, 172], 3), ...R([202, 207, 213, 220, 228, 237, 248, 261, 276, 293, 311, 330], 3)],
      [[legIn, 330.5], [legIn, 540]],
      [[legIn, 540], ...R([548, 550, 552, 554, 556, 558], 3), ...Cl([132, 136], 4), [X(141), baseTop + 0.3]],
      [[X(141), 568], [X(72), 568]], // низ засечек уходит в основание арки
      [[X(72), baseTop + 0.3], ...Cl([76, 80], 2), ...R([558, 556, 554, 552, 550, 548], 2), [legOut, 540]],
      [[legOut, 540], [legOut, 345]],
      // внешний край ножки, верх горба, верхний край ветви до стебля
      [[legOut, 345], ...R([330, 315, 300, 286, 273, 261, 250, 240, 231, 223, 216, 210, 205, 200, 196], 2), ...Cl([152, 160, 170, 182, 194, 206, 218, 230, 242, 254, 266, 277, 286, 291], 2), [X(295.5), 219.5]],
      [[stemMid, 222], [stemMid, 246]], // замыкание через узел, под стеблем и петлёй
    ],
    // оси штрихов: по ним идёт «перо» в масках. Начала и концы заходят за ось, чтобы половины перекрывались.
    axArch: [
      [[X(MID + 3), 16.4], [MID, 16.4], ...midC([264, 230, 197, 165, 135], 0, 1), ...midR([90, 118, 150, 185, 220, 255, 290], 0, 1), [aMid, 330]],
      [[aMid, 330], [aMid, baseMid]],
      [[aMid, baseMid], [X(MID + 3), baseMid]],
    ],
    axLoop: [[[X(MID + 2), 224], [X(MID - 2), 240], ...midR([262, 290, 320, 350, 380, 410, 440, 466, 488, 504, 514], 4, 5), [X(289), 520.6], [X(MID + 3), (c299[2] + c299[3]) / 2]]],
    axShoulder: [
      [[X(MID + 3), 234], ...midC([280, 260, 240, 220, 204, 190, 175], 2, 3), ...midR([200, 210, 222, 236, 252, 270, 292, 318, 345], 2, 3)],
      [[legMid, 345.5], [legMid, 580]],
    ],
  };
};
const [L, Rt] = [half(0), half(1)];

const out = {
  // viewBox по краям знака: 25 10 550 565.5
  shapes: {
    arch:
      closed([[L.aOut, bottom], L.archOut[0]], [...L.archOut, ...back(Rt.archOut)], [Rt.archOut[0], [Rt.aOut, bottom]]) +
      closed([[L.aIn, baseTop], L.archIn[0]], [...L.archIn, ...back(Rt.archIn)], [Rt.archIn[0], [Rt.aIn, baseTop]]),
    stem: closed(L.fillet, [L.fillet.at(-1), [L.stemX, 250]], [[Rt.stemX, 250], Rt.fillet.at(-1)], Rt.fillet.toReversed()),
    loop:
      closed([...L.loopOut, ...back(Rt.loopOut)], [Rt.loopOut[0], [stemMid + 5, 228]], [[stemMid + 5, 228], [stemMid - 5, 228]]) +
      closed([...L.loopIn, ...back(Rt.loopIn)]),
    m: [closed(...L.shoulder), closed(...Rt.shoulder)],
  },
  axes: {
    arch: [open(...L.axArch), open(...Rt.axArch)],
    stem: `M${n1(stemMid)},6V254`,
    loop: [open(...L.axLoop), open(...Rt.axLoop)],
    m: [open(...L.axShoulder), open(...Rt.axShoulder)],
  },
};

const i = process.argv.indexOf('--check');
if (i < 0) {
  writeFileSync('src/assets/mark.json', JSON.stringify(out, null, 1) + '\n');
  console.log('ok', JSON.stringify(out.shapes).length, 'символов контуров,', JSON.stringify(out.axes).length, 'осей');
} else {
  const s = out.shapes;
  const body = `<path d="${s.arch}" fill-rule="evenodd"/><path d="${s.stem}"/><path d="${s.loop}" fill-rule="evenodd"/><path d="${s.m[0]}"/><path d="${s.m[1]}"/>`;
  const svg = (k, fill, inner = body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W * k}" height="${H * k}" viewBox="0 0 ${W} ${H}" fill="${fill}">${inner}</svg>`);
  const mine = await sharp(svg(1, '#fff')).ensureAlpha().raw().toBuffer();
  let worst = 0, off = 0, sum = 0;
  for (let p = 0; p < W * H; p++) {
    const d = Math.abs(mine[p * 4 + 3] - data[p * C + 3]) / 255;
    worst = Math.max(worst, d); sum += d; if (d > 0.35) off++;
  }
  console.log(`расхождение альфы: макс ${worst.toFixed(2)}, пикселей с разницей > 0.35: ${off}, сумма ${sum.toFixed(0)} px из ${W * H}`);
  // наложение: оригинал красным, перерисовка голубым; совпадение даёт белый. Оси пурпурным.
  const axes = Object.values(out.axes).flat().map((d) => `<path d="${d}" fill="none" stroke="#f0f" stroke-width=".7"/>`).join('');
  const k = 3;
  const orig = await sharp('public/logo-mark.png').resize(W * k, H * k, { kernel: 'cubic' }).ensureAlpha().raw().toBuffer();
  const redraw = await sharp(svg(k, '#fff')).ensureAlpha().raw().toBuffer();
  const mix = Buffer.alloc(W * k * H * k * 3);
  for (let p = 0; p < W * k * H * k; p++) { mix[p * 3] = orig[p * 4 + 3]; mix[p * 3 + 1] = mix[p * 3 + 2] = redraw[p * 4 + 3]; }
  await sharp(mix, { raw: { width: W * k, height: H * k, channels: 3 } })
    .composite(process.argv.includes('--axes') ? [{ input: svg(k, 'none', axes) }] : [])
    .png().toFile(process.argv[i + 1]);
  console.log(process.argv[i + 1]);
}
