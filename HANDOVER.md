# Handover — Alias Open Source (alias-open-source)

**Date:** 2026-03-24
**Branch:** `claude/review-ai-qa-improvements-etTLy`
**Repo:** `/home/user/alias-open-source/`

---

## What this project is

Alias is a survey authenticity scorer. When a Decipher survey respondent submits a response, it sends behavioural signals to a Node.js backend which scores the likelihood the response is human-written (vs. bot, AI paste, or assisted).

**Core flow:**
1. Decipher survey collects hidden behavioural data (keystrokes, cursor, face) via embedded JS
2. On submit, a Python `exec` block POSTs to `/v1/check`
3. `main.js` extracts features → passes to GPT-4o → returns `authenticity_scores` per field
4. Decipher stores scores in `potentia_alias_data` pipe-delimited fields

---

## Project structure

```
/home/user/alias-open-source/
├── main.js                          # /v1/check handler — core orchestration
├── server.js                        # Express server, routes (incl. /v1/face-frame)
├── config.js                        # All thresholds and config constants
├── helpers/
│   ├── keystroke-utils.js           # Keystroke feature extraction
│   ├── cursor-trace-utils.js        # Cursor movement feature extraction
│   ├── face-utils.js                # Face/emotion feature extraction + scoring
│   ├── openai-utils.js              # GPT-4o humanity score call
│   ├── prompts.js                   # System + user prompt builders
│   ├── json-utils.js                # JSON helpers
│   └── string-utils.js             # String helpers
├── templates/
│   └── decipher-textarea-script.xml # Decipher embedded JS (keystroke, cursor, face trackers)
├── TECHNICAL_GUIDE.md
├── USER_GUIDE.md
└── README.md
```

---

## Recently completed work

### Face/emotion analysis integration (fully implemented + pushed)

Added real-time facial emotion detection as an **optional, additive layer** alongside existing keystroke and cursor trackers. Uses GPT-4o Vision (same API key already in use — no new credentials needed).

**All 7 components are done:**

| Component | File | Notes |
|---|---|---|
| Feature extraction | `helpers/face-utils.js` | `extractFaceFeatures()`, `computeFaceScore()` |
| `/v1/face-frame` endpoint | `server.js` | GPT-4o Vision per frame, session cache |
| `alias_face_store` Decipher block | `templates/decipher-textarea-script.xml` | FaceTracker JS, off by default |
| `faceFeatures` param | `helpers/openai-utils.js` | Optional param, null-safe |
| Face context in prompt | `helpers/prompts.js` | Appended when face data present |
| `face_data` routing + `face_scores` | `main.js` | New optional response field |
| `faceAnalysis` config | `config.js` | Thresholds for scoring |

**Most recent tweak (last session):**
`computeFaceScore()` now returns the string `"no face"` (instead of a penalised low numeric score) when all captured frames had no visible face detected — i.e. `dominant === 'unknown'` AND `distribution.unknown === 1.0`. This prevents unfairly penalising a respondent who had the camera on but wasn't in frame.

---

## How the face feature works

**Toggle (off by default):**
```javascript
// Top of alias_face_store block in decipher-textarea-script.xml
var FACE_ANALYSIS_ENABLED = false;  // ← flip to true per survey
```

**Frame capture flow:**
- Every 4s while a field is focused: canvas snapshot → POST `/v1/face-frame` → GPT-4o Vision classifies emotion
- GPT-4o returns: `{ emotion, looking_at_screen, others_present, engagement_score }`
- On submit: summary JSON written to `alias_face_store` hidden field

**Scoring logic (`computeFaceScore()`):**
- Base score: 50
- `+20` high engagement (≥7/10), `+10` moderate engagement (≥5)
- `+10` mostly looking at screen (<10% frames looking away)
- `+5` sufficient data (≥5 samples)
- `-25` low engagement (<4/10)
- `-20` frequently looking away (>40% frames)
- `-15` others present in frame
- Returns `"no face"` string if all frames were `emotion: 'unknown'` (no face in view)
- Returns `null` if no face data at all

**Config thresholds (`config.js → faceAnalysis`):**
```js
frameCacheTtlMs: 30 * 60 * 1000,   // session cache TTL
lowEngagementThreshold: 4,          // below this = low engagement flag
lookAwayFractionThreshold: 0.40,    // above this = frequent look-away flag
```

---

## Rollback (if needed)

| Layer | Action | Time |
|---|---|---|
| Disable per survey | Set `FACE_ANALYSIS_ENABLED = false` | 0s |
| Remove Decipher block | Delete `alias_face_store` block in XML | 2 min |
| Remove backend | Delete `helpers/face-utils.js`, remove `face_data` branch in `main.js` | 5 min |
| Remove endpoint | Delete `/v1/face-frame` route in `server.js` | 1 min |
| Remove from scorer | Remove optional `faceFeatures` param from `openai-utils.js` | 2 min |

Nothing existing was modified in a breaking way. All existing fields and logic are untouched.

---

## Known state / nothing pending

- All work committed and pushed to `claude/review-ai-qa-improvements-etTLy`
- No open bugs or TODOs
- No retracted or incomplete tasks

---

## Suggested next steps (not started)

These weren't requested but may be natural follow-ons:
- Add face analysis section to `TECHNICAL_GUIDE.md` for end users
- Add unit tests for `computeFaceScore()` edge cases (`"no face"`, `null`, mixed emotions)
- Consider a `FACE_ANALYSIS_ENABLED` survey-level config flag passed from Decipher Python exec rather than hardcoded in XML
- Privacy/consent notice implementation (currently a survey-design responsibility)
