<p align="center">
<img src="assets/logo-black.png" alt="Roundtable Logo" width="80">
</p>

<h3 align="center">Roundtable Alias — Technical Guide</h3>

---

## Architecture overview

The API is a Node.js Express server that orchestrates two independent quality-assurance layers per request: **content analysis** (AI-based, what was written) and **behavioural analysis** (telemetry-based, how it was written). All checks for a single request run in two sequential waves inside a single HTTP call.

```
POST /v1/check
│
├─ Input validation & sanitisation
├─ Keystroke feature extraction (sync, ~0ms)
├─ [Optional] Translation — await in series (needed before AI analysis)
│
├─── WAVE 1 — parallel ──────────────────────────────────────
│    ├─ openAIGroupResponse()       → categorisation
│    ├─ openAIEffortCategorization()→ effort score 0–10
│    ├─ openAISentimentAnalysis()   → sentiment (optional)
│    ├─ openAIThemeExtraction()     → themes (optional)
│    ├─ openAIPIIDetection()        → PII (optional)
│    ├─ openAIGenerateProbe()       → follow-up probe (optional)
│    ├─ checkForSelfDuplicates()    → string distance (sync)
│    └─ checkForCrossDuplicates()   → batched string distance (async)
│
├─ Build checks[] array from wave 1 results
│
├─── WAVE 2 — parallel ──────────────────────────────────────
│    └─ openAIHumanityScore() × N  → 0–100 per field (if keystrokes present)
│
└─ Return aggregated JSON response
```

Wave 2 is deliberately sequential after wave 1 because `openAIHumanityScore` needs both the effort rating and the categorisation flags produced in wave 1 as inputs. Within wave 2, all per-field humanity score calls run in parallel.

---

## Content analysis

### Categorisation

**Function:** `openAIGroupResponse(question, response)`
**Model:** GPT-4o, temperature 0, max_tokens 10
**Prompt:** `groupResponsePrompt` (frozen few-shot, 12 examples)

Returns one of five labels:

| Label | Criteria |
|---|---|
| `Valid` | Appropriately addresses the question. May have typos, be short, or low-effort. Includes off-topic references if the question references prior context. |
| `Profane` | Contains profane, vulgar, sexually explicit, or derogatory language inappropriate to the question context. Always takes priority over other flags. |
| `Gibberish` | Nonsensical, impossible to interpret. Random keystrokes or incoherent word sequences. Typos alone do not qualify. |
| `Off-topic` | Understandable prose but unrelated to the question. If the question references prior context the AI may not have, never classify as Off-topic. |
| `GPT` | AI-generated: unusually polished, no typos, structured bullet points, contains tangential facts, or explicitly states it is an AI. |

Priority rule: Profane > Gibberish > all others.

Any label other than `Valid` is added to `checks[i]` as `Automated test: <Label>`. GPT is uppercased to `Automated test: GPT`.

---

### Effort scoring

**Function:** `openAIEffortCategorization(question, response)`
**Model:** GPT-4o, temperature 0, max_tokens 10
**Prompt:** `effortPrompt` (frozen few-shot, 12 examples with explanations)
**Output:** Integer 1–10 (0 for empty response)

The score reflects the quality and depth of engagement, not word count alone:

| Range | Typical response profile |
|---|---|
| 1–3 | Single word, one-letter answer, barely responsive (`"yes"`, `"ok"`, `"idk"`) |
| 4–6 | One to two sentences, addresses the question but adds little depth |
| 7–8 | Multiple sentences, specific detail, relevant language |
| 9–10 | Comprehensive, detailed, no typos, goes beyond what was asked |

**Low-effort flag logic:** If `effortRating <= low_effort_threshold` and the response is non-empty, `Low-effort` is added to `checks[i]`. The threshold defaults to 0 (flag is off unless explicitly set).

---

### Duplicate detection

#### Self-duplicate detection

**Function:** `checkForSelfDuplicateResponses(cleanedResponses)`
**Algorithm:** Synchronous, O(n²) pairwise comparison
**Input:** Cleaned responses (lowercased, punctuation stripped) from the same participant

For each pair of responses (i, j):

```
rawLev  = levenshteinDistance(s1, s2)
normLev = rawLev / max(len(s1), len(s2))
rawLCS  = longestCommonSubstring(s1, s2)
normLCS = rawLCS / max(len(s1), len(s2))

match = checkIfMatch(s1, s2, normLev, rawLev, normLCS, rawLCS)
```

If `match` is true, both responses receive a `Self-duplicate response` flag.

#### Cross-duplicate detection

**Function:** `checkForCrossDuplicateResponses(cleanedResponses, survey_id)`
**Algorithm:** Batched async comparison against previously seen responses for the same survey
**Min response length:** 20 characters (shorter responses are not compared)

Same matching algorithm as self-duplicate. Responses matching a prior participant's answer receive a `Cross-duplicate response` flag.

**Note:** Cross-duplicate detection requires `getOtherResponsesFromSurvey()` and related stubs in `helpers/cross-duplicate-utils.js` to be connected to a database. See README for details.

#### Matching thresholds (`config.js`)

A pair is classified as a duplicate match if **any** of the following conditions hold:

| Condition | Formula | Config key | Default |
|---|---|---|---|
| Normalised edit distance is very small | `normLev < normLevThreshold` | `normLevThreshold` | `0.175` |
| Very few raw edits needed (short strings) | `rawLev < rawLevThreshold` AND both strings > 5 chars | `rawLevThreshold` | `2` |
| Single edit at most (very short strings) | `rawLev ≤ 1` AND both strings > 2 chars | — | — |
| Large shared substring | `normLCS ≥ normLCSThreshold` | `normLCSThreshold` | `0.9` |
| Very long absolute shared substring | `rawLCS ≥ rawLCSThreshold` | `rawLCSThreshold` | `100` |

**Levenshtein distance:** Minimum number of single-character insertions, deletions, or substitutions to transform one string into the other.

**Longest common substring (LCS):** Length of the longest contiguous sequence of characters shared between two strings. Note this is contiguous substring (not subsequence).

---

### Sentiment analysis

**Function:** `openAISentimentAnalysis(question, response)`
**Model:** GPT-4o, temperature 0, max_tokens 10
**Output:** `Positive`, `Negative`, `Neutral`, or `Mixed`

`Mixed` is used when the response contains both positive and negative elements that are roughly equal. Not returned unless `include_sentiment: true`.

---

### Theme extraction

**Function:** `openAIThemeExtraction(question, response)`
**Model:** GPT-4o, temperature 0, max_tokens 60
**Output:** Comma-separated noun phrases (up to 3), or `None`

Themes are extracted as concise noun phrases describing the main topics in the response. `None` is returned if the response is too short or ambiguous to extract meaningful themes. Not returned unless `include_themes: true`.

---

### PII detection

**Function:** `openAIPIIDetection(response)`
**Model:** GPT-4o, temperature 0, max_tokens 30
**Detected types:** Name, Email, Phone, Address, SSN, Date of Birth
**Output:** Comma-separated type list, or `None`

When any PII type is detected, `Contains PII` is added to `checks[i]`. The `pii_flags[i]` array lists the specific types found. Not returned unless `include_pii: true`.

---

### Follow-up probe generation

**Function:** `openAIGenerateProbe(question, response)`
**Model:** GPT-4o, temperature 0, max_tokens 150
**Output:** A follow-up question string, or `None`

Returns `None` when the response is sufficiently detailed. Generates a contextual follow-up question for vague, short, or ambiguous responses to elicit more depth. Not returned unless `include_probes: true`.

---

### Auto-translation

**Function:** `openAITranslate(response)`
**Model:** GPT-4o, temperature 0, max_tokens 500
**Output:** English text (or original text if already English)

Translation runs in the first series step before all other AI checks. The translated text (`effectiveResponses`) is used for all wave 1 AI calls. Original text is always used for duplicate detection (string distance works across languages and comparing originals catches participants copying each other regardless of language). Not returned unless `include_translation: true`.

---

## Behavioural analysis (keystroke layer)

### Client-side telemetry (`keystroke-tracker.js`)

The tracker attaches passive event listeners to each field. It records events as `{ t, type, val }` triples:

| `type` | Browser event | `val` |
|---|---|---|
| `"f"` | `focus` | `null` |
| `"b"` | `blur` | `null` |
| `"k"` | `keydown` | Key name string (e.g. `"a"`, `"Backspace"`, `"ArrowLeft"`) |
| `"p"` | `paste` | Character count of pasted text (integer) |
| `"c"` | `copy` | Character count of copied selection (integer) |

`t` is milliseconds elapsed since the first `focus` event on that field, computed from `performance.now()`. All event listeners use `{ passive: true }` to avoid blocking rendering.

Privacy guarantee: the tracker never records the text typed or pasted — only key names and paste character counts.

---

### Feature extraction (`helpers/keystroke-utils.js`)

Feature extraction is purely synchronous. It takes the event array for a single field and returns a flat object of ~25 metrics.

#### Timing features — bot detection

**Inter-keystroke interval (IKI):** The time in milliseconds between consecutive `keydown` events. Computed as the sorted array of `t[i] - t[i-1]` for all adjacent key events.

| Feature | Formula | Interpretation |
|---|---|---|
| `ikiMean` | `sum(IKIs) / count(IKIs)` | Average time between keystrokes (ms). Human range: 80–250ms. Bots: often 10–30ms. |
| `ikiCv` | `stdDev(IKIs) / mean(IKIs)` | Coefficient of variation of IKI. **The primary bot signal.** Humans: 0.35–1.2. Bots: < 0.15 (unnaturally consistent rhythm). Only computed when ≥ `botIkiMinSamples` (default 5) keystrokes are present; otherwise `null`. |
| `ikiSpread` | `percentile(IKIs, 90) - percentile(IKIs, 10)` | Distance between the slowest and fastest decile of keystrokes. Bots cluster tightly; human spread is typically > 100ms. |

Standard deviation formula used (population):
```
stdDev = sqrt( sum((x - mean)²) / N )
```

Percentile formula (linear interpolation):
```
idx = (p / 100) * (N - 1)
value = sorted[floor(idx)] + (sorted[ceil(idx)] - sorted[floor(idx)]) * (idx - floor(idx))
```

**`suspectRegularTiming`** = `true` when `ikiCv !== null && ikiCv < 0.15`

---

#### Speed features — farming detection

| Feature | Formula | Interpretation |
|---|---|---|
| `netCharsTyped` | Count of keydown events where `key.length === 1` and key is not in the modifier set | Printable characters typed directly (excludes Backspace, Enter, arrow keys, etc.) |
| `totalDurationMs` | `lastEvent.t - firstFocus.t` | Total time the field was active (ms) |
| `grossWpm` | `(netCharsTyped / 5) / (totalDurationMs / 60000)` | Typing speed in words-per-minute (word = 5 chars). `null` if fewer than 20 chars typed. Human range: 30–90 WPM. Suspicious: > 120 WPM. |
| `timeToFirstKeystroke` | `firstKeydownEvent.t - firstFocusEvent.t` | Delay between field focus and first character typed. Instant (< 50ms) = scripted. Human: 200–3000ms (reading the question, thinking). |

**`suspectHighSpeed`** = `true` when `grossWpm > 120 && netCharsTyped >= 20`

**`suspectSurveyFarming`** = `true` when `totalDurationMs < 8000 && netCharsTyped >= 10 && backspaceCount === 0`
*(Respondent typed something but did it in under 8 seconds with no corrections — consistent with racing through the survey for incentives.)*

---

#### Paste features — AI-generated content detection

| Feature | Formula | Interpretation |
|---|---|---|
| `pasteCount` | Count of `"p"` events | Number of times text was pasted into the field |
| `pasteCharTotal` | `sum(e.val for all paste events)` | Total characters pasted |
| `largePastePresent` | `any(e.val >= 100)` | At least one paste event contained 100+ characters — suggests a pre-written paragraph |
| `pasteCharFraction` | `pasteCharTotal / (pasteCharTotal + netCharsTyped)` | Proportion of the final text that arrived via paste. Values near 1.0 with a long response = almost certainly pasted, not typed. |
| `tabAwayPresent` | `blurCount > 0` | Participant left the field at some point — could be normal thinking or copying from another tab |
| `pasteAfterBlur` | Any paste event within 2000ms after any blur event | Participant left the field and came back and immediately pasted — strongly suggests copying from an external source (another browser tab, ChatGPT, etc.) |

**`suspectAIPaste`** = `true` when `largePastePresent && pasteCharFraction > 0.70 && !correctionPresent`
*(Large paste + no corrections = the text arrived fully formed, not typed.)*

---

#### Correction features — human signal

Humans make mistakes. Absence of corrections in a long response is suspicious.

| Feature | Formula | Interpretation |
|---|---|---|
| `backspaceCount` | Count of `key === "Backspace"` keydown events | Number of deletion keystrokes |
| `deleteCount` | Count of `key === "Delete"` keydown events | Forward deletions |
| `arrowKeyCount` | Count of Arrow key events | Cursor repositioning for editing |
| `backspaceRate` | `backspaceCount / netCharsTyped` | Human range: 0.05–0.25. Zero with a long response is suspicious; very high (> 0.5) may indicate heavy re-working. |
| `correctionPresent` | `backspaceCount > 0 \|\| deleteCount > 0 \|\| arrowKeyCount > 0` | Boolean: any editing behaviour at all |
| `burstCount` | Groups of keystrokes separated by gaps > 2000ms | Humans often type in bursts with pauses to think. 2–4 bursts for a medium-length response is natural. |

---

#### Complete feature object reference

```javascript
{
  // Timing
  ikiMean,              // integer ms | null
  ikiCv,                // float 3dp | null
  ikiSpread,            // integer ms | null

  // Speed
  netCharsTyped,        // integer
  totalDurationMs,      // integer ms
  grossWpm,             // integer | null
  timeToFirstKeystroke, // integer ms | null

  // Paste
  pasteCount,           // integer
  pasteCharTotal,       // integer
  largePastePresent,    // boolean
  pasteCharFraction,    // float 0–1
  tabAwayPresent,       // boolean
  pasteAfterBlur,       // boolean

  // Corrections (human signals)
  backspaceCount,       // integer
  deleteCount,          // integer
  arrowKeyCount,        // integer
  correctionPresent,    // boolean
  backspaceRate,        // float 0–1
  burstCount,           // integer

  // Focus / blur
  blurCount,            // integer
  focusCount,           // integer

  // Pre-computed risk flags
  suspectRegularTiming, // boolean
  suspectHighSpeed,     // boolean
  suspectAIPaste,       // boolean
  suspectSurveyFarming  // boolean
}
```

---

### AI humanity scoring (`openAIHumanityScore`)

**Function:** `openAIHumanityScore(question, response, keystrokeFeatures, existingChecks, effortRating)`
**Model:** GPT-4o, temperature 0, max_tokens 5
**Prompt:** `humanityScorePrompt` (frozen few-shot, 8 examples)
**Output:** Integer 0–100 (defaults to 50 on parse failure)

The function formats all 25 keystroke features into a structured text block alongside the content check results and effort rating, then asks the model to return a single integer.

#### Why AI for the final score?

A rules-based score would require manually weighting each signal and handling every combination. The key challenge is that signals interact non-linearly:
- High WPM alone may just mean the respondent is a fast typist.
- High WPM + zero corrections + large paste fraction = strong fraud signal.
- A GPT content flag + large paste + pasteAfterBlur = near certainty of AI-generated text.
- Low effort + fast completion + no corrections = farming signal that rules alone would score differently from the same pattern with GPT content.

The AI synthesises these interactions using the patterns learned from the 8 few-shot examples and the system prompt's weighting guidance.

#### Prompt design

The system message defines:
1. Score scale (0–100 integer only, no commentary)
2. Score range semantics (what each 20-point band means)
3. Explicit weighting rules for specific signal combinations:
   - GPT flag + AI paste signals → 5–15
   - Bot-regular timing (IKI CV < 0.15) → 5–20 regardless of content
   - Low-effort content + farming signals → 15–35
   - Corrections present → strong positive signal (+15)
   - Long time to first keystroke → mild positive signal
   - Null keystroke data → default to 50 (content-only estimate)

#### Few-shot examples

8 examples cover the full archetype space:

| # | Archetype | Key signals | Score |
|---|---|---|---|
| 1 | Genuine human (medium effort) | ikiCv 0.67, WPM 48, backspaceRate 0.12, no paste | 82 |
| 2 | Bot automation | ikiCv 0.04, WPM 210, timeToFirst 12ms, no corrections | 4 |
| 3 | AI paste (GPT content flag) | 1 paste of 387 chars, pasteAfterBlur, no corrections, GPT flag | 8 |
| 4 | Survey farming | WPM 95, totalDuration 3.2s, no corrections, effort 2 | 28 |
| 5 | Genuine human (high effort) | ikiCv 0.81, WPM 52, backspaceRate 0.19, 3 bursts, effort 8 | 94 |
| 6 | No telemetry, content OK | null features, effort 5, no flags | 50 |
| 7 | External copy-paste (not AI) | 1 large paste, tabAwayPresent, pasteAfterBlur, no typing | 22 |
| 8 | Partial paste + genuine typing | pasteCharFraction 0.35, backspaceRate 0.08, ikiCv 0.61 | 71 |

---

## Configuration reference (`config.js`)

### Duplicate detection thresholds

| Key | Default | Description |
|---|---|---|
| `normLevThreshold` | `0.175` | Max normalised Levenshtein distance for a duplicate match (0–1) |
| `rawLevThreshold` | `2` | Max raw Levenshtein edit distance for a duplicate match |
| `normLCSThreshold` | `0.9` | Min normalised LCS ratio for a duplicate match (0–1) |
| `rawLCSThreshold` | `100` | Min absolute LCS length in characters for a duplicate match |
| `maxBatchSize` | `500` | Max responses per batch in cross-duplicate processing |

### Global settings

| Key | Default | Description |
|---|---|---|
| `TIMEOUT_MS` | `12000` | Hard request timeout in ms. Returns "Request timed out" if exceeded. |
| `openAIModel` | `"gpt-4o"` | OpenAI model used for all AI checks. Change to `"gpt-4o-mini"` to reduce cost at lower accuracy. |

### Keystroke thresholds (`config.keystroke`)

| Key | Default | Description |
|---|---|---|
| `botIkiCvThreshold` | `0.15` | IKI CV below this triggers `suspectRegularTiming`. Lower = stricter. |
| `botIkiMinSamples` | `5` | Minimum keystrokes before IKI CV is computed. Prevents false positives on very short responses. |
| `highSpeedWpmThreshold` | `120` | WPM above this triggers `suspectHighSpeed`. 120 WPM ≈ top 5% of human typists. |
| `highSpeedMinChars` | `20` | Minimum chars typed before WPM is checked. Prevents false positives on very short responses. |
| `largePasteCharThreshold` | `100` | Paste event with ≥ this many characters sets `largePastePresent`. |
| `aiFractionThreshold` | `0.70` | `pasteCharFraction` above this (with large paste and no corrections) triggers `suspectAIPaste`. |
| `farmingMaxDurationMs` | `8000` | Total field time below this (with sufficient chars and no corrections) triggers `suspectSurveyFarming`. |
| `farmingMinChars` | `10` | Minimum chars for farming check to apply (avoids false positives on short valid answers). |
| `pasteAfterBlurWindowMs` | `2000` | Paste within this many ms after a blur event sets `pasteAfterBlur`. |
| `burstGapMs` | `2000` | IKI gap larger than this separates one typing burst from the next. |

---

## OpenAI call summary

| Function | Prompt | max_tokens | Used for |
|---|---|---|---|
| `openAIGroupResponse` | `groupResponsePrompt` | 10 | Categorise as Valid/Profane/Gibberish/Off-topic/GPT |
| `openAIEffortCategorization` | `effortPrompt` | 10 | Score effort 1–10 |
| `openAISentimentAnalysis` | `sentimentPrompt` | 10 | Classify sentiment |
| `openAIThemeExtraction` | `themePrompt` | 60 | Extract up to 3 noun-phrase themes |
| `openAIPIIDetection` | `piiPrompt` | 30 | Detect PII types |
| `openAIGenerateProbe` | `probePrompt` | 150 | Generate follow-up question |
| `openAITranslate` | `translationPrompt` | 500 | Detect language and translate to English |
| `openAIHumanityScore` | `humanityScorePrompt` | 5 | 0–100 human authenticity score |

All calls: temperature `0`, top_p `1`. Temperature 0 ensures deterministic, consistent outputs across repeated requests for the same input.

---

## Input sanitisation pipeline

Before any analysis, all response text goes through:

1. **`coerceToStringsDeep`** (server.js) — converts all non-string leaf values in the request body to strings, preventing crashes in downstream code that assumes string inputs. The `keystrokes` field is explicitly excluded from this step because its integer timestamps must remain as numbers.

2. **`convertHTMLEntities`** (main.js) — decodes HTML entities (`&amp;` → `&`, `&lt;` → `<`, etc.) using the `he` library. Prevents HTML injection artifacts from affecting AI analysis.

3. **`cleanFinalStateString`** (main.js) — lowercase, removes punctuation and special characters. Used only for the cleaned copy passed to duplicate detection; the original decoded text is used for all AI analysis.

4. **`parseJSON` / `parseQueryString`** (json-utils.js) — multi-strategy parsing with fallbacks: direct JSON parse → escape control characters and retry → escape newlines in string values and retry → sanitize-html and retry. Handles malformed payloads gracefully.

---

## File structure

```
├── config.js                      # All thresholds, model, and timeouts
├── keystroke-tracker.js           # Client-side telemetry snippet
├── server.js                      # Express HTTP server, auth middleware
├── main.js                        # Request handler, pipeline orchestration
├── identify-duplicates.js         # Batch duplicate comparison worker
└── helpers/
    ├── keystroke-utils.js         # Synchronous feature extraction from telemetry
    ├── openai-utils.js            # 8 OpenAI wrapper functions
    ├── prompts.js                 # 8 frozen few-shot prompt arrays
    ├── cross-duplicate-utils.js   # Cross-participant duplicate orchestration
    ├── string-utils.js            # Levenshtein distance and LCS algorithms
    └── json-utils.js              # Robust JSON parsing and HTML sanitisation
```

---

## Placeholder functions (still to implement)

Three functions in `helpers/cross-duplicate-utils.js` are intentionally incomplete stubs. Connect these to your database to enable cross-participant duplicate detection:

**`getOtherResponsesFromSurvey(survey_id, question_id)`**
Should return a dict of `{ participant_id: cleaned_response }` for all prior responses to this question in this survey.

**`getGroupValue(survey_id, question_id)`**
Should fetch and atomically increment the next group index counter for this question. Used to assign unique group IDs to clusters of duplicate responses.

**`batchedResponse(targetResponses, otherResponses, authToken, baseUrl)`**
Should POST a batch of responses to `POST /v1/identify-duplicates` on the same server and return the similarity metrics. The base URL and auth token are available from environment variables.
