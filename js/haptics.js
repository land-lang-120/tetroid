/** @module haptics - Vibration patterns and haptic feedback */

/** Haptic vibration patterns (ms durations) */
export const HAPTICS = {
  lock:      [18],
  rotate:    [10],
  move:      [6],
  hardDrop:  [12, 40, 40],
  line1:     [40, 30, 40],
  line2:     [40, 20, 40, 20, 60],
  line3:     [40, 15, 40, 15, 40, 15, 80],
  line4:     [60, 10, 60, 10, 60, 10, 100],
  booster:   [20, 30, 60, 30, 20],
  levelUp:   [30, 20, 50, 20, 80, 20, 120],
  gameOver:  [80, 40, 60, 40, 40, 40, 20],
};

/**
 * @description Trigger a haptic vibration pattern if supported and enabled
 * @param {number[]} pattern - Vibration pattern array
 */
export function vibe(pattern) {
  try {
    if (navigator.vibrate && localStorage.getItem('tb_vibro') !== 'false')
      navigator.vibrate(pattern);
  } catch (e) {}
}
