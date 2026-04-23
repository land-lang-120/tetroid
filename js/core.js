/** @module core - Core Tetris mechanics: rotate, collide, lock, clear, hold */

import { S } from './state.js';
import { COLS, ROWS, BASE } from './config.js';
import { HAPTICS, vibe } from './haptics.js';
import { sfxLock, sfxLine } from './audio.js';
import { addParticles } from './particles.js';
import { updateHUD, floatScore } from './hud.js';
import { spawnPiece } from './pieces.js';
import { triggerLevelUp } from './level-up.js';

/**
 * @description Rotate a shape matrix 90 degrees clockwise
 * @param {number[][]} s - Shape matrix
 * @returns {number[][]} Rotated shape
 */
export function rotate(s) {
  return Array.from({ length: s[0].length }, (_, c) =>
    Array.from({ length: s.length }, (_, r) => s[s.length - 1 - r][c])
  );
}

/**
 * @description Check if a shape collides with the grid or borders
 * @param {number[][]} s - Shape matrix
 * @param {number} px - X position
 * @param {number} py - Y position
 * @returns {boolean} True if collision detected
 */
export function collides(s, px, py) {
  for (let r = 0; r < s.length; r++)
    for (let c = 0; c < s[r].length; c++)
      if (s[r][c]) {
        const nx = px + c, ny = py + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && S.grid[ny][nx]) return true;
      }
  return false;
}

/**
 * @description Lock the current piece into the grid
 */
export function lock() {
  S.current.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v && S.current.y + r >= 0)
        S.grid[S.current.y + r][S.current.x + c] = S.current.color;
    })
  );
  vibe(HAPTICS.lock);
  sfxLock();
  clearLines();
  S.canHold = true;
  spawnPiece();
}

/**
 * @description Check and clear completed lines, update score/level
 */
export function clearLines() {
  let cl = 0;
  const prevLevel = S.level;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (S.grid[r].every(c => c)) {
      S.grid.splice(r, 1);
      S.grid.unshift(Array(COLS).fill(0));
      cl++;
      r++;
    }
  }
  if (cl > 0) {
    S.combo = Math.min(S.combo + 1, 8);
    const pts = [0, 100, 300, 600, 1000][cl] * S.level * S.combo;
    S.score += pts;
    S.lines += cl;
    S.level = Math.floor(S.lines / 15) + 1;
    S.dropInterval = Math.max(80, Math.round(BASE * Math.pow(0.95, S.level - 1)));
    const r2 = S.canvas.getBoundingClientRect();
    floatScore('+' + pts, r2.left + S.canvas.width / 2, r2.top + S.canvas.height * 0.4);
    const linePatterns = [null, HAPTICS.line1, HAPTICS.line2, HAPTICS.line3, HAPTICS.line4];
    vibe(linePatterns[Math.min(cl, 4)]);
    sfxLine(cl);
    addParticles(cl);
    if (S.level > prevLevel) triggerLevelUp(S.level);
  } else {
    S.combo = 1;
  }
  updateHUD();
}

/**
 * @description Clear lines silently (no particles/floatScore) for magnet cascade
 */
export function clearLinesSilent() {
  let cl = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (S.grid[r].every(c => c)) {
      S.grid.splice(r, 1);
      S.grid.unshift(Array(COLS).fill(0));
      cl++;
      r++;
    }
  }
  if (cl > 0) {
    S.combo = Math.min(S.combo + 1, 8);
    const pts = [0, 100, 300, 600, 1000][cl] * S.level * S.combo;
    S.score += pts;
    S.lines += cl;
    S.level = Math.floor(S.lines / 15) + 1;
    S.dropInterval = Math.max(80, Math.round(BASE * Math.pow(0.95, S.level - 1)));
    addParticles(cl);
    updateHUD();
  }
}

/**
 * @description Hold/swap the current piece
 */
export function holdPiece() {
  if (!S.canHold) return;
  S.canHold = false;
  if (!S.held) {
    S.held = { shape: S.current.shape.map(r => [...r]), color: S.current.color };
    spawnPiece();
  } else {
    const t = S.held;
    S.held = { shape: S.current.shape.map(r => [...r]), color: S.current.color };
    S.current = {
      ...t,
      x: Math.floor((COLS - t.shape[0].length) / 2),
      y: 0
    };
  }
}
