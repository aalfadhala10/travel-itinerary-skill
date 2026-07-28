/**
 * Sanad AI Worker — Cloudflare Worker
 *
 * One action (POST JSON):
 *   action:"extract" -> read a pasted instruction / email / minute and return the
 *                       structured fields of a variation order, ready for the form.
 *
 * The Anthropic API key lives ONLY here, as an encrypted secret (env.ANTHROPIC_API_KEY),
 * exactly as in the Bosla worker. The app works without this Worker — it falls back to a
 * local rule-based reader — so a missing key degrades the app, it doesn't break it.
 *
 * DELIBERATELY NOT HERE: letter generation. The notice, the submission and the
 * substantiation pack are built from fixed templates in the app, not by a model. A letter
 * that serves contractual notice must say the same thing every time, and a hallucinated
 * clause number in a notice is worse than no notice at all. The model is only ever asked to
 * READ what a human already wrote — it never asserts a fact about the contract.
 *
 * SETUP: see vo/SETUP.md.
 */

const ALLOWED_ORIGINS = [
  "https://aalfadhala10.github.io",
  "http://localhost",
  "http://127.0.0.1",
];

// Kept in step with the <select> in the app. If you add a source there, add it here too.
const SOURCES = ["si", "email", "verbal", "rfi", "drawing", "minutes", "other"];

function corsHeaders(origin) {
  const ok = ALLOWED_ORIGINS.some((o) => origin && origin.startsWith(o));
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
function reply(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });
    if (request.method !== "POST") return reply({ error: "POST only" }, 405, origin);

    let body;
    try { body = await request.json(); } catch { return reply({ error: "bad json" }, 400, origin); }

    try {
      if (body.action === "extract") {
        if (!env.ANTHROPIC_API_KEY) return reply({ error: "server not configured" }, 500, origin);
        const text = String(body.text || "").slice(0, 6000).trim();
        if (text.length < 10) return reply({ error: "text too short" }, 400, origin);
        const lang = body.lang === "ar" ? "ar" : "en";
        return reply({ vo: await extractVo(text, lang, env.ANTHROPIC_API_KEY) }, 200, origin);
      }
      return reply({ error: "unknown action" }, 400, origin);
    } catch (e) {
      return reply({ error: String(e && e.message ? e.message : e) }, 500, origin);
    }
  },
};

// --- extraction ------------------------------------------------------------------

const VO_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short title for the variation, under 90 characters." },
    description: { type: "string", description: "What was instructed, in the writer's own terms." },
    dateInstructed: { type: "string", description: "YYYY-MM-DD if a date is stated, else empty." },
    instructedBy: { type: "string", description: "Who issued it, if named. Else empty." },
    source: { type: "string", enum: SOURCES, description: "How it was instructed." },
    clause: { type: "string", description: "Contract clause number ONLY if the text cites one. Else empty." },
    costImpact: { type: "string", description: "Amount as digits only, no currency or commas. Empty if not stated." },
    timeImpact: { type: "string", description: "Whole days as digits. Empty if not stated." },
    confidence: { type: "string", enum: ["high", "medium", "low"], description: "How clearly this text describes a variation." },
  },
  required: [
    "title", "description", "dateInstructed", "instructedBy",
    "source", "clause", "costImpact", "timeImpact", "confidence",
  ],
  additionalProperties: false,
};

const SYSTEM = `You read a single document from a construction project — a site instruction, an
email, a meeting minute, an RFI response — and pull out the facts needed to log a variation
order in a register.

The one rule that matters: extract, never infer. This record may end up supporting a
contractual claim, so a fact you invented is worse than a blank field.

- A contract clause goes in "clause" ONLY if the text actually cites one. Never pick a clause
  because the work "sounds like" a variation. If none is cited, return "".
- An amount goes in "costImpact" ONLY if the text states one. "Cost to be agreed", "TBA", or a
  rate without a quantity all mean "".
- A date goes in "dateInstructed" ONLY if the document states or is dated one. Convert to
  YYYY-MM-DD. If the day is ambiguous between formats, prefer day-first (the Gulf convention).
  If no date appears, return "".
- "instructedBy" is the person or body that issued the instruction, not the recipient and not
  the sender of a forwarding email.
- "source" describes how the instruction arrived. Use "verbal" when the document records a
  verbal instruction given on site, even if the record itself is an email.
- "description" quotes or closely paraphrases the scope in the writer's own terms. Do not
  summarise away technical detail — drawing numbers, revisions, levels and quantities are the
  evidence.
- "confidence" is "low" when the text may not describe a variation at all (a progress update,
  a general enquiry). Say so rather than forcing a reading.

Write "title" and "description" in the same language as the source document.`;

async function extractVo(text, lang, apiKey) {
  const user =
    `Extract the variation order details from the document below.\n` +
    `The person logging this reads ${lang === "ar" ? "Arabic" : "English"}.\n\n` +
    `<document>\n${text}\n</document>`;
  const out = await claude(apiKey, SYSTEM, user, VO_SCHEMA, 4000);
  // Belt and braces: the schema constrains the shape, we constrain the values.
  return {
    title: str(out.title, 120),
    description: str(out.description, 2000),
    dateInstructed: /^\d{4}-\d{2}-\d{2}$/.test(out.dateInstructed || "") ? out.dateInstructed : "",
    instructedBy: str(out.instructedBy, 120),
    source: SOURCES.includes(out.source) ? out.source : "other",
    clause: str(out.clause, 20),
    costImpact: numOrEmpty(out.costImpact),
    timeImpact: numOrEmpty(out.timeImpact),
    confidence: ["high", "medium", "low"].includes(out.confidence) ? out.confidence : "low",
  };
}
function str(v, max) { return String(v == null ? "" : v).slice(0, max).trim(); }
function numOrEmpty(v) {
  const n = Number(String(v == null ? "" : v).replace(/[,\s]/g, ""));
  return isFinite(n) && n >= 0 && String(v).trim() !== "" ? n : "";
}

// --- Claude call with guaranteed-JSON output (structured outputs) ------------------
// Same shape as the Bosla worker: retries transient upstream errors, surfaces the rest.
// Thinking is on by default on this model and shares the max_tokens budget with the reply,
// so effort is held low (this is a read, not a judgement) and max_tokens leaves headroom.
async function claude(apiKey, system, user, schema, maxTokens) {
  const body = JSON.stringify({
    model: "claude-opus-5",
    max_tokens: maxTokens,
    // The system prompt is byte-identical on every request, so Anthropic caches it and a
    // cache read costs ~10% of a normal input token.
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
    output_config: { effort: "low", format: { type: "json_schema", schema } },
  });
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    let r;
    try {
      r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body,
      });
    } catch (e) {
      lastErr = new Error("network: " + (e && e.message ? e.message : e));
      await sleep(400 * (attempt + 1));
      continue;
    }
    const raw = await r.text();
    if (!r.ok) {
      lastErr = new Error("anthropic " + r.status + ": " + raw.slice(0, 200));
      if (r.status === 429 || r.status >= 500) { await sleep(500 * (attempt + 1)); continue; } // transient — retry
      throw lastErr; // 4xx (bad request/auth/model) — don't retry
    }
    let data;
    try { data = JSON.parse(raw); }
    catch { throw new Error("non-JSON reply from Claude: " + raw.slice(0, 200)); }
    if (data.type === "error") throw new Error(data.error && data.error.message || "api error");
    // A refused request comes back 200 with an empty/partial body — check before reading it.
    if (data.stop_reason === "refusal") throw new Error("request declined by safety classifier");
    if (data.stop_reason === "max_tokens") throw new Error("reply cut off — raise max_tokens");
    const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    try { return JSON.parse(txt); }
    catch { throw new Error("Claude did not return valid JSON"); }
  }
  throw lastErr || new Error("api unavailable");
}
function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }
