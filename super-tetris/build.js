/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Build script
   ═══════════════════════════════════════════════════════════════════
   Transpile tous les .js et .jsx de src/ vers un seul bundle.js
   à la racine. Aucun runtime Babel n'est embarqué côté client (le
   bundle est ES5+ pur, prêt à exécuter dans tous les navigateurs).

   Run : node build.js

   Pattern hérité de Byer (qui a la même approche pour ne pas dépendre
   de Babel standalone côté client — trop lent sur mobile bas de gamme).
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

// Ordre d'inclusion important :
// 1. Game logic (window.STxxx) chargée AVANT les composants qui les utilisent
// 2. Hooks AVANT les composants qui les utilisent
// 3. Components dans l'ordre de dépendance (Starfield avant les autres)
// 4. App.jsx en avant-dernier
// 5. main.jsx en dernier (mount React)
const FILES = [
  // ─── Game logic (no React, just window.STxxx exports) ─────
  'src/game/pieces.js',
  'src/game/bag.js',
  'src/game/core.js',
  'src/game/scoring.js',
  'src/game/render.js',

  // ─── Hooks (window.useXxx exports) ─────────────────────────
  'src/hooks/useGameLoop.js',
  'src/hooks/useStorage.js',

  // ─── Components (window.Xxx exports, ordre de dépendance) ─
  'src/components/Starfield.jsx',
  'src/components/HUD.jsx',
  'src/components/BoosterButtons.jsx',
  'src/components/RewardedAd.jsx',
  'src/components/LoadingScreen.jsx',
  'src/components/HomeScreen.jsx',
  'src/components/GameScreen.jsx',
  'src/components/GameOverScreen.jsx',
  'src/components/FortuneWheel.jsx',
  'src/components/SettingsScreen.jsx',

  // ─── App + entry point ────────────────────────────────────
  'src/App.jsx',
  'src/main.jsx',
];

const BABEL_OPTS = {
  presets: [
    ['@babel/preset-env', { targets: '> 0.5%, last 2 versions, Firefox ESR, not dead' }],
    ['@babel/preset-react', { runtime: 'classic' }],
  ],
  babelrc: false,
  configFile: false,
};

const HEADER = '/* Super Tetris — bundle.js (auto-generated, do not edit by hand) */\n';
const SEPARATOR = '\n\n/* ─────────────────────────────────────────────────────────── */\n\n';

(async function main() {
  const t0 = Date.now();
  let parts = [HEADER];
  let totalIn = 0;
  let count = 0;

  for (const rel of FILES) {
    const abs = path.join(__dirname, rel);
    if (!fs.existsSync(abs)) {
      console.warn('  ⚠ Skipping missing file:', rel);
      continue;
    }
    const src = fs.readFileSync(abs, 'utf8');
    totalIn += src.length;
    try {
      const result = babel.transformSync(src, BABEL_OPTS);
      const code = (result && result.code) || src;
      parts.push('/* === ' + rel + ' === */\n' + code);
      count++;
    } catch (e) {
      console.error('✗ Babel error in', rel, ':', e.message);
      process.exit(1);
    }
  }

  const bundle = parts.join(SEPARATOR);
  const out = path.join(__dirname, 'bundle.js');
  fs.writeFileSync(out, bundle, 'utf8');

  const dt = Date.now() - t0;
  const kb = (bundle.length / 1024).toFixed(1);
  console.log('✓ Bundle créé : ' + count + ' fichiers → bundle.js (' + kb + ' KB) en ' + dt + ' ms');
})();
