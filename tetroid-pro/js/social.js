/** @module social - Share score on social platforms */

import { S } from './state.js';
import { GAME_URL } from './config.js';
import { getTotalXP, getRankFromXP } from './rank.js';
import { showToast } from './hud.js';

/** @description Get the pseudo from localStorage */
function getPseudo() { return localStorage.getItem('tb_pseudo') || ''; }

/**
 * @description Build a shareable score text
 * @returns {string} Formatted share text
 */
export function buildShareText() {
  const xp = getTotalXP();
  const rank = getRankFromXP(xp);
  const sc = S.score.toLocaleString();
  const pseudo = getPseudo();
  const name = pseudo ? `${pseudo} ` : '';
  return `${name}vient de scorer ${sc} pts sur TETROID ! 🎮\n`
    + `Rang : ${rank.badge} ${rank.name} · Niveau ${S.level}\n`
    + `Tu peux faire mieux ? 👇\n${GAME_URL}`;
}

/**
 * @description Share the current score on a social platform
 * @param {string} platform - 'whatsapp'|'facebook'|'twitter'|'instagram'|'copy'
 */
export function shareScore(platform) {
  const text = buildShareText();
  const enc = encodeURIComponent(text);
  const url = encodeURIComponent(GAME_URL);

  switch (platform) {
    case 'whatsapp':
      window.open(`https://wa.me/?text=${enc}`, '_blank');
      break;
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${enc}`, '_blank');
      break;
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${enc}`, '_blank');
      break;
    case 'instagram':
      navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Texte copié — colle-le dans ta story Instagram !');
        window.open('https://www.instagram.com', '_blank');
      }).catch(() => {
        showToast('📋 Copie manuelle : ' + text.substring(0, 50) + '…');
      });
      break;
    case 'copy':
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('share-copy-btn');
        btn.classList.add('copied');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>';
        }, 2000);
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('🔗 Lien copié !');
      });
      break;
  }
}
