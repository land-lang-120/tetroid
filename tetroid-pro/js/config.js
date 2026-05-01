/** @module config - Game constants and piece definitions */

/** Piece definitions: shape matrices and candy colors */
export const DEFS = [
  { shape: [[1,1,1,1]],       color: '#00aaff' },  // I
  { shape: [[1,1],[1,1]],     color: '#ff9500' },  // O
  { shape: [[0,1,0],[1,1,1]], color: '#cc00cc' },  // T
  { shape: [[1,0,0],[1,1,1]], color: '#ff2020' },  // L
  { shape: [[0,0,1],[1,1,1]], color: '#ffcc00' },  // J
  { shape: [[0,1,1],[1,1,0]], color: '#00cc44' },  // S
  { shape: [[1,1,0],[0,1,1]], color: '#ff6090' },  // Z
];

/** Grid dimensions */
export const COLS = 10;
export const ROWS = 20;

/** Base drop interval in ms */
export const BASE = 650;

/** Level-up animation duration in ms */
export const LVL_DUR = 2800;

/** Firework colors */
export const FW_COLORS = [
  '#ff2020','#ffcc00','#00aaff','#00cc44','#cc00cc','#ff9500','#ff6090','#ffffff'
];

/** Particle colors */
export const PC = ['#00aaff','#ff2020','#ff9500','#00cc44','#cc00cc','#ffcc00','#ff6090'];

/** Game URL for sharing */
export const GAME_URL = 'https://tetroid.app';

/** Chest reward frequency (every N games) */
export const CHEST_EVERY = 5;

/** FOMO countdown duration in seconds */
export const FOMO_DUR = 5;

/** FOMO ring circumference (2*pi*26) */
export const RING_CIRC = 163.4;

/** Booster packs for shop */
export const PACKS = {
  basic:    { freeze: 3,  laser: 3,  meteor: 2,  magnet: 2  },
  value:    { freeze: 6,  laser: 6,  meteor: 4,  magnet: 4  },
  premium:  { freeze: 10, laser: 10, meteor: 7,  magnet: 7  },
  ultimate: { freeze: 16, laser: 16, meteor: 12, magnet: 12 },
};

/** Wheel of fortune prizes */
export const WHEEL_PRIZES = [
  { label: '❄️ ×1', color: '#1565c0', type: 'freeze', qty: 1 },
  { label: '💨',     color: '#37474f', type: 'none',   qty: 0 },
  { label: '⚡ ×1', color: '#f9a825', type: 'laser',  qty: 1 },
  { label: '💨',     color: '#455a64', type: 'none',   qty: 0 },
  { label: '☄️ ×1', color: '#e64a19', type: 'meteor', qty: 1 },
  { label: '🧲 ×1', color: '#6a1b9a', type: 'magnet', qty: 1 },
  { label: '💨',     color: '#37474f', type: 'none',   qty: 0 },
  { label: '❄️ ×2', color: '#0d47a1', type: 'freeze', qty: 2 },
  { label: '⚡ ×2', color: '#ff6f00', type: 'laser',  qty: 2 },
  { label: '💨',     color: '#455a64', type: 'none',   qty: 0 },
];

/** Booster description strings (shown once per type) */
export const BOOSTER_DESC = {
  freeze:  '❄️ FREEZE — Ralentit la chute pendant 20 sec',
  laser:   '⚡ LASER — Rase les 4 dernières lignes',
  meteor:  '☄️ MÉTÉORITE — Détruit 3 briques par colonne',
  magnet:  '🧲 AIMANT — Fait tomber les briques suspendues',
};

/** Settings defaults */
export const SETTINGS_DEFAULTS = {
  sound: true,
  vibro: true,
  theme: 'dark',
  lang:  'fr',
  moveSens: 5,
  dropSens: 5,
};

/** Tutorial localStorage key */
export const TUT_KEY = 'tb_tut_done';
