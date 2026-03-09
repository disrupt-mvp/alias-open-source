// helpers/face-utils.js
//
// Feature extraction from raw face analysis data captured by FaceTracker
// (alias_face_store) and classified per-frame by GPT-4o Vision via /v1/face-frame.
// Follows the same pattern as keystroke-utils.js and cursor-trace-utils.js.

const config = require('../config');
const F = config.faceAnalysis;

/**
 * Extract behavioural features from face data for a single field.
 *
 * @param {Object} fieldData - {
 *   samples: number,
 *   dominant: string,
 *   distribution: { [emotion]: number },
 *   engagement: number,        // rolling avg of engagement_score (0-10)
 *   looking_away_count: number,
 *   others_present_count: number
 * }
 * @returns {Object|null}
 */
function extractFaceFeatures(fieldData) {
  if (!fieldData || typeof fieldData !== 'object') return null;

  const samples = fieldData.samples || 0;
  if (samples === 0) return null;

  const dominant = fieldData.dominant || 'unknown';
  const distribution = fieldData.distribution || {};
  const engagement = typeof fieldData.engagement === 'number' ? fieldData.engagement : null;
  const lookingAwayCount = fieldData.looking_away_count || 0;
  const othersPresentCount = fieldData.others_present_count || 0;

  const lookingAwayFraction = samples > 0 ? lookingAwayCount / samples : 0;
  const othersPresent = othersPresentCount > 0;

  // Normalise distribution counts to fractions
  const distFractions = {};
  const emotions = Object.keys(distribution);
  emotions.forEach(function(em) {
    distFractions[em] = Math.round((distribution[em] / samples) * 100) / 100;
  });

  // Risk flags
  const suspectLowEngagement = engagement !== null && engagement < F.lowEngagementThreshold;
  const suspectFrequentLookAway = lookingAwayFraction > F.lookAwayFractionThreshold;
  const suspectOthersPresent = othersPresent;

  return {
    samples,
    dominant,
    distribution: distFractions,
    engagement: engagement !== null ? Math.round(engagement * 10) / 10 : null,
    lookingAwayFraction: Math.round(lookingAwayFraction * 100) / 100,
    othersPresent,
    suspectLowEngagement,
    suspectFrequentLookAway,
    suspectOthersPresent,
  };
}

/**
 * Extract features for all fields in the face_data payload.
 *
 * @param {Object} faceData - { "0": { samples, dominant, ... }, "1": ..., ... }
 * @returns {Object}        - { "0": FeatureObject|null, ... }
 */
function extractAllFaceFeatures(faceData) {
  if (!faceData || typeof faceData !== 'object') return {};
  const result = {};
  for (const fieldId of Object.keys(faceData)) {
    result[fieldId] = extractFaceFeatures(faceData[fieldId]);
  }
  return result;
}

/**
 * Compute a rule-based face engagement score (0–100) from extracted features.
 * Returns null when features are null (no data).
 *
 * Base score: 50. Adjusted by individual signal deltas then clamped to [0, 100].
 *
 * @param {Object|null} features - output of extractFaceFeatures()
 * @returns {number|null}
 */
function computeFaceScore(features) {
  if (!features) return null;

  let score = 50;

  // Positive signals (engaged, attentive respondent)
  if (features.engagement !== null && features.engagement >= 7) score += 20;
  else if (features.engagement !== null && features.engagement >= 5) score += 10;
  if (features.lookingAwayFraction < 0.10) score += 10; // mostly looking at screen
  if (features.samples >= 5) score += 5; // enough data to be reliable

  // Negative signals (distracted, assisted, or disengaged)
  if (features.suspectLowEngagement) score -= 25;
  if (features.suspectFrequentLookAway) score -= 20;
  if (features.suspectOthersPresent) score -= 15; // potential survey assistance in room

  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { extractFaceFeatures, extractAllFaceFeatures, computeFaceScore };
