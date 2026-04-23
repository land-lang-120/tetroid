/** @module input - Touch and keyboard input handlers */

import { S } from './state.js';
import { COLS, ROWS } from './config.js';
import { HAPTICS, vibe } from './haptics.js';
import { rotate, collides, lock, holdPiece } from './core.js';
import { sfxHardDrop, sfxRotate } from './audio.js';
import { updateHUD } from './hud.js';
import { togglePause } from './game-flow.js';

/**
 * @description Check if a touch point is on or above the current piece
 */
function isTouchOnPiece(clientX, clientY) {
  const rect = S.canvas.getBoundingClientRect();
  const scaleY = S.canvas.height / rect.height;
  const canvasY = (clientY - rect.top) * scaleY;
  const pieceBottomY = (S.current.y + S.current.shape.length) * S.CELL;
  if (canvasY > pieceBottomY) return false;
  return true;
}

/**
 * @description Initialize all touch and keyboard event listeners
 */
export function initInput() {
  const { canvas } = S;

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    S.ts0 = { x: t.clientX, y: t.clientY };
    S.tx0 = t.clientX;
    S.ty0 = t.clientY;
    S.tst = Date.now();
    S.touchOnPiece = isTouchOnPiece(t.clientX, t.clientY);

    if (S.touchOnPiece) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const gx = Math.floor(((t.clientX - rect.left) * scaleX) / S.CELL);
      const gy = Math.floor(((t.clientY - rect.top) * scaleY) / S.CELL);
      const directlyOnBlock = S.current.shape.some((row, r) =>
        row.some((v, c) => v && S.current.x + c === gx && S.current.y + r === gy)
      );
      if (directlyOnBlock) {
        S.htmt = setTimeout(() => { holdPiece(); S.ts0 = null; S.touchOnPiece = false; }, 440);
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!S.ts0) return;
    const t = e.touches[0];
    const dx = t.clientX - S.tx0;
    const dy = t.clientY - S.ty0;
    const adx = Math.abs(dx), ady = Math.abs(dy);

    if (adx > S.CELL * 0.4 || ady > S.CELL * 0.4) clearTimeout(S.htmt);

    if (adx > S.CELL * S.SWIPE_MOVE_THRESH && adx > ady * 1.1) {
      const d = dx > 0 ? 1 : -1;
      if (!collides(S.current.shape, S.current.x + d, S.current.y)) {
        S.current.x += d;
        vibe(HAPTICS.move);
      }
      S.tx0 = t.clientX;
      return;
    }

    if (S.touchOnPiece && dy > 0 && ady > S.CELL * 0.75 && adx < S.CELL * 0.5) {
      if (!collides(S.current.shape, S.current.x, S.current.y + 1)) {
        S.current.y++;
        S.score++;
        updateHUD();
      }
      S.ty0 = t.clientY;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    clearTimeout(S.htmt);
    if (!S.ts0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - S.ts0.x;
    const dy = t.clientY - S.ts0.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    const dur = Date.now() - S.tst;

    // Hard drop
    if (S.touchOnPiece && dy > S.CELL * S.SWIPE_DROP_THRESH && adx < S.CELL * 1.8 && dur < 360) {
      vibe(HAPTICS.hardDrop);
      sfxHardDrop();
      while (!collides(S.current.shape, S.current.x, S.current.y + 1)) { S.current.y++; S.score += 2; }
      lock();
      updateHUD();
      S.ts0 = null;
      S.touchOnPiece = false;
      return;
    }

    // Rotation (tap)
    const wasVerticalSwipe = S.touchOnPiece && dy > S.CELL * 0.8;
    if (!wasVerticalSwipe && adx < S.CELL * 0.6 && ady < S.CELL * 0.6 && dur < 420) {
      const rot = rotate(S.current.shape);
      let nx = S.current.x;
      if (collides(rot, nx, S.current.y)) {
        if      (!collides(rot, nx + 1, S.current.y)) nx++;
        else if (!collides(rot, nx - 1, S.current.y)) nx--;
        else if (!collides(rot, nx + 2, S.current.y)) nx += 2;
        else if (!collides(rot, nx - 2, S.current.y)) nx -= 2;
        else { S.ts0 = null; S.touchOnPiece = false; return; }
      }
      S.current.shape = rot;
      S.current.x = nx;
      vibe(HAPTICS.rotate);
      sfxRotate();
    }

    S.ts0 = null;
    S.touchOnPiece = false;
  }, { passive: false });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!S.running || S.gameOver) return;
    if (e.key === 'ArrowLeft' && !collides(S.current.shape, S.current.x - 1, S.current.y)) S.current.x--;
    if (e.key === 'ArrowRight' && !collides(S.current.shape, S.current.x + 1, S.current.y)) S.current.x++;
    if (e.key === 'ArrowDown') {
      if (!collides(S.current.shape, S.current.x, S.current.y + 1)) { S.current.y++; S.score++; }
      else lock();
    }
    if (e.key === 'ArrowUp') {
      const r = rotate(S.current.shape);
      if (!collides(r, S.current.x, S.current.y)) S.current.shape = r;
    }
    if (e.key === ' ') {
      while (!collides(S.current.shape, S.current.x, S.current.y + 1)) { S.current.y++; S.score += 2; }
      lock();
    }
    if (e.key === 'c' || e.key === 'C') holdPiece();
    if (e.key === 'p' || e.key === 'Escape') togglePause();
    updateHUD();
    e.preventDefault();
  });
}
