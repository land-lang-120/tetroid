/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Bag system (génération random "fair")
   ═══════════════════════════════════════════════════════════════════
   Système officiel Tetris : à chaque cycle de 7 pièces, chaque pièce
   apparaît exactement 1×. Plus juste que random pur (qui peut donner
   3× I d'affilée ou aucune T pendant 14 pièces).

   Algorithme :
     - Maintenir un "sac" (Array) initialisé avec les 7 noms de pièces
     - Mélanger (Fisher-Yates)
     - À chaque demande de pièce, pop la dernière
     - Quand le sac est vide → en créer un nouveau (re-shuffle)

   On expose 2 fonctions principales :
     - createBag()        : crée un nouveau sac mélangé
     - drawNext(state)    : tire la prochaine pièce + alimente la queue

   La queue (S.queue) est maintenue à au moins 5 pièces pour permettre
   au joueur de voir 5 pièces à venir (HUD).
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var PIECE_NAMES = ["I","O","T","S","Z","J","L"];

  /** Fisher-Yates shuffle in-place. */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function createBag() {
    return shuffle(PIECE_NAMES.slice());
  }

  /**
   * Initialise la queue avec au moins 5 pièces visibles.
   * @returns Array<string> queue (de gauche à droite : [next, next+1, ...])
   */
  function initQueue() {
    var q = [];
    while (q.length < 7) {
      q = q.concat(createBag());
    }
    return q;
  }

  /**
   * Tire la prochaine pièce et alimente la queue si nécessaire.
   * @param state.queue Array<string> (sera muté)
   * @returns string nom de la pièce tirée
   */
  function drawNext(state) {
    if (!state || !Array.isArray(state.queue)) {
      // fallback défensif : on initialise au cas où
      state.queue = initQueue();
    }
    if (state.queue.length < 5) {
      state.queue = state.queue.concat(createBag());
    }
    return state.queue.shift();
  }

  /** Retourne les N prochaines pièces sans les retirer de la queue. */
  function peekQueue(state, n) {
    if (!state || !Array.isArray(state.queue)) return [];
    var count = Math.max(1, Math.min(7, n || 5));
    return state.queue.slice(0, count);
  }

  window.STBag = {
    createBag: createBag,
    initQueue: initQueue,
    drawNext: drawNext,
    peekQueue: peekQueue,
  };
})();
