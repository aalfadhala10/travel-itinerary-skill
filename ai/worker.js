/**
 * Bosla AI Worker — Cloudflare Worker
 *
 * Two jobs, both powered by Claude:
 *   action:"city"  -> generate a full city we don't have yet (real POIs, coords, hotels)
 *   action:"parse" -> turn a free-text / voice trip description into a structured plan
 *
 * The Anthropic API key lives ONLY here, as an encrypted secret (env.ANTHROPIC_API_KEY).
 * The website never sees it. This is why we need a Worker and can't call Claude from the page.
 *
 * SETUP: see ai/SETUP.md (create two free accounts, paste this in, add the secret).
 */

// Only these origins may call the Worker (stops strangers from spending your key).
const ALLOWED_ORIGINS = [
  "https://aalfadhala10.github.io",
  "http://localhost",
  "http://127.0.0.1",
];

const TAGS  = ["Culture", "Food", "Nature", "Shopping", "Relax"];
const CONDS = ["veryhot", "hotdry", "hothumid", "warm", "mild", "tropical", "alpine"];

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
    if (!env.ANTHROPIC_API_KEY) return reply({ error: "server not configured" }, 500, origin);

    let body;
    try { body = await request.json(); } catch { return reply({ error: "bad json" }, 400, origin); }

    try {
      if (body.action === "city") {
        const name = String(body.name || "").slice(0, 60).trim();
        if (name.length < 2) return reply({ error: "name too short" }, 400, origin);
        return reply({ city: await generateCity(name, env.ANTHROPIC_API_KEY) }, 200, origin);
      }
      if (body.action === "parse") {
        const text = String(body.text || "").slice(0, 1200).trim();
        if (!text) return reply({ error: "empty text" }, 400, origin);
        return reply({ parsed: await parseTrip(text, env.ANTHROPIC_API_KEY) }, 200, origin);
      }
      return reply({ error: "unknown action" }, 400, origin);
    } catch (e) {
      return reply({ error: String(e && e.message ? e.message : e) }, 500, origin);
    }
  },
};

// --- Claude call with guaranteed-JSON output (structured outputs) ---------------
async function claude(apiKey, model, system, user, schema, maxTokens) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema } },
    }),
  });
  const data = await r.json();
  if (data.type === "error") throw new Error(data.error && data.error.message || "api error");
  const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(txt);
}

// --- Generate a missing city (Sonnet — accuracy matters, and it's cached after) --
const CITY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["valid","city","country","flag","region","blurbEn","blurbAr","blurbEs",
    "summerCond","summerTemp","costBudget","costMid","costLux","curSymbol","curRate",
    "lat","lng","poi","food","hotelsBudget","hotelsMid","hotelsLux"],
  properties: {
    valid: { type: "boolean" },
    city: { type: "string" }, country: { type: "string" }, flag: { type: "string" },
    region: { type: "string", enum: ["eu","asia","me","africa","islands","americas","oceania"] },
    blurbEn: { type: "string" }, blurbAr: { type: "string" }, blurbEs: { type: "string" },
    summerCond: { type: "string", enum: CONDS }, summerTemp: { type: "integer" },
    costBudget: { type: "integer" }, costMid: { type: "integer" }, costLux: { type: "integer" },
    curSymbol: { type: "string" }, curRate: { type: "number" },
    lat: { type: "number" }, lng: { type: "number" },
    poi: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["n","a","t","lat","lng"], properties: {
        n: { type: "string" }, a: { type: "string" },
        t: { type: "array", items: { type: "string", enum: TAGS } },
        lat: { type: "number" }, lng: { type: "number" } } } },
    food: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["n","a"], properties: { n: { type: "string" }, a: { type: "string" } } } },
    hotelsBudget: { type: "array", items: { type: "string" } },
    hotelsMid: { type: "array", items: { type: "string" } },
    hotelsLux: { type: "array", items: { type: "string" } },
  },
};

function generateCity(name, apiKey) {
  const system =
    "You produce accurate travel data for a real city or town for a trip-planning app. " +
    "Use only REAL, well-known points of interest and their true latitude/longitude. " +
    "If the requested place is not a real, travelable destination, return valid=false and leave other fields blank/zero.\n" +
    "Rules: costs are USD per person per day (Budget/Mid/Luxury). curSymbol/curRate are the local " +
    "currency symbol and its rate to 1 USD (e.g. EUR curRate 0.92). summerTemp is the typical August high in Celsius. " +
    "Give 7 POIs (each with 1-2 tags from Culture/Food/Nature/Shopping/Relax and real coordinates) and 5 food spots " +
    "(favor halal-friendly or clearly vegetarian options where they genuinely exist, matching real restaurants). " +
    "Give 4-5 real hotel names per tier. blurbEn/Ar/Es are one short vivid sentence each (Arabic and Spanish translations). " +
    "flag is the country's flag emoji. Pick region from the allowed list.";
  return claude(apiKey, "claude-sonnet-5", system, "Generate travel data for: " + name, CITY_SCHEMA, 2200);
}

// --- Parse a free-text / voice trip description (Haiku — cheap, runs per plan) ---
const PARSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["cities", "days", "vibes", "budget", "roadtrip"],
  properties: {
    cities: { type: "array", items: { type: "string" } },
    days: { type: "integer" },
    vibes: { type: "array", items: { type: "string", enum: TAGS } },
    budget: { type: "string", enum: ["Budget", "Mid-range", "Luxury"] },
    roadtrip: { type: "boolean" },
  },
};

function parseTrip(text, apiKey) {
  const system =
    "Extract a structured trip from the user's description (any language, typos allowed). " +
    "cities: the destinations IN THE ORDER visited, corrected to their common English names. " +
    "days: total days — if the text lists nights per stop, SUM them. vibes: 0-3 from the allowed tags. " +
    "budget: Budget, Mid-range, or Luxury (default Mid-range). roadtrip: true if they drive/rent a car between stops.";
  return claude(apiKey, "claude-haiku-4-5", system, text, PARSE_SCHEMA, 500);
}
