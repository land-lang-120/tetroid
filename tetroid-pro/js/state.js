/** @module state - Central game state store. All mutable state lives here. */

export const S = {
  // Grid
  grid: [],
  cols: 10,
  rows: 20,

  // Pieces
  current: null,
  nextPiece: null,
  held: null,
  canHold: true,
  bag: [],

  // Score & progression
  score: 0,
  bestScore: 0,
  level: 1,
  lines: 0,
  combo: 1,

  // Game flow
  running: false,
  gameOver: false,
  paused: false,

  // Drop timing
  dropInterval: 650,
  dropTimer: 0,
  lastTime: null,

  // Canvas references (set in main.js init)
  canvas: null,
  ctx: null,
  nCanvas: null,
  nctx: null,
  CELL: 32,

  // Boosters (quantities)
  boosters: { freeze: 0, laser: 0, meteor: 0, magnet: 0 },

  // Freeze state
  freezeActive: false,
  freezeTimer: 0,

  // Particle systems
  particles: [],
  meteorites: [],
  laserBeams: [],
  laserFlash: null,
  freezeFlakes: [],
  freezeCrystals: [],
  magnetWaves: [],
  magnetTrails: [],
  shockwaves: [],
  emberParts: [],

  // Level-up animation
  lvlUpActive: false,
  lvlUpTimer: 0,
  lvlUpNum: 0,
  fireworks: [],
  lvlBanner: null,
  lvlFlash: 0,
  lvlUpTimeouts: [],

  // Game-over animation
  goActive: false,
  goTimer: 0,
  goPhase: 0,
  goFlash: 0,
  goDebris: [],
  goColDone: 0,
  goColTimer: 0,

  // Touch input state
  ts0: null,
  tx0: 0,
  ty0: 0,
  tst: 0,
  htmt: null,
  touchOnPiece: false,

  // Touch sensitivity thresholds (dynamic)
  SWIPE_MOVE_THRESH: 0.6,
  SWIPE_DROP_THRESH: 1.6,

  // Leaderboard
  lbMode: 'all',
  pendingScore: null,

  // Tutorial
  tutSlide: 0,
  bubbleQueue: [],
  bubbleActive: false,

  // Monetization
  pausedByShop: false,
  fomoTimer: null,
  fomoSeconds: 5,
  wheelAngle: 0,
  wheelSpinning: false,
  wheelCountdownInterval: null,
  adTimer: null,
  adSec: 5,

  // Audio
  audioCtx: null,
  musicPlaying: false,
  musicInterval: null,
  nextNoteTime: 0,
  noteIndex: 0,
  schedIdx: 0,
  schedTime: 0,
};
