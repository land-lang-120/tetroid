/** @module rendering - Canvas drawing: grid, cells, ghost, next piece, effects */

import { S } from './state.js';
import { COLS, ROWS } from './config.js';
import { collides } from './core.js';
import { drawMagnetWaves } from './boosters.js';
import { drawShockwaves } from './particles.js';
import { drawLaserBeams, drawFreezeEffects } from './boosters.js';
import { TRANSLATIONS } from './translations.js';
import { detectLang } from './settings.js';

/**
 * @description Convert hex color to RGB components
 */
export function hex2rgb(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * @description Lighten a hex color by amount
 */
export function lc(h, a) {
  const { r, g, b } = hex2rgb(h);
  return `rgb(${Math.min(255, r + a)},${Math.min(255, g + a)},${Math.min(255, b + a)})`;
}

/**
 * @description Darken a hex color by amount
 */
export function dc(h, a) {
  const { r, g, b } = hex2rgb(h);
  return `rgb(${Math.max(0, r - a)},${Math.max(0, g - a)},${Math.max(0, b - a)})`;
}

/**
 * @description Draw a single candy-styled cell on a canvas context
 * @param {CanvasRenderingContext2D} cx - Target context
 * @param {number} x - X pixel position
 * @param {number} y - Y pixel position
 * @param {string} col - Hex color
 * @param {number} [sz] - Cell size (defaults to S.CELL)
 */
export function drawCell(cx, x, y, col, sz) {
  sz = Math.max(4, sz || S.CELL);
  const pad = Math.max(1, sz * 0.06);
  const inn = Math.max(0, sz - pad * 2);
  const rx  = Math.max(0, inn * 0.22);
  const bx  = x + pad;
  const by  = y + pad;

  cx.save();

  function rr(cx2, bx2, by2, w, h, r2) {
    r2 = Math.max(0, Math.min(r2, w / 2, h / 2));
    if (r2 === 0) { cx2.beginPath(); cx2.rect(bx2, by2, w, h); return; }
    cx2.beginPath();
    cx2.moveTo(bx2 + r2, by2);
    cx2.arcTo(bx2 + w, by2,   bx2 + w, by2 + r2, r2);
    cx2.arcTo(bx2 + w, by2 + h, bx2 + w - r2, by2 + h, r2);
    cx2.arcTo(bx2,     by2 + h, bx2,   by2 + h - r2, r2);
    cx2.arcTo(bx2,     by2,     bx2 + r2, by2,       r2);
    cx2.closePath();
  }

  // Shadow
  cx.shadowColor = 'rgba(0,0,0,0.5)';
  cx.shadowBlur = sz * 0.2;
  cx.shadowOffsetY = sz * 0.1;

  // Body - radial gradient
  try {
    const gBody = cx.createRadialGradient(
      bx + Math.max(0, inn * 0.3), by + Math.max(0, inn * 0.25), Math.max(0, inn * 0.05),
      bx + Math.max(0, inn * 0.5), by + Math.max(0, inn * 0.5), Math.max(1, inn * 0.75)
    );
    gBody.addColorStop(0, lc(col, 65));
    gBody.addColorStop(0.45, lc(col, 12));
    gBody.addColorStop(1, dc(col, 42));
    cx.fillStyle = gBody;
  } catch (e) {
    cx.fillStyle = col;
  }
  rr(cx, bx, by, inn, inn, rx);
  cx.fill();

  cx.shadowBlur = 0;
  cx.shadowOffsetY = 0;

  // Border
  cx.strokeStyle = lc(col, 28);
  cx.lineWidth = Math.max(1, sz * 0.04);
  rr(cx, bx, by, inn, inn, rx);
  cx.stroke();

  // Highlight oval
  cx.save();
  rr(cx, bx, by, inn, inn, rx);
  cx.clip();
  const gRef = cx.createLinearGradient(bx, by, bx + inn * 0.5, by + inn * 0.5);
  gRef.addColorStop(0, 'rgba(255,255,255,0.88)');
  gRef.addColorStop(0.45, 'rgba(255,255,255,0.28)');
  gRef.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = gRef;
  cx.fillRect(bx, by, inn * 0.65, inn * 0.5);
  cx.restore();

  // Specular dot
  cx.beginPath();
  cx.arc(bx + inn * 0.2, by + inn * 0.18, inn * 0.07, 0, Math.PI * 2);
  cx.fillStyle = 'rgba(255,255,255,0.95)';
  cx.fill();

  // Bottom shine
  cx.save();
  rr(cx, bx, by, inn, inn, rx);
  cx.clip();
  cx.fillStyle = 'rgba(255,255,255,0.12)';
  cx.fillRect(bx, by + inn * 0.7, inn, inn * 0.3);
  cx.restore();

  cx.restore();
}

/**
 * @description Main draw function: grid, current piece, ghost, particles, effects
 */
export function draw() {
  const { canvas, ctx, grid, current } = S;
  const CELL = S.CELL;
  const isLight = document.body.classList.contains('light');
  ctx.fillStyle = isLight ? '#fff8e1' : '#06080f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Light corridor for active columns
  const activeCols = new Set();
  current.shape.forEach((row, r) =>
    row.forEach((v, c) => { if (v) activeCols.add(current.x + c); })
  );
  const { r: cr, g: cg, b: cb } = hex2rgb(current.color);
  activeCols.forEach(col => {
    if (col < 0 || col >= COLS) return;
    const grd = ctx.createLinearGradient(col * CELL, 0, col * CELL, canvas.height);
    grd.addColorStop(0, `rgba(${cr},${cg},${cb},0.0)`);
    grd.addColorStop(0.35, `rgba(${cr},${cg},${cb},0.06)`);
    grd.addColorStop(0.7, `rgba(${cr},${cg},${cb},0.13)`);
    grd.addColorStop(1, `rgba(${cr},${cg},${cb},0.07)`);
    ctx.fillStyle = grd;
    ctx.fillRect(col * CELL, 0, CELL, canvas.height);
    ctx.save();
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.22)`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(col * CELL, 0); ctx.lineTo(col * CELL, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo((col + 1) * CELL, 0); ctx.lineTo((col + 1) * CELL, canvas.height); ctx.stroke();
    ctx.restore();
  });

  // Grid lines
  ctx.strokeStyle = isLight ? 'rgba(255,152,0,0.08)' : 'rgba(245,197,24,0.055)';
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, canvas.height); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(canvas.width, r * CELL); ctx.stroke();
  }

  // Locked blocks
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c]) drawCell(ctx, c * CELL, r * CELL, grid[r][c]);

  // Ghost piece
  let gy = current.y;
  while (!collides(current.shape, current.x, gy + 1)) gy++;
  if (gy > current.y) {
    ctx.save();
    ctx.globalAlpha = 0.17;
    current.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v) drawCell(ctx, (current.x + c) * CELL, (gy + r) * CELL, current.color);
      })
    );
    ctx.restore();
  }

  // Current piece
  current.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v && current.y + r >= 0)
        drawCell(ctx, (current.x + c) * CELL, (current.y + r) * CELL, current.color);
    })
  );

  // Particles
  S.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(p.x - p.size * 0.15, p.y - p.size * 0.15, p.size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Magnet waves
  drawMagnetWaves();

  // Meteorites
  S.meteorites.forEach(m => {
    ctx.save();
    const cx2 = m.col * CELL + CELL / 2;
    const trailLen = Math.min(canvas.height, 220 + m.trail.length * 8);
    const trailTop = m.y - trailLen;

    const tGrad = ctx.createLinearGradient(cx2, trailTop, cx2, m.y);
    tGrad.addColorStop(0, 'rgba(255,200,0,0)');
    tGrad.addColorStop(0.4, 'rgba(255,140,0,0.08)');
    tGrad.addColorStop(0.75, 'rgba(255,80,0,0.22)');
    tGrad.addColorStop(1, 'rgba(255,220,80,0.55)');
    ctx.fillStyle = tGrad;
    ctx.fillRect(m.col * CELL, trailTop, CELL, trailLen);

    const lGrad = ctx.createLinearGradient(cx2, trailTop, cx2, m.y);
    lGrad.addColorStop(0, 'rgba(255,255,200,0)');
    lGrad.addColorStop(0.5, 'rgba(255,220,50,0.15)');
    lGrad.addColorStop(0.85, 'rgba(255,255,100,0.7)');
    lGrad.addColorStop(1, 'rgba(255,255,255,0.95)');
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx2, trailTop);
    ctx.lineTo(cx2, m.y - CELL / 2);
    ctx.stroke();

    m.trail.forEach((t, i) => {
      if (i % 2 !== 0) return;
      const a = (i / m.trail.length) * 0.6;
      const spread = (Math.sin(i * 2.5 + m.y * 0.05)) * CELL * 0.35;
      ctx.globalAlpha = a;
      ctx.fillStyle = i > m.trail.length * 0.6 ? '#ffdd00' : '#ff6600';
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(cx2 + spread, t.y, 1.5 + a * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    const pad2 = 2, sz2 = CELL - pad2 * 2, mx = m.col * CELL + pad2;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 22;
    ctx.fillStyle = 'rgba(255,100,0,0.35)';
    ctx.fillRect(m.col * CELL - 2, m.y - CELL / 2 - 2, CELL + 4, CELL + 4);

    const fGrad = ctx.createRadialGradient(
      mx + sz2 * 0.35, m.y - sz2 * 0.1, Math.max(0, sz2 * 0.05),
      mx + sz2 * 0.5, m.y, Math.max(1, sz2 * 0.6)
    );
    fGrad.addColorStop(0, '#fffbe0');
    fGrad.addColorStop(0.25, '#ffdd00');
    fGrad.addColorStop(0.6, '#ff6600');
    fGrad.addColorStop(1, '#cc2200');
    ctx.fillStyle = fGrad;
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 16;
    ctx.fillRect(mx, m.y - sz2 / 2, sz2, sz2);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.shadowBlur = 0;
    ctx.fillRect(mx + 2, m.y - sz2 / 2 + 2, sz2 * 0.4, sz2 * 0.2);

    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 10;
    ctx.strokeRect(mx, m.y - sz2 / 2, sz2, sz2);

    ctx.restore();
  });

  // Shockwaves
  drawShockwaves();
  // Laser beams
  drawLaserBeams();
  // Freeze effects
  drawFreezeEffects();
}

/**
 * @description Draw the next piece preview
 */
export function drawNext() {
  const { nCanvas, nctx } = S;
  const w = nCanvas.width, h = nCanvas.height;
  nctx.clearRect(0, 0, w, h);
  if (!S.nextPiece) return;
  const sz = Math.min(w / S.nextPiece.shape[0].length, h / S.nextPiece.shape.length, 11);
  const ox = (w - S.nextPiece.shape[0].length * sz) / 2;
  const oy = (h - S.nextPiece.shape.length * sz) / 2;
  S.nextPiece.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) drawCell(nctx, ox + c * sz, oy + r * sz, S.nextPiece.color, sz);
    })
  );
}
