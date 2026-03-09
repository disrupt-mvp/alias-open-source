<p align="center">
<img src="assets/logo-black.png" alt="Roundtable Logo" width = '80'>
</p>

<h3 align="center">Roundtable Alias Open Source</h3>

This repo contains an open-end verbatim quality assurance API for online surveys. It runs a set of AI and string-distance checks on free-text responses and returns structured quality flags, scores, and optional enrichment data.

**Core checks (always on):**

* **Categorizations**: Uses OpenAI to label each response as `Valid`, `Profane`, `Off-topic`, `Gibberish`, or `GPT`. Any label other than `Valid` is added to the `checks` array for that response.

* **Effort scores**: Uses OpenAI to rate each response 1–10 (0 for empty). Scores of 4–7 are typical. Lower signals minimal effort; higher may indicate AI-generated text.

* **Duplicate matching**: Uses Levenshtein distance and longest-common-substring to identify likely duplicates.
  * **Self-duplicates**: Responses from the same participant that match each other.
  * **Cross-duplicates**: Responses that match another participant's answer to the same question (≥ 20 characters to trigger a flag).

**Optional checks (opt-in per request):**

* **Sentiment analysis** (`include_sentiment`): Classifies each response as `Positive`, `Negative`, `Neutral`, or `Mixed`.
* **Theme extraction** (`include_themes`): Extracts up to 3 key noun-phrase themes from each response (e.g. `["price", "product quality", "ease of use"]`).
* **PII detection** (`include_pii`): Flags responses containing personally identifiable information (name, email, phone, address, SSN, date of birth) and adds `Contains PII` to the checks array.
* **Follow-up probe generation** (`include_probes`): Generates a targeted follow-up question for vague or short responses to elicit more depth. Returns `null` when no probe is needed.
* **Auto-translation** (`include_translation`): Detects the language of each response and translates non-English text to English before running all AI analysis. Returns the translated text alongside the checks so you can store what was analysed. Original text is always used for duplicate detection.

---

### Behavioral bot detection

Include `keystrokes` (from `keystroke-tracker.js`) and/or `cursor_trace` (from `cursor-trace.js`) in your request to enable authenticity scoring. When present, the API runs a second AI pass that combines content checks, effort ratings, typing rhythm, and cursor behaviour to produce a 0–100 human authenticity score per response. Use both trackers together for the strongest signal.

---

## API Reference

**Endpoint:** `POST https://alias-open-source.onrender.com/v1/check`

### Request

`Content-Type: application/json`

| Field | Type | Required | Description |
|---|---|---|---|
| `survey_id` | string | Yes | Unique identifier for the survey |
| `participant_id` | string | Yes | Unique identifier for the participant |
| `questions` | string[] | Yes | Array of question labels/codes, one per response |
| `responses` | string[] | Yes | Array of verbatim response texts, positionally aligned with `questions` |
| `low_effort_threshold` | number | No | Effort scores at or below this value trigger a `Low-effort` flag (default: `0`, i.e. flag is off) |
| `include_sentiment` | boolean | No | Return `sentiment_ratings` in the response |
| `include_themes` | boolean | No | Return `themes` in the response |
| `include_pii` | boolean | No | Return `pii_flags` and add `Contains PII` to checks when detected |
| `include_probes` | boolean | No | Return `followup_probes` in the response |
| `include_translation` | boolean | No | Translate non-English responses to English before analysis; return `translations` in the response |
| `keystrokes` | object | No | Keystroke telemetry from `KeystrokeTracker.getPayload()` — enables `authenticity_scores` |
| `cursor_trace` | object | No | Cursor telemetry from `CursorTrace.getPayload()` — enables or enriches `authenticity_scores` |

**Notes:**
- `questions` and `responses` must be arrays of equal length. The number of questions is dynamic — send 1 or more depending on your survey.
- Only send responses that are non-empty. Omit empty responses and their corresponding question labels from both arrays.
- `questions` can be question codes (e.g. `"T1"`) or full question text. Using full text gives the AI more context for off-topic detection and probe generation.

**Example request:**

```json
{
  "survey_id": "test_cases",
  "participant_id": "RID_test_005",
  "questions": ["T1", "T2", "T3"],
  "responses": [
    "The advertisement communicates that the brand positions itself as a trustworthy and dependable option for consumers seeking reliability in their daily purchases.",
    "The advert emphasises simplicity and convenience while highlighting how the product integrates easily into everyday routines.",
    "Overall the message focuses on confidence, reliability, and ease of use for modern consumers."
  ],
  "low_effort_threshold": 3,
  "include_sentiment": true,
  "include_themes": true,
  "include_pii": true,
  "include_probes": true,
  "include_translation": true
}
```

---

### Response

All output fields use string-numeric keys (`"0"`, `"1"`, `"2"`, …) that correspond to the position of each response in the input `responses` array.

| Field | Type | Always present | Description |
|---|---|---|---|
| `error` | boolean | Yes | `true` if the request failed |
| `checks` | object | Yes | Per-response array of quality flags (see glossary below) |
| `response_groups` | object | Yes | Per-response group assignment for cross-duplicate clustering |
| `effort_ratings` | object | Yes | Per-response effort score (0–10) |
| `sentiment_ratings` | object | Only if `include_sentiment` | Per-response sentiment: `Positive`, `Negative`, `Neutral`, or `Mixed` |
| `themes` | object | Only if `include_themes` | Per-response array of up to 3 theme strings |
| `pii_flags` | object | Only if `include_pii` | Per-response array of detected PII types (empty array if none) |
| `authenticity_scores` | object | Only if `keystrokes` or `cursor_trace` provided | Per-response human authenticity score (0–100) |
| `followup_probes` | object | Only if `include_probes` | Per-response follow-up question string, or `null` if no probe needed |
| `translations` | object | Only if `include_translation` | Per-response translated text (same as original if already English) |

**Example response:**

```json
{
  "error": false,
  "checks": {
    "0": [],
    "1": [],
    "2": []
  },
  "response_groups": {
    "0": 241,
    "1": 242,
    "2": 243
  },
  "effort_ratings": {
    "0": 8,
    "1": 7,
    "2": 7
  },
  "sentiment_ratings": {
    "0": "Positive",
    "1": "Neutral",
    "2": "Positive"
  },
  "themes": {
    "0": ["brand trust", "reliability", "consumer confidence"],
    "1": ["simplicity", "convenience", "daily routine"],
    "2": ["confidence", "reliability", "ease of use"]
  },
  "pii_flags": {
    "0": [],
    "1": [],
    "2": []
  },
  "followup_probes": {
    "0": null,
    "1": null,
    "2": null
  },
  "translations": {
    "0": "The advertisement communicates that the brand positions itself as a trustworthy and dependable option for consumers seeking reliability in their daily purchases.",
    "1": "The advert emphasises simplicity and convenience while highlighting how the product integrates easily into everyday routines.",
    "2": "Overall the message focuses on confidence, reliability, and ease of use for modern consumers."
  }
}
```

---

### Checks glossary

These are all possible values that can appear inside a `checks[i]` array:

| Value | Trigger |
|---|---|
| `Automated test: Profane` | Response contains profane or offensive content |
| `Automated test: Off-topic` | Response does not address the question |
| `Automated test: Gibberish` | Response is meaningless or random text |
| `Automated test: GPT` | Response appears to be AI-generated |
| `Low-effort` | Effort score ≤ `low_effort_threshold` (and response is non-empty) |
| `Cross-duplicate response` | Response ≥ 20 chars and matches another participant's answer |
| `Self-duplicate response` | Response matches another answer from the same participant |
| `Contains PII` | PII detected (only when `include_pii: true`) |

---

### Error response

```json
{
  "error": true,
  "problem": "Questions and responses must have the same keys"
}
```

---

## Quick start

```
git clone <repo>
cd alias-open-source
npm install
export API_SECRET="Bearer sk-…"   # your OpenAI API key
node server.js                     # starts a local Express server
```

---

## Organization

```
├── config.js                 # thresholds / model / timeouts
├── keystroke-tracker.js      # client-side keystroke telemetry
├── cursor-trace.js           # client-side cursor telemetry
├── identify-duplicates.js    # server-side endpoint hit by helpers
├── helpers
│   ├── cross-duplicate-utils.js
│   ├── json-utils.js
│   ├── keystroke-utils.js    # synchronous keystroke feature extraction
│   ├── cursor-trace-utils.js # synchronous cursor feature extraction
│   ├── openai-utils.js       # 8 OpenAI functions: categorization, effort, sentiment, themes, PII, probes, translation, humanity score
│   ├── prompts.js            # 8 frozen few-shot prompt sets
│   └── string-utils.js
└── main.js                   # handler that orchestrates everything
```

`main.js` validates the payload, optionally translates responses to English, then runs all AI checks and duplicate detection in parallel. The `cross-duplicate-utils.js` helper chunks cross-participant comparisons into batches handled by `identify-duplicates.js`. Each batch runs as an independent async call so large surveys don't block the pipeline.

---

## Configuration (`config.js`)

| Key | Description |
|---|---|
| `TIMEOUT_MS` | Hard stop in milliseconds for the entire request. Returns "Request timed out" if exceeded. |
| `normLevThreshold` | Max normalised Levenshtein distance (0–1). Pairs below this are duplicates. |
| `rawLevThreshold` | Max raw Levenshtein distance (character edits). Pairs below this are duplicates. |
| `normLCSThreshold` | Min normalised LCS ratio (0–1). Pairs above this are duplicates. |
| `rawLCSThreshold` | Min absolute LCS length (characters). Pairs above this are duplicates. |
| `maxBatchSize` | Max responses per batch sent to `identify-duplicates.js`. |
| `openAIModel` | OpenAI model used for all AI checks (default: `"gpt-4o"`). |

---

## Still to implement

The following helper functions are intentionally left as placeholders. You must complete them before the duplicate pipeline will run end-to-end:

* **`getGroupValue`** (`helpers/cross-duplicate-utils.js`) — returns and increments the next group index for a question when no duplicates are found
* **`getOtherResponsesFromSurvey`** (`helpers/cross-duplicate-utils.js`) — fetches existing answers for the same survey from your database
* **`batchedResponse`** (`helpers/cross-duplicate-utils.js`) — POSTs a chunk of responses to `identify-duplicates.js` and returns metrics for each
