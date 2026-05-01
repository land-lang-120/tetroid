/** @module particles - Particle systems: line clear, explosions, shockwaves, embers */

import { S } from './state.js';
import { PC } from './config.js';

/**
 * @description Add line-clear celebration particles
 * @param {number} cl - Number of lines cleared
 */
export function addParticles(cl) {
  const { canvas } = S;
  for (let i = 0; i < cl * 24; i++) {
    S.particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.7 + canvas.height * 0.15,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 700 + Math.random() * 500,
      maxLife: 1200,
      color: PC[Math.floor(Math.random() * PC.length)],
      size: 3 + Math.random() * 5,
      round: true
    });
  }
}

/**
 * @description Add an explosion burst of particles at position
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {string} col - Color
 */
export function addExplosion(x, y, col) {
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 3 + Math.random() * 10;
    S.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 500 + Math.random() * 500,
      maxLife: 1000,
      color: col,
      size: 2 + Math.random() * 5,
      round: true
    });
  }
}

/**
 * @description Update all particles (gravity + decay)
 * @param {number} dt - Delta time in ms
 */
export function updateParticles(dt) {
  S.particles = S.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life -= dt;
    return p.life > 0;
  });
}

// ── Shockwaves (meteor impacts) ──

/**
 * @description Add a shockwave ring + ember debris at an impact point
 * @param {number} x - Center X
 * @param {number} y - Center Y
 */
export function addShockwave(x, y) {
  S.shockwaves.push({ x, y, r: 0, life: 500, maxLife: 500 });
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI + Math.random() * Math.PI;
    const sp = 3 + Math.random() * 7;
    S.emberParts.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 4,
      life: 600 + Math.random() * 400,
      maxLife: 1000,
      size: 2 + Math.random() * 4,
      color: '#ffd740'
    });
  }
}

/**
 * @description Spawn ambient embers during meteor rain
 */
export function spawnEmbers() {
  const { canvas } = S;
  for (let i = 0; i < 3; i++) {
    S.emberParts.push({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 1 + Math.random() * 2,
      life: 800 + Math.random() * 600,
      maxLife: 1400,
      size: 1 + Math.random() * 2,
      color: Math.random() > 0.5 ? '#ffd740' : '#ff8c00'
    });
  }
}

/**
 * @description Update shockwaves and embers
 * @param {number} dt - Delta time in ms
 */
export function updateShockwaves(dt) {
  S.shockwaves = S.shockwaves.filter(s => { s.r += 6; s.life -= dt; return s.life > 0; });
  S.emberParts = S.emberParts.filter(e => {
    e.x += e.vx; e.y += e.vy; e.vy += 0.15; e.life -= dt;
    return e.life > 0;
  });
}

/**
 * @description Draw shockwave rings and ember particles
 */
export function drawShockwaves() {
  const { ctx } = S;
  S.shockwaves.forEach(s => {
    const a = s.life / s.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(255,${Math.floor(180 * a)},0,${a * 0.8})`;
    ctx.lineWidth = 3 * a;
    ctx.shadowColor = '#ff8c00';
    ctx.shadowBlur = 20 * a;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.stroke();
    if (s.r > 4) {
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
      ctx.lineWidth = 1.5 * a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
  S.emberParts.forEach(e => {
    const a = e.life / e.maxLife;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}
