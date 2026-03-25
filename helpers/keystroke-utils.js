// helpers/keystroke-utils.js
//
// Pure synchronous feature extraction from raw keystroke telemetry.
// Takes the per-field event arrays produced by keystroke-tracker.js
// and returns a flat feature object used by openAIHumanityScore().

const config = require('../config');
const K = config.keystroke;

// Keys that count as printable characters typed by the user
const MODIFIER_KEYS = new Set([
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab',
  'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
]);

/**
 * Compute the mean of an array of numbers.
 */
function mean(arr) {
  if (!arr.length) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/**
 * Compute the standard deviation of an array of numbers (population).
 */
function stdDev(arr, avg) {
  if (arr.length < 2) return null;
  const m = avg !== undefined ? avg : mean(arr);
  const variance = arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Return the value at a given percentile (0-100) of a sorted array.
 */
function percentile(sortedArr, p) {
  if (!sortedArr.length) return null;
  const idx = (p / 100) * (sortedArr.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedArr[lo];
  return sortedArr[lo] + (sortedArr[hi] - sortedArr[lo]) * (idx - lo);
}

/**
 * Extract all behavioural features from a single field's event array.
 *
 * @param {Array}  events  - Array of { t, type, val } objects from keystroke-tracker.js
 * @returns {Object|null}  - Feature object, or null if events is empty/missing
 */
function extractKeystrokeFeatures(events) {
  if (!events || !events.length) return null;

  // Sort defensively by timestamp (should already be ordered)
  const sorted = [...events].sort((a, b) => a.t - b.t);

  // Separate event types
  const focusEvents  = sorted.filter(e => e.type === 'f');
  const blurEvents   = sorted.filter(e => e.type === 'b');
  const keyEvents    = sorted.filter(e => e.type === 'k');
  const pasteEvents  = sorted.filter(e => e.type === 'p');

  // ── Timing baseline ──────────────────────────────────────────────────────
  const firstFocusT  = focusEvents.length ? focusEvents[0].t : (sorted[0].t);
  const lastEventT   = sorted[sorted.length - 1].t;
  const totalDurationMs = lastEventT - firstFocusT;

  // ── Keystroke counts ─────────────────────────────────────────────────────
  const backspaceCount = keyEvents.filter(e => e.val === 'Backspace').length;
  const deleteCount    = keyEvents.filter(e => e.val === 'Delete').length;
  const arrowKeyCount  = keyEvents.filter(e =>
    ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.val)
  ).length;

  const netCharsTyped = keyEvents.filter(e =>
    e.val && e.val.length === 1 && !MODIFIER_KEYS.has(e.val)
  ).length;

  // ── Time to first keystroke ───────────────────────────────────────────────
  const firstKeyEvent = keyEvents.find(e =>
    e.val && e.val.length === 1 && !MODIFIER_KEYS.has(e.val)
  );
  const timeToFirstKeystroke = firstKeyEvent !== undefined
    ? firstKeyEvent.t - firstFocusT
    : null;

  // ── Inter-keystroke intervals (IKI) ───────────────────────────────────────
  // Use all keydown events (not just printable) for timing analysis
  const allKeyTs = keyEvents.map(e => e.t);
  const ikis = [];
  for (let i = 1; i < allKeyTs.length; i++) {
    const diff = allKeyTs[i] - allKeyTs[i - 1];
    if (diff >= 0) ikis.push(diff);
  }

  let ikiMean = null, ikiCv = null, ikiSpread = null;
  if (ikis.length >= K.botIkiMinSamples) {
    ikiMean = mean(ikis);
    const sd = stdDev(ikis, ikiMean);
    ikiCv = (ikiMean > 0 && sd !== null) ? sd / ikiMean : null;
    const sIkis = [...ikis].sort((a, b) => a - b);
    const p10 = percentile(sIkis, 10);
    const p90 = percentile(sIkis, 90);
    ikiSpread = (p10 !== null && p90 !== null) ? p90 - p10 : null;
  } else if (ikis.length > 0) {
    ikiMean = mean(ikis);
  }

  // ── Typing speed ──────────────────────────────────────────────────────────
  let grossWpm = null;
  if (netCharsTyped >= K.highSpeedMinChars && totalDurationMs > 0) {
    grossWpm = (netCharsTyped / 5) / (totalDurationMs / 60000);
  }

  // ── Paste analysis ────────────────────────────────────────────────────────
  const pasteCount      = pasteEvents.length;
  const pasteCharTotal  = pasteEvents.reduce((s, e) => s + (e.val || 0), 0);
  const largePastePresent = pasteEvents.some(e => (e.val || 0) >= K.largePasteCharThreshold);
  const pasteCharFraction = (pasteCharTotal + netCharsTyped) > 0
    ? pasteCharTotal / (pasteCharTotal + netCharsTyped)
    : 0;

  // ── Focus / blur patterns ─────────────────────────────────────────────────
  const blurCount     = blurEvents.length;
  const focusCount    = focusEvents.length;
  const tabAwayPresent = blurCount > 0;

  // Did a paste occur within pasteAfterBlurWindowMs of any blur event?
  let pasteAfterBlur = false;
  for (const blur of blurEvents) {
    for (const paste of pasteEvents) {
      if (paste.t > blur.t && paste.t - blur.t <= K.pasteAfterBlurWindowMs) {
        pasteAfterBlur = true;
        break;
      }
    }
    if (pasteAfterBlur) break;
  }

  // ── Burst analysis ────────────────────────────────────────────────────────
  // A burst is a group of keystrokes separated by <= burstGapMs
  let burstCount = 0;
  if (allKeyTs.length > 0) {
    burstCount = 1;
    for (let i = 1; i < allKeyTs.length; i++) {
      if (allKeyTs[i] - allKeyTs[i - 1] > K.burstGapMs) burstCount++;
    }
  }

  // ── Correction / human signals ────────────────────────────────────────────
  const correctionPresent = backspaceCount > 0 || deleteCount > 0 || arrowKeyCount > 0;
  const backspaceRate = netCharsTyped > 0 ? backspaceCount / netCharsTyped : 0;

  // ── Derived risk flags ────────────────────────────────────────────────────
  const suspectRegularTiming = ikiCv !== null && ikiCv < K.botIkiCvThreshold;
  const suspectHighSpeed = grossWpm !== null && grossWpm > K.highSpeedWpmThreshold;
  const suspectAIPaste = largePastePresent
    && pasteCharFraction > K.aiFractionThreshold
    && !correctionPresent;
  const suspectSurveyFarming = totalDurationMs < K.farmingMaxDurationMs
    && netCharsTyped >= K.farmingMinChars
    && backspaceCount === 0;

  return {
    // Timing
    ikiMean:               ikiMean !== null ? Math.round(ikiMean) : null,
    ikiCv:                 ikiCv !== null ? Math.round(ikiCv * 1000) / 1000 : null,
    ikiSpread:             ikiSpread !== null ? Math.round(ikiSpread) : null,
    // Speed
    netCharsTyped,
    totalDurationMs:       Math.round(totalDurationMs),
    grossWpm:              grossWpm !== null ? Math.round(grossWpm) : null,
    timeToFirstKeystroke:  timeToFirstKeystroke !== null ? Math.round(timeToFirstKeystroke) : null,
    // Paste
    pasteCount,
    pasteCharTotal,
    largePastePresent,
    pasteCharFraction:     Math.round(pasteCharFraction * 100) / 100,
    // Focus / blur
    blurCount,
    focusCount,
    tabAwayPresent,
    pasteAfterBlur,
    // Corrections
    backspaceCount,
    deleteCount,
    arrowKeyCount,
    correctionPresent,
    backspaceRate:         Math.round(backspaceRate * 100) / 100,
    // Bursts
    burstCount,
    // Risk flags
    suspectRegularTiming,
    suspectHighSpeed,
    suspectAIPaste,
    suspectSurveyFarming,
  };
}

/**
 * Extract features for all fields in the keystrokes payload.
 *
 * @param {Object} keystrokesPayload  - { "0": { events: [...] }, "1": { events: [...] }, ... }
 * @returns {Object}                  - { "0": FeatureObject|null, "1": ..., ... }
 */
function extractAllKeystrokeFeatures(keystrokesPayload) {
  if (!keystrokesPayload || typeof keystrokesPayload !== 'object') return {};
  const result = {};
  for (const fieldId of Object.keys(keystrokesPayload)) {
    const field = keystrokesPayload[fieldId];
    result[fieldId] = extractKeystrokeFeatures(field && field.events ? field.events : null);
  }
  return result;
}

/**
 * Compute a rule-based keystroke authenticity score (0–100) from extracted features.
 * Returns null when features are null (no telemetry).
 *
 * Base score: 50. Adjusted by individual signal deltas then clamped to [0, 100].
 *
 * @param {Object|null} features  - output of extractKeystrokeFeatures()
 * @returns {number|null}
 */
function computeKeystrokeScore(features) {
  if (!features) return null;

  let score = 50;

  // ── Positive signals (human-like behaviour) ─────────────────────────────
  if (features.correctionPresent) score += 15;
  if (features.backspaceRate >= 0.05 && features.backspaceRate <= 0.25) score += 10;
  if (features.timeToFirstKeystroke !== null && features.timeToFirstKeystroke > 500) score += 5;
  if (features.focusCount > 1 && !features.pasteAfterBlur) score += 5;

  // ── Negative signals (bot / fraud indicators) ───────────────────────────
  if (features.suspectRegularTiming) score -= 35;
  if (features.suspectHighSpeed)     score -= 20;
  if (features.suspectAIPaste)       score -= 30;
  if (features.suspectSurveyFarming) score -= 20;
  if (features.pasteAfterBlur)       score -= 15;
  if (features.largePastePresent && features.pasteCharFraction > 0.7) score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { extractKeystrokeFeatures, extractAllKeystrokeFeatures, computeKeystrokeScore };
