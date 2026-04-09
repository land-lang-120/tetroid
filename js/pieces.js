/** @module pieces - Bag randomizer and piece spawning */

import { S } from './state.js';
import { DEFS, COLS } from './config.js';
import { collides } from './core.js';
import { endGame } from './game-flow.js';

/**
 * @description Refill the bag with a shuffled copy of all piece definitions
 */
export function nextBag() {
  S.bag = [...DEFS].sort(() => Math.random() - 0.5);
}

/**
 * @description Pull the next piece from the bag (refill if empty)
 * @returns {Object} Piece object with shape, color, x, y
 */
export function fromBag() {
  if (!S.bag.length) nextBag();
  const d = S.bag.pop();
  return { shape: d.shape.map(r => [...r]), color: d.color, x: 0, y: 0 };
}

/**
 * @description Spawn the next piece as the current piece, generate a new next
 */
export function spawnPiece() {
  S.current = S.nextPiece;
  S.nextPiece = fromBag();
  S.current.x = Math.floor((COLS - S.current.shape[0].length) / 2);
  S.current.y = 0;
  if (collides(S.current.shape, S.current.x, S.current.y)) endGame();
}
