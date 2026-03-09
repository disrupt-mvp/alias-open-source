<p align="center">
<img src="assets/logo-black.png" alt="Roundtable Logo" width="80">
</p>

<h3 align="center">Roundtable Alias — User Guide</h3>

---

## What this API does

The Roundtable Alias API analyses open-ended survey responses and returns structured quality flags, scores, and optional enrichment data. It runs two complementary layers of checks:

**Content checks** — what was written
- AI categorisation (Valid / Profane / Gibberish / Off-topic / AI-generated)
- Effort scoring (1–10)
- Duplicate detection (within a participant and across participants)
- Optional: sentiment, themes, PII detection, follow-up probe generation, auto-translation

**Behavioural checks** — how it was typed
- Keystroke telemetry captured by a client-side snippet
- Features extracted: typing speed, paste events, correction behaviour, timing regularity, focus/blur patterns
- AI synthesises all signals into a single `authenticity_score` (0–100) per response

The two layers work together. A response can look perfectly valid in content but score low on authenticity because it was pasted in from ChatGPT in one action with no corrections and zero natural typing rhythm.

---

## Quick start

### 1. Run the server locally

```bash
git clone <repo>
cd alias-open-source
npm install
export API_SECRET="Bearer sk-…"        # your OpenAI key
export INTERNAL_AUTH_TOKEN="mytoken"   # your chosen auth token
node server.js                          # starts on port 3000
```

Health check: `GET http://localhost:3000/health` → `ok`

### 2. Send your first request

```bash
curl -X POST http://localhost:3000/v1/check \
  -H "Authorization: Bearer mytoken" \
  -H "Content-Type: application/json" \
  -d '{
    "survey_id": "survey_001",
    "participant_id": "p_001",
    "questions": ["What do you like most about the product?"],
    "responses": ["Really easy to use, saved me a lot of time"]
  }'
```

---

## Integrating the keystroke tracker

The keystroke tracker is an optional client-side JavaScript snippet (`keystroke-tracker.js`) that captures how a respondent types. Include it in your survey platform and pass the payload alongside the responses.

### Step 1 — Include the script

```html
<script src="keystroke-tracker.js"></script>
```

Or copy the contents directly into your page/bundle.

### Step 2 — Attach to each text input

```javascript
// For each open-ended question field, call attach() with:
// - the field index (matching its position in your questions/responses arrays)
// - the DOM input or textarea element

const textarea0 = document.getElementById('q0');
const textarea1 = document.getElementById('q1');

KeystrokeTracker.attach(0, textarea0);
KeystrokeTracker.attach(1, textarea1);
```

### Step 3 — Include the payload on submit

```javascript
document.getElementById('survey-form').addEventListener('submit', async () => {
  const payload = {
    survey_id: 'survey_001',
    participant_id: 'p_001',
    questions: ['What do you like?', 'What would you improve?'],
    responses: [textarea0.value, textarea1.value],
    keystrokes: KeystrokeTracker.getPayload()  // add this
  };

  await fetch('https://your-api.com/v1/check', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
});
```

When `keystrokes` is included, the response will contain an `authenticity_scores` object with a 0–100 score per field.

---

## Integrating the cursor tracker

The cursor tracker (`cursor-trace.js`) is a companion to the keystroke tracker. It captures mouse behaviour per field — hover sessions, movement distance, click count, and velocity — which can distinguish natural human navigation from bot-driven or scripted automation. Use it alongside `keystrokes` for the strongest signal, or on its own.

### Step 1 — Include the script

```html
<script src="cursor-trace.js"></script>
```

### Step 2 — Attach to each text input

```javascript
const textarea0 = document.getElementById('q0');
const textarea1 = document.getElementById('q1');

CursorTrace.attach(0, textarea0);
CursorTrace.attach(1, textarea1);
```

### Step 3 — Include the payload on submit

```javascript
const payload = {
  survey_id: 'survey_001',
  participant_id: 'p_001',
  questions: ['What do you like?', 'What would you improve?'],
  responses: [textarea0.value, textarea1.value],
  keystrokes: KeystrokeTracker.getPayload(),   // optional but recommended
  cursor_trace: CursorTrace.getPayload()        // add this
};
```

When `cursor_trace` (or `keystrokes`) is included, the response will contain an `authenticity_scores` object. Providing both trackers gives the AI the most complete behavioural picture.

---

## API Reference

**Endpoint:** `POST /v1/check`

**Authentication:** `Authorization: Bearer <INTERNAL_AUTH_TOKEN>`

**Content-Type:** `application/json`

---

### Request fields

| Field | Type | Required | Description |
|---|---|---|---|
| `survey_id` | string | Yes | Unique identifier for the survey |
| `participant_id` | string | Yes | Unique identifier for the participant |
| `questions` | string[] | Yes | Array of question labels or full question text, positionally aligned with `responses` |
| `responses` | string[] | Yes | Array of verbatim response texts |
| `keystrokes` | object | No | Keystroke telemetry payload from `KeystrokeTracker.getPayload()` |
| `cursor_trace` | object | No | Cursor telemetry payload from `CursorTrace.getPayload()` |
| `low_effort_threshold` | number | No | Effort scores at or below this value get a `Low-effort` flag. Default: `0` (flag off) |
| `include_sentiment` | boolean | No | Return sentiment classification per response |
| `include_themes` | boolean | No | Return up to 3 key themes per response |
| `include_pii` | boolean | No | Detect and flag PII in responses |
| `include_probes` | boolean | No | Generate a follow-up question for vague/short responses |
| `include_translation` | boolean | No | Translate non-English responses to English before all analysis |

**Notes:**
- `questions` and `responses` must be the same length (1 or more).
- Omit empty responses — only send fields the participant actually answered.
- Using full question text (instead of codes like `"Q1"`) gives the AI more context for off-topic detection and probe generation.

---

### Response fields

All output objects use string-numeric keys (`"0"`, `"1"`, …) matching the position of each response in the input array.

| Field | Type | Present when | Description |
|---|---|---|---|
| `error` | boolean | Always | `true` if the request failed |
| `checks` | object | Always | Per-response array of quality flag strings |
| `response_groups` | object | Always | Per-response group ID for cross-duplicate clustering |
| `effort_ratings` | object | Always | Per-response effort score (0–10) |
| `authenticity_scores` | object | `keystrokes` or `cursor_trace` provided | Per-response human authenticity score (0–100) |
| `sentiment_ratings` | object | `include_sentiment: true` | `Positive`, `Negative`, `Neutral`, or `Mixed` per response |
| `themes` | object | `include_themes: true` | Array of up to 3 theme strings per response |
| `pii_flags` | object | `include_pii: true` | Array of detected PII types per response (empty if none) |
| `followup_probes` | object | `include_probes: true` | Follow-up question string, or `null` if no probe needed |
| `translations` | object | `include_translation: true` | Translated text (same as original if already English) |

---

### Checks glossary

All possible values that can appear in a `checks[i]` array:

| Flag | Meaning |
|---|---|
| `Automated test: Profane` | Response contains profane, vulgar, or offensive language |
| `Automated test: Off-topic` | Response is understandable but does not address the question |
| `Automated test: Gibberish` | Response is meaningless, random, or impossible to interpret |
| `Automated test: GPT` | Response appears to be AI-generated (structured, no typos, unrelated facts) |
| `Low-effort` | Effort score ≤ `low_effort_threshold` and response is non-empty |
| `Cross-duplicate response` | Response (≥ 20 chars) matches another participant's answer to the same question |
| `Self-duplicate response` | Response matches another answer from the same participant |
| `Contains PII` | PII detected (name, email, phone, address, SSN, or date of birth) |

---

### Authenticity score guide

Returned in `authenticity_scores` when `keystrokes` or `cursor_trace` (or both) is provided.

| Score range | Interpretation |
|---|---|
| 80–100 | Clear human: natural rhythm, corrections present, moderate speed |
| 60–79 | Likely human: minor flags but no strong red flags |
| 40–59 | Uncertain: content seems human but behavioural signals are missing or mixed |
| 20–39 | Likely non-human: paste-dominated, no corrections, suspicious timing, or farming signals |
| 0–19 | Almost certainly non-human: bot timing, AI paste pattern, or content flagged GPT with matching behaviour |

---

## Full API examples

### Example 1 — Basic request (no optional features)

**Request:**
```json
{
  "survey_id": "brand_tracker_q3",
  "participant_id": "resp_1042",
  "questions": ["What do you like most about the brand?"],
  "responses": ["The quality is really good and it lasts a long time"]
}
```

**Response:**
```json
{
  "error": false,
  "checks": {
    "0": []
  },
  "response_groups": {
    "0": 14
  },
  "effort_ratings": {
    "0": 6
  }
}
```

---

### Example 2 — Multiple responses with flags

**Request:**
```json
{
  "survey_id": "brand_tracker_q3",
  "participant_id": "resp_2087",
  "questions": [
    "What do you like most about the brand?",
    "What would you change?"
  ],
  "responses": [
    "asdf jkl qwerty lol",
    "fuck this product it sucks"
  ],
  "low_effort_threshold": 3
}
```

**Response:**
```json
{
  "error": false,
  "checks": {
    "0": ["Automated test: Gibberish"],
    "1": ["Automated test: Profane"]
  },
  "response_groups": {
    "0": 15,
    "1": 16
  },
  "effort_ratings": {
    "0": 1,
    "1": 2
  }
}
```

---

### Example 3 — All optional features enabled

**Request:**
```json
{
  "survey_id": "advert_recall_w12",
  "participant_id": "resp_0391",
  "questions": [
    "What does the advertisement communicate?",
    "How did it make you feel?"
  ],
  "responses": [
    "El anuncio comunica confianza y modernidad, enfocándose en la simplicidad del producto.",
    "It made me feel quite positive and optimistic about trying it"
  ],
  "low_effort_threshold": 3,
  "include_sentiment": true,
  "include_themes": true,
  "include_pii": true,
  "include_probes": true,
  "include_translation": true
}
```

**Response:**
```json
{
  "error": false,
  "checks": {
    "0": [],
    "1": []
  },
  "response_groups": {
    "0": 42,
    "1": 43
  },
  "effort_ratings": {
    "0": 7,
    "1": 6
  },
  "sentiment_ratings": {
    "0": "Positive",
    "1": "Positive"
  },
  "themes": {
    "0": ["brand trust", "modernity", "simplicity"],
    "1": ["positive emotion", "optimism", "product trial intent"]
  },
  "pii_flags": {
    "0": [],
    "1": []
  },
  "followup_probes": {
    "0": "What specifically made it feel trustworthy to you?",
    "1": null
  },
  "translations": {
    "0": "The advertisement communicates trust and modernity, focusing on the simplicity of the product.",
    "1": "It made me feel quite positive and optimistic about trying it"
  }
}
```

---

### Example 4 — Keystroke telemetry for authenticity scoring

This example shows a request with keystroke data. Field `"0"` shows a natural human typer; field `"1"` is a suspicious paste-only pattern.

**Request:**
```json
{
  "survey_id": "concept_test_oct",
  "participant_id": "resp_5512",
  "questions": [
    "What do you like most about the concept?",
    "What improvements would you suggest?"
  ],
  "responses": [
    "i really like how simple it is, took me barely any time to figure out",
    "There are several key improvements that could significantly enhance the overall user experience and drive better engagement metrics across the platform."
  ],
  "keystrokes": {
    "0": {
      "events": [
        { "t": 0,    "type": "f", "val": null },
        { "t": 820,  "type": "k", "val": "i" },
        { "t": 960,  "type": "k", "val": " " },
        { "t": 1080, "type": "k", "val": "r" },
        { "t": 1210, "type": "k", "val": "e" },
        { "t": 1290, "type": "k", "val": "a" },
        { "t": 1440, "type": "k", "val": "l" },
        { "t": 1530, "type": "k", "val": "l" },
        { "t": 1560, "type": "k", "val": "y" },
        { "t": 2100, "type": "k", "val": "Backspace" },
        { "t": 2250, "type": "k", "val": "y" },
        { "t": 9400, "type": "b", "val": null }
      ]
    },
    "1": {
      "events": [
        { "t": 0,    "type": "f", "val": null },
        { "t": 310,  "type": "b", "val": null },
        { "t": 2800, "type": "f", "val": null },
        { "t": 2950, "type": "p", "val": 157 },
        { "t": 3100, "type": "b", "val": null }
      ]
    }
  }
}
```

**Response:**
```json
{
  "error": false,
  "checks": {
    "0": [],
    "1": ["Automated test: GPT"]
  },
  "response_groups": {
    "0": 71,
    "1": 72
  },
  "effort_ratings": {
    "0": 5,
    "1": 9
  },
  "authenticity_scores": {
    "0": 84,
    "1": 7
  }
}
```

Response `"1"` scores high on effort (polished, long text) but near-zero on authenticity: it was pasted in from an external source after tabbing away, with no typing, no corrections, and the content was flagged as GPT.

---

### Example 5 — Error response

```json
{
  "error": true,
  "problem": "Questions and responses must have the same keys"
}
```

Other possible error messages:
- `"Must pass a serialized JSON object or a query string"`
- `"Missing survey_id, participant_id"`
- `"The following fields must be objects or arrays: responses"`
- `"Request timed out"`
- `"Problem parsing request body"`

---

## What the trackers do and do not record

### Keystroke tracker

| Captured | Not captured |
|---|---|
| Which key was pressed (e.g. `"a"`, `"Backspace"`) | The full text typed |
| Timestamp in milliseconds (relative to first focus) | The actual pasted text |
| Number of characters in a paste event | Clipboard contents |
| Number of characters in a copy/selection | Mouse position or movement |
| Focus and blur events | Anything outside the attached field |

### Cursor tracker

| Captured | Not captured |
|---|---|
| Mouse enter / leave events on the field | Absolute cursor coordinates |
| Movement deltas (dx, dy) between throttled samples | Cursor position on screen |
| Click events on the field | Any text or content the user views |
| Timestamps relative to first cursor event | Anything outside the attached field |

Both trackers are privacy-safe by design. Neither can reconstruct the response text from its output.

---

## Deployment

The API is stateless and designed to run as either a serverless function (Netlify/AWS Lambda) or a long-running Express server. The Docker image targets `node:20-slim`.

```bash
docker build -t alias-api .
docker run -p 3000:3000 \
  -e API_SECRET="Bearer sk-…" \
  -e INTERNAL_AUTH_TOKEN="mytoken" \
  alias-api
```

Render deployment: connect the repo, set the two environment variables, and the service will auto-deploy on push to `main`.
