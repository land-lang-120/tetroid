/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Canvas rendering
   ═══════════════════════════════════════════════════════════════════
   Dessine la grille + pièce courante + ghost piece sur un canvas 2D.

   Style visuel inspiré du Tetris officiel :
     - Pièces 3D avec gradient highlight top-left, ombre bottom-right
     - Bordure lumineuse violette autour de la zone de jeu
     - Lignes de grille subtiles (rgba(255,255,255,0.05))
     - Ghost piece : silhouette 30% opacité de la pièce qui va atterrir
     - Particules au moment du clearLines (handled via render.flash())

   Toutes les fonctions sont pures côté pixel (lit l'état, dessine).
   Pas d'animation persistante — le RAF loop redessine TOUT à chaque frame.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  /**
   * Dessine la grille + pièce courante sur le canvas.
   * @param ctx       CanvasRenderingContext2D
   * @param state     { grid, piece, ghostY, flashRows: [int] (rows en train de disparaître) }
   * @param config    { cellSize, cols, rows, showGhost: bool }
   */
  function drawBoard(ctx, state, config) {
    if (!ctx || !state) return;
    var grid = state.grid;
    var piece = state.piece;
    var ghostY = state.ghostY;
    var flashRows = state.flashRows || [];

    var cellSize = config.cellSize;
    var cols = config.cols;
    var rows = config.rows;
    var w = cellSize * cols;
    var h = cellSize * rows;

    // Background gradient (canvas-bg1 → canvas-bg2)
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#0a0e2a");
    grad.addColorStop(1, "#0d1530");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grid lines (subtiles)
    ctx.strokeStyle = "rgba(124,58,237,0.1)";
    ctx.lineWidth = 1;
    for (var x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize + 0.5, 0);
      ctx.lineTo(x * cellSize + 0.5, h);
      ctx.stroke();
    }
    for (var y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize + 0.5);
      ctx.lineTo(w, y * cellSize + 0.5);
      ctx.stroke();
    }

    // Cellules verrouillées
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        var v = grid[r][c];
        if (!v) continue;
        var color = (window.STPieces && window.STPieces.colorOf(v)) || "#888";
        var isFlashing = flashRows.indexOf(r) >= 0;
        drawCell(ctx, c * cellSize, r * cellSize, cellSize, color, isFlashing);
      }
    }

    // Ghost piece (silhouette)
    if (piece && config.showGhost && typeof ghostY === "number" && ghostY > piece.y) {
      drawPiece(ctx, piece, piece.x, ghostY, cellSize, true);
    }

    // Pièce courante
    if (piece) {
      drawPiece(ctx, piece, piece.x, piece.y, cellSize, false);
    }

    // Bordure violette autour du board (style Tetris officiel)
    ctx.strokeStyle = "rgba(124,58,237,0.6)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, w, h);
  }

  /**
   * Dessine une pièce à la position (ox, oy) en cellules.
   */
  function drawPiece(ctx, piece, ox, oy, cellSize, isGhost) {
    var P = window.STPieces;
    if (!P || !piece) return;
    var matrix = P.getRotation(piece.name, piece.rot);
    if (!matrix) return;
    var color = P.colorOf(piece.name);
    for (var dy = 0; dy < matrix.length; dy++) {
      for (var dx = 0; dx < matrix[dy].length; dx++) {
        if (!matrix[dy][dx]) continue;
        var px = (ox + dx) * cellSize;
        var py = (oy + dy) * cellSize;
        if (isGhost) {
          drawGhostCell(ctx, px, py, cellSize, color);
        } else {
          drawCell(ctx, px, py, cellSize, color, false);
        }
      }
    }
  }

  /**
   * Dessine une cellule "3D" : couleur de base + highlight + shadow.
   */
  function drawCell(ctx, x, y, size, color, flash) {
    if (flash) {
      // Cellule en train de disparaître : flash blanc
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillRect(x, y, size, size);
      return;
    }
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    // Highlight top-left (effet 3D)
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(x, y, size, Math.max(2, size * 0.18));
    ctx.fillRect(x, y, Math.max(2, size * 0.18), size);

    // Shadow bottom-right
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x, y + size - Math.max(2, size * 0.18), size, Math.max(2, size * 0.18));
    ctx.fillRect(x + size - Math.max(2, size * 0.18), y, Math.max(2, size * 0.18), size);

    // Borne externe (séparation entre cellules)
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  }

  /**
   * Dessine une cellule "ghost" : juste un contour pointillé / opacity 30%.
   */
  function drawGhostCell(ctx, x, y, size, color) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    ctx.restore();
  }

  /**
   * Dessine un mini canvas avec une pièce centrée (pour HUD next/hold).
   */
  function drawMiniPiece(ctx, pieceName, cellSize) {
    if (!ctx) return;
    var P = window.STPieces;
    if (!P || !pieceName) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    var matrix = P.getRotation(pieceName, 0);
    if (!matrix) return;
    var color = P.colorOf(pieceName);

    // Trim matrix : trouve les bornes effectives de la pièce
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var r = 0; r < matrix.length; r++) {
      for (var c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          if (r < minY) minY = r;
          if (r > maxY) maxY = r;
          if (c < minX) minX = c;
          if (c > maxX) maxX = c;
        }
      }
    }
    if (minX === Infinity) return;

    var pw = (maxX - minX + 1) * cellSize;
    var ph = (maxY - minY + 1) * cellSize;
    var ox = (ctx.canvas.width - pw) / 2 - minX * cellSize;
    var oy = (ctx.canvas.height - ph) / 2 - minY * cellSize;

    for (var rr = minY; rr <= maxY; rr++) {
      for (var cc = minX; cc <= maxX; cc++) {
        if (matrix[rr][cc]) {
          drawCell(ctx, ox + cc * cellSize, oy + rr * cellSize, cellSize, color, false);
        }
      }
    }
  }

  window.STRender = {
    drawBoard: drawBoard,
    drawPiece: drawPiece,
    drawCell: drawCell,
    drawGhostCell: drawGhostCell,
    drawMiniPiece: drawMiniPiece,
  };
})();
