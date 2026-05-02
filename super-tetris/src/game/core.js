/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Core mechanics
   ═══════════════════════════════════════════════════════════════════
   Fonctions PURES (pas de side effects sur le DOM, pas de RAF).
   Toutes les opérations qui modifient l'état du jeu sont ici :

     - createGrid(rows, cols)        : nouvelle grille vide
     - cloneGrid(grid)               : deep clone (avant mutation)
     - collide(grid, piece, ox, oy)  : test de collision
     - lock(grid, piece, ox, oy)     : pose la pièce dans la grille
     - clearLines(grid)              : retire les lignes pleines, retourne {newGrid, count}
     - rotatePiece(piece, dir)       : tente une rotation avec wall-kicks SRS
     - dropToBottom(grid, piece)     : retourne le y final pour hard drop / ghost
     - isTSpin(grid, piece, lastMove): détecte si le dernier mouvement est un T-spin
     - isGameOver(grid, newPiece)    : top-out check (collision dès le spawn)

   ⚠️ Aucune fonction ne mute l'argument `grid` directement (sauf lock,
   qui retourne le nouveau grid). Pratique pour React (immutabilité).
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var ROWS = 20;
  var COLS = 10;

  /** Crée une grille `rows x cols` remplie de 0. */
  function createGrid(rows, cols) {
    rows = rows || ROWS;
    cols = cols || COLS;
    var g = new Array(rows);
    for (var r = 0; r < rows; r++) {
      g[r] = new Array(cols).fill(0);
    }
    return g;
  }

  /** Deep clone d'une grille (pour mutation safe). */
  function cloneGrid(grid) {
    if (!grid) return createGrid();
    var g = new Array(grid.length);
    for (var r = 0; r < grid.length; r++) {
      g[r] = grid[r].slice();
    }
    return g;
  }

  /**
   * Teste si la pièce `piece.name` à la rotation `piece.rot` placée
   * en (ox, oy) entre en collision avec la grille ou les bords.
   * @returns boolean true = collision (placement invalide)
   */
  function collide(grid, piece, ox, oy) {
    var P = window.STPieces;
    if (!P || !piece) return true;
    var matrix = P.getRotation(piece.name, piece.rot);
    if (!matrix) return true;
    var size = matrix.length;
    var rows = grid.length;
    var cols = (grid[0] || []).length;

    for (var dy = 0; dy < size; dy++) {
      for (var dx = 0; dx < size; dx++) {
        if (!matrix[dy][dx]) continue;
        var x = ox + dx;
        var y = oy + dy;
        // bords gauche, droit, bas
        if (x < 0 || x >= cols) return true;
        if (y >= rows) return true;
        // au-dessus du board (-1, -2, ...) → pas de collision (on autorise spawn)
        if (y < 0) continue;
        if (grid[y][x]) return true;
      }
    }
    return false;
  }

  /**
   * Pose la pièce dans la grille (retourne une NOUVELLE grille).
   * Stocke le nom de la pièce (string) dans la cellule pour pouvoir
   * recolorier au rendu.
   */
  function lock(grid, piece, ox, oy) {
    var P = window.STPieces;
    if (!P || !piece) return grid;
    var matrix = P.getRotation(piece.name, piece.rot);
    if (!matrix) return grid;
    var newGrid = cloneGrid(grid);
    for (var dy = 0; dy < matrix.length; dy++) {
      for (var dx = 0; dx < matrix[dy].length; dx++) {
        if (!matrix[dy][dx]) continue;
        var x = ox + dx;
        var y = oy + dy;
        if (y < 0 || y >= newGrid.length) continue;
        if (x < 0 || x >= newGrid[0].length) continue;
        newGrid[y][x] = piece.name; // stocke le nom pour le rendu coloré
      }
    }
    return newGrid;
  }

  /**
   * Retire toutes les lignes pleines.
   * @returns { grid: nouveau grid, count: nb de lignes retirées, lines: indices des lignes retirées }
   */
  function clearLines(grid) {
    if (!grid) return { grid: grid, count: 0, lines: [] };
    var rows = grid.length;
    var cols = (grid[0] || []).length;
    var newRows = [];
    var clearedIndices = [];

    for (var r = 0; r < rows; r++) {
      var row = grid[r];
      var full = row.every(function (c) { return !!c; });
      if (full) {
        clearedIndices.push(r);
      } else {
        newRows.push(row.slice());
      }
    }

    // Préfixer avec des lignes vides pour garder la hauteur
    while (newRows.length < rows) {
      newRows.unshift(new Array(cols).fill(0));
    }

    return { grid: newRows, count: clearedIndices.length, lines: clearedIndices };
  }

  /**
   * Tente une rotation avec wall-kicks SRS.
   * @param grid    grille actuelle
   * @param piece   { name, rot, x, y }
   * @param dir     +1 = horaire, -1 = anti-horaire
   * @returns {ok, piece, kick} — ok=false si la rotation est refusée
   */
  function rotatePiece(grid, piece, dir) {
    var P = window.STPieces;
    if (!P || !piece) return { ok: false, piece: piece };
    var fromRot = piece.rot;
    var toRot = ((piece.rot + dir) % 4 + 4) % 4;
    var kicks = P.getWallKicks(piece.name, fromRot, toRot);

    for (var i = 0; i < kicks.length; i++) {
      var dx = kicks[i][0];
      var dy = kicks[i][1];
      var test = { name: piece.name, rot: toRot, x: piece.x + dx, y: piece.y + dy };
      if (!collide(grid, test, test.x, test.y)) {
        return { ok: true, piece: test, kick: kicks[i] };
      }
    }
    return { ok: false, piece: piece };
  }

  /**
   * Retourne le y final si on hard-drop la pièce (pour ghost piece et hard drop).
   */
  function dropToBottom(grid, piece) {
    var y = piece.y;
    while (!collide(grid, piece, piece.x, y + 1)) {
      y++;
      if (y > 100) break; // safety
    }
    return y;
  }

  /**
   * Détecte si la dernière action est un T-spin.
   * Heuristique standard : la pièce courante est un T, le dernier mouvement
   * est une rotation, et au moins 3 des 4 coins du carré 3x3 entourant le
   * centre du T sont occupés (cellules de la grille ou bords).
   */
  function isTSpin(grid, piece, lastMoveWasRotation) {
    if (!piece || piece.name !== "T" || !lastMoveWasRotation) return false;
    var rows = grid.length;
    var cols = (grid[0] || []).length;
    var cx = piece.x + 1; // centre du T = +1, +1 dans la matrice 3x3
    var cy = piece.y + 1;
    var corners = [
      [cx - 1, cy - 1],
      [cx + 1, cy - 1],
      [cx - 1, cy + 1],
      [cx + 1, cy + 1],
    ];
    var occupied = 0;
    for (var i = 0; i < 4; i++) {
      var x = corners[i][0];
      var y = corners[i][1];
      if (x < 0 || x >= cols || y < 0 || y >= rows) {
        occupied++; // hors grille = considéré occupé
      } else if (grid[y][x]) {
        occupied++;
      }
    }
    return occupied >= 3;
  }

  /**
   * Détecte un game over (top-out) : pièce nouvelle qui collide dès le spawn.
   */
  function isGameOver(grid, piece) {
    return collide(grid, piece, piece.x, piece.y);
  }

  /**
   * Crée une nouvelle pièce avec position de spawn standard
   * (centrée horizontalement, en haut de la grille).
   */
  function spawnPiece(name, cols) {
    cols = cols || COLS;
    return {
      name: name,
      rot: 0,
      x: Math.floor(cols / 2) - 2, // -2 pour centrer la matrice 3x3 ou 4x4
      y: name === "I" ? -1 : 0,    // I est plus large, on la spawn 1 ligne plus haut
    };
  }

  window.STCore = {
    ROWS: ROWS,
    COLS: COLS,
    createGrid: createGrid,
    cloneGrid: cloneGrid,
    collide: collide,
    lock: lock,
    clearLines: clearLines,
    rotatePiece: rotatePiece,
    dropToBottom: dropToBottom,
    isTSpin: isTSpin,
    isGameOver: isGameOver,
    spawnPiece: spawnPiece,
  };
})();
