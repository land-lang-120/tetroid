/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Pieces & SRS rotation system
   ═══════════════════════════════════════════════════════════════════
   Définit les 7 pièces standard Tetris avec :
     - Forme initiale (matrice 4x4 ou 3x3)
     - 4 rotations (0°, 90°, 180°, 270°)
     - Couleur canonique (var CSS référencée par render.js)
     - Wall-kick offsets (Super Rotation System / SRS officiel)

   Référence SRS : https://tetris.wiki/Super_Rotation_System
   On suit la convention "JLSTZ" (4 wall-kicks par rotation) +
   "I" (4 wall-kicks différents) car la pièce I a sa propre table.

   Exporte (façon namespace, vu qu'on est en script global Babel-compiled,
   pas en ES modules) :
     window.STPieces = {
       PIECES, getRotation, getWallKicks, randomColor
     }
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // Chaque pièce est un tableau de 4 rotations (état 0,1,2,3).
  // Chaque rotation est une matrice carrée (1=cell, 0=empty).
  // Origine relative: (0,0) en haut-gauche de la matrice.
  // L'algo de spawn place la pièce centrée horizontalement sur la grille (col 3 ou 4).

  var PIECES = {
    I: {
      color: "var(--piece-i)",
      colorHex: "#00d4e0",
      // 4x4 — la pièce I a sa propre rotation (ne tourne pas autour d'un centre)
      rotations: [
        [
          [0,0,0,0],
          [1,1,1,1],
          [0,0,0,0],
          [0,0,0,0],
        ],
        [
          [0,0,1,0],
          [0,0,1,0],
          [0,0,1,0],
          [0,0,1,0],
        ],
        [
          [0,0,0,0],
          [0,0,0,0],
          [1,1,1,1],
          [0,0,0,0],
        ],
        [
          [0,1,0,0],
          [0,1,0,0],
          [0,1,0,0],
          [0,1,0,0],
        ],
      ],
    },

    O: {
      color: "var(--piece-o)",
      colorHex: "#ffd23f",
      // 2x2 — la pièce O ne tourne pas (4 rotations identiques)
      rotations: [
        [[1,1],[1,1]],
        [[1,1],[1,1]],
        [[1,1],[1,1]],
        [[1,1],[1,1]],
      ],
    },

    T: {
      color: "var(--piece-t)",
      colorHex: "#a855f7",
      rotations: [
        [
          [0,1,0],
          [1,1,1],
          [0,0,0],
        ],
        [
          [0,1,0],
          [0,1,1],
          [0,1,0],
        ],
        [
          [0,0,0],
          [1,1,1],
          [0,1,0],
        ],
        [
          [0,1,0],
          [1,1,0],
          [0,1,0],
        ],
      ],
    },

    S: {
      color: "var(--piece-s)",
      colorHex: "#22c55e",
      rotations: [
        [
          [0,1,1],
          [1,1,0],
          [0,0,0],
        ],
        [
          [0,1,0],
          [0,1,1],
          [0,0,1],
        ],
        [
          [0,0,0],
          [0,1,1],
          [1,1,0],
        ],
        [
          [1,0,0],
          [1,1,0],
          [0,1,0],
        ],
      ],
    },

    Z: {
      color: "var(--piece-z)",
      colorHex: "#ef4444",
      rotations: [
        [
          [1,1,0],
          [0,1,1],
          [0,0,0],
        ],
        [
          [0,0,1],
          [0,1,1],
          [0,1,0],
        ],
        [
          [0,0,0],
          [1,1,0],
          [0,1,1],
        ],
        [
          [0,1,0],
          [1,1,0],
          [1,0,0],
        ],
      ],
    },

    J: {
      color: "var(--piece-j)",
      colorHex: "#2563eb",
      rotations: [
        [
          [1,0,0],
          [1,1,1],
          [0,0,0],
        ],
        [
          [0,1,1],
          [0,1,0],
          [0,1,0],
        ],
        [
          [0,0,0],
          [1,1,1],
          [0,0,1],
        ],
        [
          [0,1,0],
          [0,1,0],
          [1,1,0],
        ],
      ],
    },

    L: {
      color: "var(--piece-l)",
      colorHex: "#f97316",
      rotations: [
        [
          [0,0,1],
          [1,1,1],
          [0,0,0],
        ],
        [
          [0,1,0],
          [0,1,0],
          [0,1,1],
        ],
        [
          [0,0,0],
          [1,1,1],
          [1,0,0],
        ],
        [
          [1,1,0],
          [0,1,0],
          [0,1,0],
        ],
      ],
    },
  };

  // ─── Wall-kicks SRS — JLSTZ (les 5 pièces non-I, non-O) ──────────
  // Pour chaque rotation src->dst, 5 offsets à essayer dans l'ordre.
  // Si aucun ne convient → rotation refusée.
  // Format: [[dx, dy], ...]  (dx = column shift, dy = row shift, négatif = vers le haut)
  var KICKS_JLSTZ = {
    "0->1": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    "1->0": [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    "1->2": [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    "2->1": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    "2->3": [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    "3->2": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    "3->0": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    "0->3": [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  };

  // ─── Wall-kicks SRS — I (pièce I a sa propre table) ──────────────
  var KICKS_I = {
    "0->1": [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    "1->0": [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    "1->2": [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
    "2->1": [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    "2->3": [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    "3->2": [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    "3->0": [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    "0->3": [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  };

  /**
   * Retourne la matrice de la pièce pour la rotation donnée.
   * Optional chaining défensif si nom invalide.
   */
  function getRotation(pieceName, rot) {
    var p = PIECES[pieceName];
    if (!p) return null;
    var safeRot = ((rot % 4) + 4) % 4; // gère les rotations négatives
    return p.rotations[safeRot] || null;
  }

  /**
   * Retourne la liste des wall-kicks à essayer pour passer
   * de la rotation `fromRot` à `toRot` pour la pièce donnée.
   * @returns Array<[dx,dy]>
   */
  function getWallKicks(pieceName, fromRot, toRot) {
    if (pieceName === "O") return [[0,0]]; // O ne tourne pas
    var f = ((fromRot % 4) + 4) % 4;
    var t = ((toRot % 4) + 4) % 4;
    var key = f + "->" + t;
    var table = pieceName === "I" ? KICKS_I : KICKS_JLSTZ;
    return table[key] || [[0,0]];
  }

  /** Retourne la couleur hex d'une pièce (pour le canvas). */
  function colorOf(pieceName) {
    var p = PIECES[pieceName];
    return p ? p.colorHex : "#888";
  }

  // Export global (script style, pas ES module)
  window.STPieces = {
    PIECES: PIECES,
    PIECE_NAMES: ["I","O","T","S","Z","J","L"],
    getRotation: getRotation,
    getWallKicks: getWallKicks,
    colorOf: colorOf,
  };
})();
