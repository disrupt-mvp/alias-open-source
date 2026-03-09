// helpers/cursor-trace-utils.js
//
// Pure synchronous feature extraction from raw cursor telemetry.
// Takes the per-field event arrays produced by cursor-trace.js
// and returns a flat feature object used by openAIHumanityScore().

const config = require('../config');
const C = config.cursorTrace;

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
 * Extract all behavioural features from a single field's cursor event array.
 *
 * @param {Array}  events  - Array of { t, type, dx?, dy? } objects from cursor-trace.js
 * @returns {Object|null}  - Feature object, or null if events is empty/missing
 */
function extractCursorFeatures(events) {
  if (!events || !events.length) return null;

  // Sort defensively by timestamp
  const sorted = [...events].sort((a, b) => a.t - b.t);

  const enterEvents = sorted.filter(e => e.type === 'e');
  const leaveEvents = sorted.filter(e => e.type === 'l');
  const moveEvents  = sorted.filter(e => e.type === 'm');
  const clickEvents = sorted.filter(e => e.type === 'c');

  // ── Counts ────────────────────────────────────────────────────────────────
  const enterCount = enterEvents.length;
  const leaveCount = leaveEvents.length;
  const clickCount = clickEvents.length;
  const totalMoveEvents = moveEvents.length;

  // ── Time to first hover ───────────────────────────────────────────────────
  const timeToFirstEnterMs = enterEvents.length ? enterEvents[0].t : null;

  // ── Hover sessions and total hover time ───────────────────────────────────
  // Walk events in order; pair each 'e' with the next 'l'
  let hoverSessions = 0;
  let totalHoverMs = 0;
  let hoverStart = null;
  for (const ev of sorted) {
    if (ev.type === 'e') {
      hoverSessions++;
      hoverStart = ev.t;
    } else if (ev.type === 'l' && hoverStart !== null) {
      totalHoverMs += ev.t - hoverStart;
      hoverStart = null;
    }
  }

  // ── Distance and velocity ─────────────────────────────────────────────────
  let totalDistancePx = 0;
  const velocitySamples = []; // px/ms

  for (let i = 0; i < moveEvents.length; i++) {
    const ev = moveEvents[i];
    const dist = Math.sqrt((ev.dx || 0) ** 2 + (ev.dy || 0) ** 2);
    totalDistancePx += dist;

    // Velocity relative to previous move event (skip first)
    if (i > 0) {
      const dt = ev.t - moveEvents[i - 1].t;
      if (dt > 0) velocitySamples.push(dist / dt);
    }
  }

  let avgVelocityPxMs = null;
  let maxVelocityPxMs = null;
  let velocityCv = null;

  if (velocitySamples.length >= C.minVelocitySamples) {
    avgVelocityPxMs = mean(velocitySamples);
    maxVelocityPxMs = Math.max(...velocitySamples);
    const sd = stdDev(velocitySamples, avgVelocityPxMs);
    velocityCv = (avgVelocityPxMs > 0 && sd !== null) ? sd / avgVelocityPxMs : null;
  } else if (velocitySamples.length > 0) {
    avgVelocityPxMs = mean(velocitySamples);
    maxVelocityPxMs = Math.max(...velocitySamples);
  }

  // ── Risk flags ────────────────────────────────────────────────────────────
  const suspectNoMovement  = totalMoveEvents === 0;
  const suspectSmoothMotion = velocityCv !== null && velocityCv < C.smoothMotionCvThreshold;
  const suspectNoHover     = enterCount === 0;

  return {
    // Counts
    totalMoveEvents,
    clickCount,
    enterCount,
    leaveCount,
    hoverSessions,
    // Distance / velocity
    totalDistancePx:      Math.round(totalDistancePx),
    avgVelocityPxMs:      avgVelocityPxMs !== null ? Math.round(avgVelocityPxMs * 1000) / 1000 : null,
    maxVelocityPxMs:      maxVelocityPxMs !== null ? Math.round(maxVelocityPxMs * 1000) / 1000 : null,
    velocityCv:           velocityCv !== null ? Math.round(velocityCv * 1000) / 1000 : null,
    // Hover timing
    totalHoverMs:         Math.round(totalHoverMs),
    timeToFirstEnterMs:   timeToFirstEnterMs !== null ? Math.round(timeToFirstEnterMs) : null,
    // Risk flags
    suspectNoMovement,
    suspectSmoothMotion,
    suspectNoHover,
  };
}

/**
 * Extract features for all fields in the cursor_trace payload.
 *
 * @param {Object} cursorPayload  - { "0": { events: [...] }, "1": { events: [...] }, ... }
 * @returns {Object}              - { "0": FeatureObject|null, "1": ..., ... }
 */
function extractAllCursorFeatures(cursorPayload) {
  if (!cursorPayload || typeof cursorPayload !== 'object') return {};
  const result = {};
  for (const fieldId of Object.keys(cursorPayload)) {
    const field = cursorPayload[fieldId];
    result[fieldId] = extractCursorFeatures(field && field.events ? field.events : null);
  }
  return result;
}

/**
 * Compute a rule-based cursor authenticity score (0–100) from extracted features.
 * Returns null when features are null (no telemetry).
 *
 * Cursor signals are weaker in isolation than keystroke signals — many genuine
 * users Tab to fields without moving their mouse. Weight accordingly and always
 * use alongside keystroke_score and authenticity_scores.
 *
 * Base score: 50. Adjusted by individual signal deltas then clamped to [0, 100].
 *
 * @param {Object|null} features  - output of extractCursorFeatures()
 * @returns {number|null}
 */
function computeCursorScore(features) {
  if (!features) return null;

  let score = 50;

  // ── Positive signals (human-like behaviour) ─────────────────────────────
  if (features.hoverSessions >= 2)  score += 10; // natural back-and-forth navigation
  if (features.clickCount > 0)      score += 10; // clicked to focus — typical human behaviour
  if (features.velocityCv !== null && features.velocityCv >= 0.4) score += 15; // variable speed = human
  if (features.totalMoveEvents >= 10) score += 5; // meaningful movement data present
  if (features.totalHoverMs > 2000) score += 5;  // time spent considering the field

  // ── Negative signals (bot / automation indicators) ──────────────────────
  if (features.suspectNoMovement)   score -= 20; // no movement at all — keyboard-only or headless
  if (features.suspectSmoothMotion) score -= 30; // unnaturally uniform velocity
  if (features.suspectNoHover)      score -= 15; // never hovered over the field
  // Extra penalty for very smooth motion (CV < 0.10 = almost perfectly linear)
  if (features.velocityCv !== null && features.velocityCv < 0.10) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { extractCursorFeatures, extractAllCursorFeatures, computeCursorScore };
