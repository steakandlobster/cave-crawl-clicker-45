import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://preview--cave-crawl-clicker-45.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://cave-crawl-clicker-45.lovable.app'
];

function getAllowedOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  const referer = req.headers.get('referer');
  try {
    if (referer) {
      const refererOrigin = new URL(referer).origin;
      if (ALLOWED_ORIGINS.includes(refererOrigin)) return refererOrigin;
    }
  } catch {}
  return ALLOWED_ORIGINS[0];
}

function getCorsHeaders(req: Request) {
  const allowedOrigin = getAllowedOrigin(req);
  const requestedHeaders = req.headers.get('access-control-request-headers') || 'authorization, x-client-info, apikey, content-type, cookie';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': requestedHeaders,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

const SUPABASE_URL = "https://aegayadckentahcljxhf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZ2F5YWRja2VudGFoY2xqeGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDA5NzUsImV4cCI6MjA3MTIxNjk3NX0.9iBkfyED3zOP5XWcwcheLgp7Ut7lGUHhLCjBhTDFulU";

function toHex(buffer: ArrayBuffer) {
  const byteArray = new Uint8Array(buffer);
  const hexCodes: string[] = [];
  for (const byte of byteArray) {
    const hex = byte.toString(16).padStart(2, "0");
    hexCodes.push(hex);
  }
  return hexCodes.join("");
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    const {
      amount_wagered,
      max_rounds = 6,
      client_seed = "",
      session_id,
    }: { amount_wagered: number; max_rounds?: number; client_seed?: string; session_id?: string } = await req.json();

    // Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Generate server seed and commitment
    const server_seed = crypto.randomUUID() + ":" + crypto.getRandomValues(new Uint8Array(16)).join("");
    const commitmentBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${server_seed}|${client_seed}`)
    );
    const game_hash = toHex(commitmentBuffer);

    // Deterministically pre-generate outcomes per round
    const seedHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${game_hash}`)
    );
    const seedHex = toHex(seedHashBuffer).slice(0, 8);
    const seedInt = parseInt(seedHex, 16) || 1;
    const rand = mulberry32(seedInt);

    // Pre-generate outcomes for each round using independent probabilities
    const optionsByRound: Array<{ outcomes: Array<{ isTrapped: boolean; payout: number }> }> = [];
    for (let r = 0; r < max_rounds; r++) {
      // Independent death chances and reward multipliers for each path
      const deathChances = [0.089, 0.168, 0.252]; // Safe (8%), Medium (17%), High Risk (25%)
      const rewards = [0.24, 0.45, 0.76]; // Reward multipliers for each path
      
      const outcomes = [];
      for (let i = 0; i < 3; i++) {
        const trapRoll = rand();
        const isTrapped = trapRoll < deathChances[i]; // Independent check for each path
        const payout = isTrapped ? 0 : Math.round(rewards[i] * amount_wagered * 1e6) / 1e6;
        outcomes.push({ isTrapped, payout });
      }
      
      optionsByRound.push({ outcomes });
    }

    const pre_generated_results = { max_rounds, optionsByRound, commitment: game_hash };

    // Create session row
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", user.id)
      .maybeSingle();
    if (profErr) throw profErr;

    const { data: sessionRow, error: insertErr } = await supabase
      .from("game_sessions")
      .insert({
        user_id: user.id,
        game_hash,
        pre_generated_results,
        amount_wagered,
        status: "in_progress",
        session_id: session_id || crypto.randomUUID(),
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({
        session_id: sessionRow.id,
        game_hash,
        max_rounds,
        username: profile?.username || "Explorer",
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("start-game error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});