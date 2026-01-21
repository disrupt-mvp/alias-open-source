/**
 * server.js
 * Minimal Express wrapper to expose the repo's Netlify/Lambda-style handlers as HTTP APIs.
 *
 * Endpoints:
 *  - GET  /health
 *  - POST /v1/check
 *  - POST /v1/identify-duplicates
 *
 * Env vars:
 *  - INTERNAL_AUTH_TOKEN (required)
 *  - API_SECRET (required by openai-utils.js, typically "Bearer sk-...")
 */

const express = require("express");
const crypto = require("crypto");

// Load the handler modules
const mainModule = require("./main.js");
const identifyModule = require("./identify-duplicates.js");

// Support different export styles:
// - module.exports = fn
// - exports.handler = fn
// - export default fn (transpiled to .default)
const mainHandler = mainModule?.handler || mainModule?.default || mainModule;
const identifyDuplicatesHandler =
  identifyModule?.handler || identifyModule?.default || identifyModule;

// Fail fast on startup if exports are unexpected
if (typeof mainHandler !== "function") {
  throw new Error(
    `main handler export not found. Got exports: ${Object.keys(mainModule || {}).join(", ")}`
  );
}
if (typeof identifyDuplicatesHandler !== "function") {
  throw new Error(
    `identify-duplicates handler export not found. Got exports: ${Object.keys(
      identifyModule || {}
    ).join(", ")}`
  );
}

const app = express();

// Parse JSON bodies
app.use(express.json({ limit: "2mb" }));

/**
 * Coerce all leaf values in an object/array tree into strings.
 * This prevents crashes when upstream code assumes fields are strings
 * (e.g., he.decode() calling .replace()).
 */
function coerceToStringsDeep(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;

  if (Array.isArray(value)) return value.map(coerceToStringsDeep);

  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = coerceToStringsDeep(v);
    return out;
  }

  return String(value);
}

/**
 * Simple Bearer auth middleware.
 * Client must send: Authorization: Bearer <INTERNAL_AUTH_TOKEN>
 */
function requireAuth(req, res, next) {
  const expected = process.env.INTERNAL_AUTH_TOKEN;
  if (!expected) return res.status(500).json({ error: "Missing INTERNAL_AUTH_TOKEN" });

  const got = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");

  // timing-safe compare
  const ok =
    got &&
    got.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));

  if (!ok) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// Health check endpoint for Render
app.get("/health", (req, res) => res.status(200).send("ok"));

// Optional: friendly root
app.get("/", (req, res) =>
  res.status(200).send("Potentia Insight API is running. See /health")
);

// Main endpoint: run all checks
app.post("/v1/check", requireAuth, async (req, res) => {
  try {
    const cleanedBody = coerceToStringsDeep(req.body);
    const event = { body: JSON.stringify(cleanedBody), headers: req.headers };

    const out = await mainHandler(event, {});
    res.status(out.statusCode || 200).send(out.body || "");
  } catch (err) {
    res.status(500).json({ error: err?.message || "Internal error" });
  }
});

// Duplicate worker endpoint: called by batchedResponse()
app.post("/v1/identify-duplicates", requireAuth, async (req, res) => {
  try {
    const cleanedBody = coerceToStringsDeep(req.body);
    const event = { body: JSON.stringify(cleanedBody), headers: req.headers };

    const out = await identifyDuplicatesHandler(event, {});
    res.status(out.statusCode || 200).send(out.body || "");
  } catch (err) {
    res.status(500).json({ error: err?.message || "Internal error" });
  }
});

const PORT = process.env.PORT || 3000;

// Render requires binding to 0.0.0.0 and the provided PORT
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Potentia Insight API listening on ${PORT}`);
});
