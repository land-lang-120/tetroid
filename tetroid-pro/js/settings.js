/** @module settings - Settings load/save, theme, language, sensitivity */

import { S } from './state.js';
import { TRANSLATIONS } from './translations.js';

/**
 * @description Detect browser language or use saved preference
 * @returns {string} Language code
 */
export function detectLang() {
  const saved = localStorage.getItem('tb_lang');
  if (saved && TRANSLATIONS[saved]) return saved;
  const nav = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
  return TRANSLATIONS[nav] ? nav : 'en';
}

/**
 * @description Load all settings from localStorage
 * @returns {Object} Settings object
 */
export function loadSettings() {
  return {
    sound:    localStorage.getItem('tb_sound') !== 'false',
    vibro:    localStorage.getItem('tb_vibro') !== 'false',
    theme:    localStorage.getItem('tb_theme') || 'dark',
    lang:     localStorage.getItem('tb_lang') || detectLang(),
    moveSens: parseInt(localStorage.getItem('tb_move_sens') || '5'),
    dropSens: parseInt(localStorage.getItem('tb_drop_sens') || '5'),
  };
}

/**
 * @description Save a single setting and reapply all settings
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 */
export function saveSetting(key, value) {
  const map = {
    sound: 'tb_sound', vibro: 'tb_vibro', theme: 'tb_theme',
    lang: 'tb_lang', moveSens: 'tb_move_sens', dropSens: 'tb_drop_sens'
  };
  localStorage.setItem(map[key], value);
  applySettings();
}

/**
 * @description Apply all settings (theme, language, sensitivity thresholds)
 */
export function applySettings() {
  const s = loadSettings();
  if (!s.vibro && navigator.vibrate) navigator.vibrate(0);
  applyTheme(s.theme === 'light');
  applyLang(s.lang);
  S.SWIPE_MOVE_THRESH = 0.3 + (11 - s.moveSens) * 0.08;
  S.SWIPE_DROP_THRESH = 0.8 + (11 - s.dropSens) * 0.15;
}

/**
 * @description Apply a language to all UI elements
 * @param {string} lang - Language code
 */
export function applyLang(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const labels = document.querySelectorAll('.hl');
  const keys = ['score', 'niveau', 'combo', 'record', 'next'];
  labels.forEach((el, i) => { if (keys[i]) el.textContent = t[keys[i]]; });
  const bllbls = document.querySelectorAll('.blbl');
  const bkeys = ['freeze', 'laser', 'meteor', 'magnet'];
  bllbls.forEach((el, i) => { if (bkeys[i]) el.textContent = t[bkeys[i]]; });
  const hint = document.getElementById('hint');
  if (hint) hint.innerHTML = t.hint;
  const go = document.querySelector('#ov-gameover h2');
  if (go) go.textContent = t.defeat;
  const gp = document.querySelector('#ov-gameover p');
  if (gp) gp.textContent = t.finalScore;
  const gr = document.querySelector('#ov-gameover .bgo');
  if (gr) gr.innerHTML = t.replay;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] === undefined) return;
    if (el.children.length === 0) {
      el.textContent = t[key];
    } else {
      for (let node of el.childNodes) {
        if (node.nodeType === 3) { node.textContent = t[key]; break; }
      }
    }
  });
  document.querySelectorAll('.set-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

/**
 * @description Apply light or dark theme
 * @param {boolean} light - True for light theme
 */
export function applyTheme(light) {
  document.body.classList.toggle('light', light);
}

/**
 * @description Set language and apply it
 * @param {string} lang - Language code
 */
export function setLang(lang) {
  localStorage.setItem('tb_lang', lang);
  document.querySelectorAll('.set-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  applyLang(lang);
}

/**
 * @description Toggle between light and dark theme
 */
export function toggleTheme() {
  const isLight = !document.body.classList.contains('light');
  localStorage.setItem('tb_theme', isLight ? 'light' : 'dark');
  applyTheme(isLight);
}

/**
 * @description Handle theme toggle from checkbox
 */
export function onThemeToggle(checked) {
  saveSetting('theme', checked ? 'light' : 'dark');
  applyTheme(checked);
}

/**
 * @description Handle sensitivity slider change
 */
export function onSlider(key, value) {
  const id = key === 'move' ? 'val-move' : 'val-drop';
  const slid = key === 'move' ? 'set-move' : 'set-drop';
  document.getElementById(id).textContent = value;
  updateSliderFill(slid, value);
  saveSetting(key === 'move' ? 'moveSens' : 'dropSens', parseInt(value));
}

/**
 * @description Update slider track fill gradient
 */
export function updateSliderFill(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const pct = ((value - 1) / 9 * 100).toFixed(1);
  el.style.background = `linear-gradient(90deg,var(--gold) ${pct}%,rgba(255,255,255,.15) ${pct}%)`;
}
