/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Scoring & Difficulty
   ═══════════════════════════════════════════════════════════════════
   Système de score officiel Tetris (parité avec le Tetris Guideline) :

     Single (1 ligne)       :   100 × niveau
     Double (2 lignes)      :   300 × niveau
     Triple (3 lignes)      :   500 × niveau
     Tetris (4 lignes)      :   800 × niveau
     T-Spin Single          :   800 × niveau
     T-Spin Double          : 1 200 × niveau
     T-Spin Triple          : 1 600 × niveau
     Mini T-Spin (no clear) :   100 × niveau
     Soft drop              :  1 par cellule
     Hard drop              :  2 par cellule
     Combo (n+1 ligne d'affilée): 50 × n × niveau
     Back-to-back (Tetris ou T-Spin enchaînés): bonus ×1.5

   Niveau & vitesse (gravité, ms par cellule) :
     Niveau 1  → 1000 ms/cell
     Niveau 5  →  500 ms/cell
     Niveau 10 →  250 ms/cell
     Niveau 15 →  100 ms/cell
     Niveau 20 →   50 ms/cell (plafond)

   Niveau monte tous les 10 lignes effacées.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var SCORES = {
    SINGLE:  100,
    DOUBLE:  300,
    TRIPLE:  500,
    TETRIS:  800,
    TSPIN_MINI: 100,
    TSPIN_SINGLE: 800,
    TSPIN_DOUBLE: 1200,
    TSPIN_TRIPLE: 1600,
    SOFT_DROP_PER_CELL: 1,
    HARD_DROP_PER_CELL: 2,
    COMBO_BASE: 50,
  };

  var LINES_PER_LEVEL = 10;
  var MAX_LEVEL = 20;

  /**
   * Calcule le score gagné lors du lock d'une pièce.
   * @param ctx { lines:int, isTSpin:bool, level:int, combo:int (combo précédent), b2b:bool (back-to-back actif) }
   * @returns { score, newCombo, newB2B }
   */
  function scoreFor(ctx) {
    var lines = ctx.lines || 0;
    var isTSpin = !!ctx.isTSpin;
    var level = Math.max(1, ctx.level || 1);
    var combo = ctx.combo || 0;
    var b2bActive = !!ctx.b2b;

    var pts = 0;
    var awarded = false; // si on a déclenché un combo line clear (≥1 ligne)

    if (isTSpin) {
      if (lines === 0)      pts = SCORES.TSPIN_MINI;
      else if (lines === 1) pts = SCORES.TSPIN_SINGLE;
      else if (lines === 2) pts = SCORES.TSPIN_DOUBLE;
      else if (lines === 3) pts = SCORES.TSPIN_TRIPLE;
      awarded = lines > 0;
    } else {
      if (lines === 1)      pts = SCORES.SINGLE;
      else if (lines === 2) pts = SCORES.DOUBLE;
      else if (lines === 3) pts = SCORES.TRIPLE;
      else if (lines === 4) pts = SCORES.TETRIS;
      awarded = lines > 0;
    }

    pts *= level;

    // Back-to-back bonus (Tetris ou T-spin enchaînés)
    var newB2B = b2bActive;
    if (lines > 0) {
      var qualifiesB2B = (lines === 4) || (isTSpin && lines > 0);
      if (qualifiesB2B && b2bActive) {
        pts = Math.floor(pts * 1.5);
      }
      newB2B = qualifiesB2B;
    }

    // Combo (lines ≥ 1 d'affilée)
    var newCombo = awarded ? (combo + 1) : 0;
    if (awarded && combo > 0) {
      pts += SCORES.COMBO_BASE * combo * level;
    }

    return {
      score: pts,
      newCombo: newCombo,
      newB2B: newB2B,
    };
  }

  /**
   * Score gagné par soft drop (descente accélérée).
   * Appelé à chaque cellule descendue manuellement.
   */
  function softDropScore() { return SCORES.SOFT_DROP_PER_CELL; }

  /**
   * Score gagné par hard drop (slam).
   * @param cellsFallen nombre de cellules entre la position au moment du slam et le sol
   */
  function hardDropScore(cellsFallen) {
    return Math.max(0, cellsFallen) * SCORES.HARD_DROP_PER_CELL;
  }

  /**
   * Niveau courant en fonction des lignes totales effacées.
   * @returns int (1..MAX_LEVEL)
   */
  function levelFromLines(linesTotal) {
    var lvl = 1 + Math.floor((linesTotal || 0) / LINES_PER_LEVEL);
    return Math.min(MAX_LEVEL, Math.max(1, lvl));
  }

  /**
   * Vitesse de gravité (ms entre chaque descente automatique d'une cellule)
   * pour le niveau donné.
   */
  function gravityMs(level) {
    var lvl = Math.min(MAX_LEVEL, Math.max(1, level || 1));
    // Courbe douce : commence à 1000ms (niveau 1), descend exponentiellement.
    // Niveau 10 ~ 500/2 = 250, niveau 20 ~ 50.
    var speeds = [
      0,        // index 0 unused
      1000,     // 1
      900,
      800,
      700,
      600,      // 5
      500,
      420,
      360,
      300,
      250,      // 10
      210,
      180,
      150,
      130,
      110,      // 15
      100,
      85,
      75,
      60,
      50        // 20
    ];
    return speeds[lvl] || 50;
  }

  /**
   * XP gagnée à la fin d'une partie.
   * Formule : floor(score / 100) + bonus pour lignes effacées.
   */
  function xpFromGame(score, linesTotal, level) {
    var base = Math.floor((score || 0) / 100);
    var lineBonus = (linesTotal || 0) * 5;
    var levelBonus = (level || 1) * 10;
    return base + lineBonus + levelBonus;
  }

  /**
   * Pièces or gagnées à la fin d'une partie.
   * Formule plus modeste que XP, pour pousser à acheter / regarder pubs.
   */
  function coinsFromGame(score, linesTotal) {
    var base = Math.floor((score || 0) / 1000);
    var lineBonus = Math.floor((linesTotal || 0) / 10) * 5;
    return Math.max(1, base + lineBonus);
  }

  window.STScoring = {
    SCORES: SCORES,
    LINES_PER_LEVEL: LINES_PER_LEVEL,
    MAX_LEVEL: MAX_LEVEL,
    scoreFor: scoreFor,
    softDropScore: softDropScore,
    hardDropScore: hardDropScore,
    levelFromLines: levelFromLines,
    gravityMs: gravityMs,
    xpFromGame: xpFromGame,
    coinsFromGame: coinsFromGame,
  };
})();
