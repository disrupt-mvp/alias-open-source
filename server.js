const express = require("express");
const crypto = require("crypto");

const mainModule = require("./main.js");
const identifyModule = require("./identify-duplicates.js");

// Support: module.exports = fn  OR exports.handler = fn OR export default fn
const mainHandler =
  mainModule?.handler || mainModule?.default || mainModule;

const identifyDuplicatesHandler =
  identifyModule?.handler || identifyModule?.default || identifyModule;

if (typeof mainHandler !== "function") {
  throw new Error(
    `main handler export not found. Got: ${Object.keys(mainModule || {}).join(", ")}`
  );
}
if (typeof identifyDuplicatesHandler !== "function") {
  throw new Error(
    `identify-duplicates handler export not found. Got: ${Object.keys(identifyModule || {}).join(", ")}`
  );
}

const app = express();
app.use(express.json({ limit: "2mb" }));

function requireAuth(req, res, next) {
  const expected = process.env.INTERNAL_AUTH_TOKEN;
  if (!expected) return res.status(500).json({ error: "Missing INTERNAL_AUTH_TOKEN" });

  const got = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const ok =
    got &&
    got.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));

  if (!ok) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/health", (req, res) => res.status(200).send("ok"));

app.post("/v1/check", requireAuth, async (req, res) => {
  try {
    const event = { body: JSON.stringify(req.body), headers: req.headers };
    const out = await mainHandler(event, {});
    res.status(out.statusCode || 200).send(out.body || "");
  } catch (err) {
    res.status(500).json({ error: err?.message || "Internal error" });
  }
});

app.post("/v1/identify-duplicates", requireAuth, async (req, res) => {
  try {
    const event = { body: JSON.stringify(req.body), headers: req.headers };
    const out = await identifyDuplicatesHandler(event, {});
    res.status(out.statusCode || 200).send(out.body || "");
  } catch (err) {
    res.status(500).json({ error: err?.message || "Internal error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Listening on ${PORT}`));
