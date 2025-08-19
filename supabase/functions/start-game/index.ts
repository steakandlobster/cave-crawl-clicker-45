import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    const {
      amount_wagered,
      max_rounds = 6,
      client_seed = "",
    }: { amount_wagered: number; max_rounds?: number; client_seed?: string } = await req.json();

    // Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const optionsByRound: Array<{ trapIndex: number; payouts: number[] }> = [];
    for (let r = 0; r < max_rounds; r++) {
      const trapIndex = Math.floor(rand() * 3);
      // payouts between 0.025 and 0.075 ETH
      const payouts = [0, 1, 2].map(() => {
        const v = 0.025 + rand() * 0.05;
        return Math.round(v * 1e6) / 1e6; // 6 decimals
      });
      optionsByRound.push({ trapIndex, payouts });
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("start-game error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});