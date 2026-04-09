/** @module level-up - Level-up animation: flash, fireworks, banner */

import { S } from './state.js';
import { LVL_DUR, FW_COLORS } from './config.js';
import { HAPTICS, vibe } from './haptics.js';
import { sfxLevelUp } from './audio.js';
import { TRANSLATIONS } from './translations.js';
import { detectLang } from './settings.js';

/**
 * @description Trigger the level-up animation sequence
 * @param {number} newLevel - The new level number
 */
export function triggerLevelUp(newLevel) {
  S.lvlUpTimeouts.forEach(id => clearTimeout(id));
  S.lvlUpTimeouts = [];

  S.lvlUpActive = true;
  S.lvlUpTimer = LVL_DUR;
  S.lvlUpNum = newLevel;
  S.lvlFlash = 1.0;
  S.fireworks = [];
  S.lvlBanner = { x: -S.canvas.width, targetX: 0 };
  vibe(HAPTICS.levelUp);
  sfxLevelUp();

  const cols = [0.2, 0.5, 0.8];
  cols.forEach((cx2, i) => {
    S.lvlUpTimeouts.push(
      setTimeout(() => launchFirework(cx2 * S.canvas.width, S.canvas.height), 300 + i * 180)
    );
    S.lvlUpTimeouts.push(
      setTimeout(() => launchFirework((cx2 + 0.15 * (Math.random() - 0.5)) * S.canvas.width, S.canvas.height), 800 + i * 180)
    );
  });

  ['freeze', 'laser', 'meteor', 'magnet'].forEach((t, i) => {
    const el = document.getElementById('bi-' + t) || document.querySelector('.bi.' + t);
    if (!el) return;
    S.lvlUpTimeouts.push(setTimeout(() => {
      el.style.transition = 'transform .15s';
      el.style.transform = 'scale(1.3) translateZ(0)';
      S.lvlUpTimeouts.push(setTimeout(() => el.style.transform = 'scale(1) translateZ(0)', 220));
    }, 200 + i * 90));
  });

  const hud = document.getElementById('hud');
  hud.style.transition = 'box-shadow .15s';
  hud.style.boxShadow = '0 0 35px rgba(255,210,0,1)';
  S.lvlUpTimeouts.push(setTimeout(() => hud.style.boxShadow = '', 700));
}

function launchFirework(sx, sy) {
  const { canvas } = S;
  const tx = sx + (Math.random() - 0.5) * canvas.width * 0.4;
  const ty = canvas.height * (0.05 + Math.random() * 0.45);
  const steps = 16 + Math.floor(Math.random() * 6);
  S.fireworks.push({
    x: sx, y: sy, tx, ty,
    vx: (tx - sx) / steps, vy: (ty - sy) / steps,
    arriving: true,
    color: FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)],
    burst: []
  });
}

/**
 * @description Update fireworks animation
 * @param {number} dt - Delta time in ms
 */
export function updateFireworks(dt) {
  S.fireworks = S.fireworks.filter(fw => {
    if (fw.arriving) {
      fw.x += fw.vx; fw.y += fw.vy;
      if (Math.hypot(fw.tx - fw.x, fw.ty - fw.y) < 6) {
        fw.arriving = false;
        const n = 18 + Math.floor(Math.random() * 10);
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 / n) * i + Math.random() * 0.2;
          const sp = 2 + Math.random() * 5;
          fw.burst.push({
            x: fw.tx, y: fw.ty,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 500 + Math.random() * 400, maxLife: 900,
            size: 1.5 + Math.random() * 2.5,
            gravity: 0.07
          });
        }
      }
      return true;
    }
    fw.burst = fw.burst.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity;
      p.vx *= 0.96; p.vy *= 0.96;
      p.life -= dt;
      return p.life > 0;
    });
    return fw.burst.length > 0;
  });
}

/**
 * @description Draw firework rockets and bursts
 */
export function drawFireworks() {
  const { ctx } = S;
  ctx.save();
  ctx.shadowBlur = 0;
  S.fireworks.forEach(fw => {
    if (fw.arriving) {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = fw.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fw.x, fw.y);
      ctx.lineTo(fw.x - fw.vx * 3, fw.y - fw.vy * 3);
      ctx.stroke();
    } else {
      fw.burst.forEach(p => {
        const a = p.life / p.maxLife;
        ctx.globalAlpha = a;
        ctx.fillStyle = fw.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * Math.max(0.15, a), 0, Math.PI * 2);
        ctx.fill();
      });
    }
  });
  ctx.restore();
}

/**
 * @description Draw the level-up overlay (flash, text, banner, fireworks)
 */
export function drawLevelUp() {
  if (!S.lvlUpActive) return;

  const { canvas, ctx } = S;
  const elapsed = LVL_DUR - S.lvlUpTimer;
  const fadeOut = Math.max(0, Math.min(1, S.lvlUpTimer / 600));
  const cx2 = canvas.width / 2;
  const cy2 = canvas.height / 2;
  const lvlWord = (TRANSLATIONS[localStorage.getItem('tb_lang') || detectLang()] || TRANSLATIONS.en).niveau || 'LEVEL';

  ctx.save();

  // Phase 1: White flash
  if (S.lvlFlash > 0) {
    ctx.globalAlpha = S.lvlFlash * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Phase 1: Explosive central text
  if (elapsed < 700) {
    const p1 = elapsed / 700;
    const scale = 0.3 + p1 * 1.4 - p1 * p1 * 0.7;
    const alpha = p1 < 0.5 ? p1 * 2 : (1 - p1) * 2 + 0.6;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha) * fadeOut;
    ctx.translate(cx2, cy2);
    ctx.scale(scale, scale);
    ctx.shadowColor = 'rgba(255,180,0,0.9)'; ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(255,220,0,0.18)';
    ctx.beginPath(); ctx.arc(0, 0, canvas.width * 0.35, 0, Math.PI * 2); ctx.fill();
    const fs = Math.max(14, canvas.height * 0.045);
    ctx.font = `900 ${fs}px 'Lilita One',sans-serif`;
    ctx.fillStyle = 'rgba(255,240,150,0.85)';
    ctx.textAlign = 'center'; ctx.shadowBlur = 12;
    ctx.fillText(lvlWord.toUpperCase(), 0, -fs * 1.1);
    const fsN = Math.max(36, canvas.height * 0.13);
    ctx.font = `900 ${fsN}px 'Lilita One',sans-serif`;
    ctx.shadowColor = 'rgba(255,140,0,1)'; ctx.shadowBlur = 30;
    ctx.strokeStyle = '#7a3800'; ctx.lineWidth = 5;
    ctx.strokeText(S.lvlUpNum, 0, fsN * 0.38);
    ctx.fillStyle = '#ffe566';
    ctx.fillText(S.lvlUpNum, 0, fsN * 0.38);
    const starR = canvas.width * 0.28;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 / 8) * i + elapsed * 0.003;
      const r = starR * Math.min(1, p1 * 2);
      ctx.font = `${fs * 0.9}px serif`;
      ctx.fillStyle = '#ffe566';
      ctx.shadowColor = 'rgba(255,200,0,.8)'; ctx.shadowBlur = 8;
      ctx.fillText('★', Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.restore();
  }

  // Phase 2: Fireworks
  if (elapsed > 300) {
    ctx.globalAlpha = fadeOut;
    drawFireworks();
  }

  // Phase 2: Banner
  if (elapsed > 400 && S.lvlBanner) {
    const slideProgress = Math.min(1, (elapsed - 400) / 300);
    const ease = 1 - Math.pow(1 - slideProgress, 3);
    S.lvlBanner.x = -canvas.width * (1 - ease);
    const bw = canvas.width, bh = Math.max(38, canvas.height * 0.1);
    const by = canvas.height * 0.38;
    ctx.save();
    ctx.globalAlpha = fadeOut;
    ctx.translate(S.lvlBanner.x, 0);
    const bg = ctx.createLinearGradient(0, by, 0, by + bh);
    bg.addColorStop(0, '#6a3800'); bg.addColorStop(0.3, '#d08000');
    bg.addColorStop(0.55, '#f0b000'); bg.addColorStop(1, '#3a1800');
    ctx.fillStyle = bg;
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 20;
    ctx.fillRect(0, by, bw, bh);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, by, bw, bh * 0.35);
    ctx.strokeStyle = '#ffe566'; ctx.lineWidth = 2.5;
    ctx.strokeRect(2, by + 2, bw - 4, bh - 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    ctx.strokeRect(5, by + 5, bw - 10, bh - 10);
    const fs2 = Math.max(14, bh * 0.32);
    ctx.textAlign = 'center';
    ctx.font = `900 ${fs2 * 0.65}px 'Lilita One',sans-serif`;
    ctx.fillStyle = 'rgba(255,235,120,.75)';
    ctx.fillText('✦  ' + lvlWord.toUpperCase() + '  ✦', bw / 2, by + bh * 0.4);
    const pulse = 1 + Math.sin(elapsed * 0.008) * 0.04;
    ctx.save();
    ctx.translate(bw / 2, by + bh * 0.82);
    ctx.scale(pulse, pulse);
    ctx.font = `900 ${fs2 * 1.1}px 'Lilita One',sans-serif`;
    ctx.strokeStyle = '#7a3800'; ctx.lineWidth = 3.5;
    ctx.shadowColor = 'rgba(255,140,0,.9)'; ctx.shadowBlur = 18;
    ctx.strokeText(S.lvlUpNum, 0, 0);
    ctx.fillStyle = '#ffe566'; ctx.fillText(S.lvlUpNum, 0, 0);
    ctx.restore();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * @description Update level-up animation timer
 * @param {number} dt - Delta time in ms
 */
export function updateLevelUp(dt) {
  if (!S.lvlUpActive) return;
  S.lvlUpTimer -= dt;
  if (S.lvlFlash > 0) S.lvlFlash = Math.max(0, S.lvlFlash - 0.038);
  updateFireworks(dt);
  if (S.lvlUpTimer <= 0) {
    S.lvlUpActive = false;
    S.fireworks = [];
    S.lvlBanner = null;
    S.lvlFlash = 0;
    S.lvlUpTimeouts = [];
  }
}
