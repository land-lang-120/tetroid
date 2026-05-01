/** @module game-loop - Main requestAnimationFrame loop */

import { S } from './state.js';
import { BASE, COLS } from './config.js';
import { collides, lock } from './core.js';
import { updateParticles } from './particles.js';
import { updateMeteors, updateFreezeEffects, updateLaserBeams, updateMagnetWaves } from './boosters.js';
import { updateShockwaves } from './particles.js';
import { updateLevelUp, drawLevelUp } from './level-up.js';
import { draw, drawNext } from './rendering.js';

/**
 * @description Main game loop driven by requestAnimationFrame
 * @param {DOMHighResTimeStamp} ts - Current timestamp
 */
export function loop(ts) {
  if (!S.running) return;
  if (!S.lastTime) S.lastTime = ts;
  const dt = ts - S.lastTime;
  S.lastTime = ts;

  if (!S.paused && !S.gameOver) {
    // Freeze timer
    if (S.freezeActive) {
      S.freezeTimer -= dt;
      if (S.freezeTimer <= 0) {
        S.freezeActive = false;
        document.getElementById('freeze-overlay').style.display = 'none';
        S.dropInterval = Math.max(80, Math.round(BASE * Math.pow(0.95, S.level - 1)));
        S.freezeFlakes = [];
        S.freezeCrystals = [];
      }
    }
    // Drop logic
    S.dropTimer += dt;
    const iv = S.freezeActive ? BASE : S.dropInterval;
    if (S.dropTimer >= iv) {
      S.dropTimer -= iv;
      if (!collides(S.current.shape, S.current.x, S.current.y + 1)) S.current.y++;
      else lock();
    }
    // Update effects
    updateParticles(dt);
    updateMeteors();
    updateFreezeEffects(dt);
    updateLaserBeams(dt);
    updateMagnetWaves(dt);
    updateShockwaves(dt);
  }

  // Level-up always updates (even paused)
  updateLevelUp(dt);
  draw();
  drawNext();
  if (S.lvlUpActive) drawLevelUp();

  requestAnimationFrame(loop);
}
