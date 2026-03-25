/**
 * keystroke-tracker.js
 *
 * Client-side keystroke telemetry tracker for survey platforms.
 * Captures typing behaviour per field to enable bot, AI-paste, and
 * survey-farming detection on the backend via POST /v1/check.
 *
 * Usage:
 *   1. Include this script in your survey page.
 *   2. For each open-ended text input, call:
 *        KeystrokeTracker.attach(fieldIndex, inputElement)
 *      where fieldIndex matches the position of the question in the
 *      `questions` / `responses` arrays you send to the API (0-based).
 *   3. On form submit, include the payload in your API request:
 *        const body = {
 *          survey_id: "...",
 *          participant_id: "...",
 *          questions: [...],
 *          responses: [...],
 *          keystrokes: KeystrokeTracker.getPayload()
 *        };
 *
 * Privacy:
 *   - The actual text typed or pasted is NEVER captured.
 *   - Paste events record only the character count of pasted text.
 *   - Copy events record only the character count of the selection.
 *   - Keystroke events record the key name (e.g. "a", "Backspace").
 *
 * Event type codes stored in the payload:
 *   "f"  focus       — field received focus
 *   "b"  blur        — field lost focus
 *   "k"  keydown     — a key was pressed (val = key name)
 *   "p"  paste       — text was pasted (val = character count of pasted text)
 *   "c"  copy        — text was copied (val = character count of copied text)
 */

const KeystrokeTracker = (() => {
  // fieldData[fieldId] = { events: [], startTime: null }
  const fieldData = {};

  /**
   * Attach tracking to a text input or textarea element.
   * @param {string|number} fieldId  — matches the index in questions/responses arrays
   * @param {HTMLElement}   el       — the <input> or <textarea> DOM element
   */
  function attach(fieldId, el) {
    const id = String(fieldId);
    fieldData[id] = { events: [] };
    let startTime = null;

    function ts() {
      // Timestamps are ms relative to first focus; null before first focus
      return startTime !== null ? Math.round(performance.now() - startTime) : 0;
    }

    el.addEventListener('focus', () => {
      if (startTime === null) {
        startTime = performance.now();
        fieldData[id].events.push({ t: 0, type: 'f', val: null });
      } else {
        fieldData[id].events.push({ t: ts(), type: 'f', val: null });
      }
    }, { passive: true });

    el.addEventListener('blur', () => {
      fieldData[id].events.push({ t: ts(), type: 'b', val: null });
    }, { passive: true });

    el.addEventListener('keydown', (e) => {
      fieldData[id].events.push({ t: ts(), type: 'k', val: e.key });
    }, { passive: true });

    el.addEventListener('paste', (e) => {
      let len = 0;
      try {
        const text = (e.clipboardData || window.clipboardData).getData('text');
        len = text ? text.length : 0;
      } catch (_) {}
      fieldData[id].events.push({ t: ts(), type: 'p', val: len });
    }, { passive: true });

    el.addEventListener('copy', () => {
      let len = 0;
      try {
        const sel = window.getSelection();
        len = sel ? sel.toString().length : 0;
      } catch (_) {}
      fieldData[id].events.push({ t: ts(), type: 'c', val: len });
    }, { passive: true });
  }

  /**
   * Returns the keystroke payload object to include in the API request body
   * as the `keystrokes` field.
   * @returns {Object}
   */
  function getPayload() {
    return JSON.parse(JSON.stringify(fieldData));
  }

  /**
   * Clears all captured data (call between survey pages if needed).
   */
  function reset() {
    Object.keys(fieldData).forEach(k => delete fieldData[k]);
  }

  return { attach, getPayload, reset };
})();

// Support both browser globals and CommonJS (e.g. for testing in Node)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeystrokeTracker;
}
