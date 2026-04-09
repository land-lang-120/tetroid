/** @module audio - Web Audio API: music scheduler, sound effects */

import { S } from './state.js';

// ── Music sequence data ──
const M_BPM  = 158;
const M_BEAT = 60 / M_BPM;
const M_E    = M_BEAT / 2;

const MN = {
  E2:82, A2:110, C3:131, D3:147, E3:165, G3:196, A3:220, B3:247,
  C4:262, D4:294, E4:330, F4:349, G4:392, A4:440, B4:494,
  C5:523, D5:587, E5:659, F5:698, G5:784, A5:880
};

// Deliberately not exported: used by B2 reference
MN.B2 = 123;

function buildSequence() {
  const Q = M_BEAT, E = M_E;
  const seq = [];
  function m(f, d) { seq.push({ mf: MN[f] || 0, md: d }); }
  function r(d) { seq.push({ mf: 0, md: d }); }

  m('E5',Q); m('B4',E); m('C5',E); m('D5',Q); m('C5',E); m('B4',E);
  m('A4',Q); m('A4',E); m('C5',E); m('E5',Q); m('D5',E); m('C5',E);
  m('B4',Q); m('C5',E); m('D5',E); m('E5',Q); m('C5',Q);
  m('A4',Q); m('A4',Q); r(M_BEAT * 2);
  r(E); m('D5',E); m('F5',Q); m('A5',Q); m('G5',E); m('F5',E);
  m('E5',Q); m('C5',E); m('E5',E); m('D5',Q); m('C5',Q);
  m('B4',Q); m('B4',E); m('C5',E); m('D5',Q); r(Q);
  m('E5',Q); m('C5',Q); m('A4',Q); r(Q);

  return seq;
}

const MUSIC_SEQ = buildSequence();

const BASS_PATTERN = [
  [MN.A2, MN.E3, MN.A3, MN.E3, MN.A2, MN.E3, MN.A3, MN.E3],
  [MN.A2, MN.E3, MN.A3, MN.E3, MN.A2, MN.E3, MN.A3, MN.E3],
  [MN.C3, MN.G3, MN.C3, MN.G3, MN.C3, MN.G3, MN.C3, MN.G3],
  [MN.C3, MN.G3, MN.C3, MN.G3, MN.C3, MN.G3, MN.C3, MN.G3],
  [MN.G3, MN.D3, MN.G3, MN.D3, MN.G3, MN.D3, MN.G3, MN.D3],
  [MN.G3, MN.D3, MN.G3, MN.D3, MN.G3, MN.D3, MN.G3, MN.D3],
  [MN.E2, MN.B2, MN.E3, MN.B2, MN.E2, MN.B2, MN.E3, MN.B2],
  [MN.A2, MN.E3, MN.A3, MN.E3, MN.A2, MN.E3, MN.A3, MN.E3],
];

const LOOKAHEAD   = 0.1;
const SCHEDULE_MS = 25;

/** @description Check if sound effects are on */
export function isSoundOn() { return localStorage.getItem('tb_sound') !== 'false'; }

/** @description Check if music is on */
export function isMusicOn() { return localStorage.getItem('tb_music') !== 'false'; }

/** @description Get or create the AudioContext singleton */
export function getAudioCtx() {
  if (!S.audioCtx) S.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return S.audioCtx;
}

/**
 * @description Play a single tone (for sound effects)
 */
export function playTone(freq, type, vol, when, dur) {
  if (!isSoundOn()) return;
  try {
    const c = getAudioCtx();
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.start(when); o.stop(when + dur + 0.01);
  } catch (e) {}
}

/**
 * @description Play a music note (independent of SFX toggle)
 */
function musicTone(freq, type, vol, when, dur) {
  if (!isMusicOn()) return;
  try {
    const c = getAudioCtx();
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.start(when); o.stop(when + dur + 0.01);
  } catch (e) {}
}

/**
 * @description Play a percussion hit for music
 */
function musicDrum(type, vol, when) {
  if (!isMusicOn()) return;
  try {
    const c = getAudioCtx();
    if (type === 'kick') {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(150, when);
      o.frequency.exponentialRampToValueAtTime(40, when + 0.07);
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.1);
      o.start(when); o.stop(when + 0.11);
    } else {
      const sr = c.sampleRate;
      const len = Math.floor(sr * (type === 'snare' ? 0.08 : 0.02));
      const buf = c.createBuffer(1, len, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * (type === 'snare' ? 0.25 : 0.12);
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = buf; s.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(vol, when); s.start(when);
    }
  } catch (e) {}
}

function scheduleNote() {
  if (!S.musicPlaying) return;
  const c = getAudioCtx();
  const now = c.currentTime;
  while (S.nextNoteTime < now + LOOKAHEAD) {
    const step = MUSIC_SEQ[S.schedIdx];
    if (step.mf > 0) {
      musicTone(step.mf, 'square', 0.07, S.nextNoteTime, step.md * 0.82);
      musicTone(step.mf * 2, 'sine', 0.02, S.nextNoteTime, step.md * 0.82);
    }
    const beatN = Math.round((S.nextNoteTime - S.schedTime) / M_E);
    const barN = Math.floor(beatN / 8);
    const beatInBar = beatN % 8;
    const bassBar = BASS_PATTERN[barN % BASS_PATTERN.length];
    if (bassBar && beatInBar < 8)
      musicTone(bassBar[beatInBar], 'triangle', 0.11, S.nextNoteTime, M_E * 0.70);

    const beatIn4 = Math.round((S.nextNoteTime - S.schedTime) / M_BEAT) % 4;
    const isDownbeat = Math.abs((S.nextNoteTime - S.schedTime) % M_BEAT) < 0.012;
    if (isDownbeat) {
      if (beatIn4 === 0 || beatIn4 === 2) musicDrum('kick', 0.22, S.nextNoteTime);
      if (beatIn4 === 1 || beatIn4 === 3) musicDrum('snare', 0.16, S.nextNoteTime);
      if (beatIn4 === 0) musicDrum('kick', 0.13, S.nextNoteTime + M_E * 0.5);
    }
    const isEighth = Math.abs((S.nextNoteTime - S.schedTime) % M_E) < 0.006;
    if (isEighth) musicDrum('hat', 0.07, S.nextNoteTime);

    S.nextNoteTime += step.md;
    S.schedIdx++;

    if (S.schedIdx >= MUSIC_SEQ.length) {
      S.schedIdx = 0;
      S.schedTime = S.nextNoteTime;
    }
  }
}

/** @description Start the background music loop */
export function startMusic() {
  if (S.musicPlaying || !isMusicOn()) return;
  const c = getAudioCtx();
  if (c.state === 'suspended') c.resume();
  S.musicPlaying = true;
  S.schedIdx = 0;
  S.schedTime = c.currentTime;
  S.nextNoteTime = c.currentTime + 0.05;
  S.musicInterval = setInterval(scheduleNote, SCHEDULE_MS);
}

/** @description Stop the background music */
export function stopMusic() {
  S.musicPlaying = false;
  if (S.musicInterval) { clearInterval(S.musicInterval); S.musicInterval = null; }
}

/** @description Toggle music on/off */
export function onMusicToggle(on) {
  localStorage.setItem('tb_music', on);
  if (on) startMusic();
  else stopMusic();
}

// ── Sound effects ──

/** @description Rotation SFX */
export function sfxRotate() {
  const c = getAudioCtx(), t = c.currentTime;
  playTone(440, 'square', 0.06, t, 0.05);
  playTone(660, 'square', 0.04, t + 0.04, 0.04);
}

/** @description Lock piece SFX */
export function sfxLock() {
  const c = getAudioCtx(), t = c.currentTime;
  playTone(200, 'square', 0.07, t, 0.03);
  playTone(150, 'square', 0.05, t + 0.03, 0.05);
}

/** @description Hard drop SFX */
export function sfxHardDrop() {
  const c = getAudioCtx(), t = c.currentTime;
  playTone(300, 'sawtooth', 0.1, t, 0.04);
  playTone(180, 'sawtooth', 0.1, t + 0.04, 0.04);
  playTone(100, 'sawtooth', 0.12, t + 0.08, 0.08);
}

/** @description Line clear SFX (count = number of lines) */
export function sfxLine(count) {
  const c = getAudioCtx(), t = c.currentTime;
  [523, 659, 784, 1047].slice(0, Math.min(count, 4)).forEach((f, i) =>
    playTone(f, 'square', 0.1, t + i * 0.07, 0.1));
  if (count >= 4) playTone(2093, 'square', 0.07, t + 0.28, 0.12);
}

/** @description Level up jingle */
export function sfxLevelUp() {
  const c = getAudioCtx(), t = c.currentTime;
  [523, 659, 784, 523, 659, 784, 1047].forEach((f, i) =>
    playTone(f, 'square', 0.1, t + [0, 0.1, 0.2, 0.35, 0.45, 0.55, 0.7][i], 0.12));
}

/** @description Game over descending notes */
export function sfxGameOver() {
  const c = getAudioCtx(), t = c.currentTime;
  [392, 349, 330, 294, 262, 220, 196].forEach((f, i) =>
    playTone(f, 'sawtooth', 0.08, t + i * 0.12, 0.14));
}

/** @description Booster activation SFX by type */
export function sfxBooster(type) {
  if (!isSoundOn()) return;
  const c = getAudioCtx(), t = c.currentTime;
  if (type === 'freeze') {
    [2093, 1760, 1480, 1245].forEach((f, i) => playTone(f, 'sine', 0.05, t + i * 0.06, 0.1));
  } else if (type === 'laser') {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.28);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.start(t); o.stop(t + 0.31);
  } else if (type === 'meteor') {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(600, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.22);
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.start(t); o.stop(t + 0.26);
    playTone(55, 'sine', 0.14, t + 0.2, 0.3);
  } else if (type === 'magnet') {
    [440, 554, 659].forEach((f, i) => playTone(f, 'square', 0.04, t + i * 0.08, 0.06));
    playTone(80, 'sine', 0.08, t, 0.5);
  } else {
    [784, 880, 988, 1047].forEach((f, i) => playTone(f, 'square', 0.07, t + i * 0.05, 0.08));
  }
}
