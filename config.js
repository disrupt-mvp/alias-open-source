// config.js
module.exports = {
  TIMEOUT_MS          : 12_000,
  normLevThreshold    : 0.175,
  rawLevThreshold     : 2,
  normLCSThreshold    : 0.9,
  rawLCSThreshold     : 100,
  maxBatchSize        : 500,
  openAIModel         : 'gpt-4o',
  keystroke: {
    botIkiCvThreshold       : 0.15,   // IKI CV below this = suspiciously regular (bot)
    botIkiMinSamples        : 5,      // minimum keystrokes before IKI CV is meaningful
    highSpeedWpmThreshold   : 120,    // WPM above this = suspect
    highSpeedMinChars       : 20,     // minimum chars before WPM check applies
    largePasteCharThreshold : 100,    // paste character count >= this = large paste
    aiFractionThreshold     : 0.70,   // pasteCharFraction above this = suspect AI paste
    farmingMaxDurationMs    : 8000,   // total field time below this = suspect farming
    farmingMinChars         : 10,     // minimum chars typed for farming check to apply
    pasteAfterBlurWindowMs  : 2000,   // paste within this ms after blur = suspect external copy
    burstGapMs              : 2000,   // IKI gap above this separates typing bursts
  }
};