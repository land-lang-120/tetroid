/** @module rank - XP progression, ranks, rank-up detection */

/** Rank definitions with thresholds and bonuses */
export const RANKS = [
  { name: 'NOVICE',   badge: '🌱', minXP: 0,     boostersBonus: 0, unlock: "Bienvenue dans l'arène !" },
  { name: 'APPRENTI', badge: '⭐', minXP: 5000,  boostersBonus: 1, unlock: '+1 booster bonus au départ !' },
  { name: 'MAÎTRE',   badge: '💎', minXP: 15000, boostersBonus: 2, unlock: '+2 boosters bonus au départ !' },
  { name: 'LÉGENDE',  badge: '🔱', minXP: 35000, boostersBonus: 3, unlock: '+3 boosters bonus au départ !' },
  { name: 'MYTHIQUE', badge: '👑', minXP: 75000, boostersBonus: 5, unlock: '+5 boosters bonus — statut Mythe !' },
];

/** @description Get total accumulated XP from localStorage */
export function getTotalXP() {
  return parseInt(localStorage.getItem('tb_xp') || '0');
}

/**
 * @description Add XP and persist
 * @param {number} amount - XP to add
 * @returns {{prev: number, next: number}} Previous and new XP totals
 */
export function addXP(amount) {
  const prev = getTotalXP();
  const next = prev + amount;
  localStorage.setItem('tb_xp', next);
  return { prev, next };
}

/**
 * @description Get the rank object for a given XP total
 * @param {number} xp - Total XP
 * @returns {Object} Rank object
 */
export function getRankFromXP(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) if (xp >= r.minXP) rank = r;
  return rank;
}

/**
 * @description Get the rank index for a given XP total
 */
export function getRankIndex(xp) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].minXP) idx = i;
  return idx;
}

/**
 * @description Get progress fraction (0-1) toward the next rank
 */
export function getXPProgress(xp) {
  const idx = getRankIndex(xp);
  if (idx >= RANKS.length - 1) return 1;
  const curr = RANKS[idx].minXP;
  const next = RANKS[idx + 1].minXP;
  return (xp - curr) / (next - curr);
}

/**
 * @description Get XP remaining until next rank (null if max)
 */
export function getXPToNext(xp) {
  const idx = getRankIndex(xp);
  if (idx >= RANKS.length - 1) return null;
  return RANKS[idx + 1].minXP - xp;
}

/**
 * @description Update the rank bar UI elements
 */
export function updateRankBar() {
  const xp = getTotalXP();
  const rank = getRankFromXP(xp);
  const prog = getXPProgress(xp);
  const toNext = getXPToNext(xp);

  document.getElementById('rank-badge').textContent = rank.badge;
  document.getElementById('rank-title').textContent = rank.name;
  document.getElementById('xp-bar').style.width = (prog * 100).toFixed(1) + '%';
  document.getElementById('xp-label').textContent =
    toNext ? `${xp.toLocaleString()} XP · ${toNext.toLocaleString()} →` : `${xp.toLocaleString()} XP · MAX`;
}

/**
 * @description Check if a rank-up occurred and show overlay if so
 * @param {number} prevXP - XP before
 * @param {number} newXP - XP after
 */
export function checkRankUp(prevXP, newXP) {
  const prevIdx = getRankIndex(prevXP);
  const newIdx = getRankIndex(newXP);
  if (newIdx > prevIdx) {
    showRankUp(RANKS[newIdx]);
  }
}

/**
 * @description Display the rank-up overlay
 */
export function showRankUp(rank) {
  document.getElementById('ru-badge').textContent = rank.badge;
  document.getElementById('ru-name').textContent = rank.name;
  document.getElementById('ru-unlock').textContent = '🎁 ' + rank.unlock;
  document.getElementById('rank-up-overlay').style.display = 'flex';
}

/**
 * @description Close the rank-up overlay
 */
export function closeRankUp() {
  document.getElementById('rank-up-overlay').style.display = 'none';
}
