/**
 * cursor-trace.js
 *
 * Client-side cursor telemetry tracker for survey platforms.
 * Captures mouse behaviour per field to enable bot and automated-browser
 * detection on the backend via POST /v1/check.
 *
 * Usage:
 *   1. Include this script in your survey page.
 *   2. For each open-ended text input, call:
 *        CursorTrace.attach(fieldIndex, inputElement)
 *      where fieldIndex matches the position of the question in the
 *      `questions` / `responses` arrays you send to the API (0-based).
 *   3. On form submit, include the payload in your API request:
 *        const body = {
 *          survey_id: "...",
 *          participant_id: "...",
 *          questions: [...],
 *          responses: [...],
 *          cursor_trace: CursorTrace.getPayload()
 *        };
 *
 * Privacy:
 *   - Absolute cursor coordinates are NEVER stored.
 *   - Move events record only the delta (dx, dy) from the previous sample.
 *   - No text content, selections, or screen-position data is captured.
 *
 * Event type codes stored in the payload:
 *   "e"  enter   — mouse entered the field's bounding area
 *   "l"  leave   — mouse left the field's bounding area
 *   "m"  move    — throttled mouse move (val = { dx, dy } pixel deltas)
 *   "c"  click   — mouse click on the field
 */

const CursorTrace = (() => {
  const THROTTLE_MS = 50; // max 20 move samples per second

  // fieldData[fieldId] = { events: [] }
  const fieldData = {};

  /**
   * Attach cursor tracking to a text input or textarea element.
   * @param {string|number} fieldId  — matches the index in questions/responses arrays
   * @param {HTMLElement}   el       — the <input> or <textarea> DOM element
   */
  function attach(fieldId, el) {
    const id = String(fieldId);
    fieldData[id] = { events: [] };
    let startTime = null;
    let lastX = null;
    let lastY = null;
    let lastMoveTime = -Infinity;

    function initTime() {
      if (startTime === null) startTime = performance.now();
    }

    function ts() {
      return startTime !== null ? Math.round(performance.now() - startTime) : 0;
    }

    el.addEventListener('mouseenter', (e) => {
      initTime();
      lastX = e.clientX;
      lastY = e.clientY;
      fieldData[id].events.push({ t: ts(), type: 'e' });
    }, { passive: true });

    el.addEventListener('mouseleave', () => {
      initTime();
      fieldData[id].events.push({ t: ts(), type: 'l' });
    }, { passive: true });

    el.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastMoveTime < THROTTLE_MS) return;
      lastMoveTime = now;
      initTime();
      const dx = lastX !== null ? Math.round(e.clientX - lastX) : 0;
      const dy = lastY !== null ? Math.round(e.clientY - lastY) : 0;
      lastX = e.clientX;
      lastY = e.clientY;
      fieldData[id].events.push({ t: ts(), type: 'm', dx, dy });
    }, { passive: true });

    el.addEventListener('click', () => {
      initTime();
      fieldData[id].events.push({ t: ts(), type: 'c' });
    }, { passive: true });
  }

  /**
   * Returns the cursor trace payload object to include in the API request body
   * as the `cursor_trace` field.
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
  module.exports = CursorTrace;
}
