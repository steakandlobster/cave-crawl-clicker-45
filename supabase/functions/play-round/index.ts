import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://aegayadckentahcljxhf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZ2F5YWRja2VudGFoY2xqeGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDA5NzUsImV4cCI6MjA3MTIxNjk3NX0.9iBkfyED3zOP5XWcwcheLgp7Ut7lGUHhLCjBhTDFulU";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    const { session_id, round_number, option_index } = (await req.json()) as {
      session_id: string;
      round_number: number;
      option_index: number;
    };

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

    // Fetch session
    const { data: session, error: sessErr } = await supabase
      .from("game_sessions")
      .select("id, user_id, pre_generated_results, amount_wagered, status")
      .eq("id", session_id)
      .single();
    if (sessErr) throw sessErr;
    if (session.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (session.status !== "in_progress") {
      return new Response(JSON.stringify({ error: "Game not in progress" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pre = session.pre_generated_results as any;
    const round = pre?.optionsByRound?.[round_number - 1];
    if (!round) {
      return new Response(JSON.stringify({ error: "Invalid round" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const outcome = round.outcomes[option_index];
    const isSuccessful = !outcome.isTrapped;
    const treasureFound = outcome.payout;

    // Get current user choices and add this round's choice
    const { data: currentSession, error: getSessionErr } = await supabase
      .from("game_sessions")
      .select("user_choices")
      .eq("id", session_id)
      .single();
    if (getSessionErr) throw getSessionErr;

    const userChoices = (currentSession.user_choices as any[]) || [];
    userChoices.push({
      round: round_number,
      option_selected: option_index,
      was_successful: isSuccessful,
      credits_won: treasureFound,
    });

    // Update session with the new choice
    const { error: updateChoicesErr } = await supabase
      .from("game_sessions")
      .update({ user_choices: userChoices })
      .eq("id", session_id);
    if (updateChoicesErr) throw updateChoicesErr;

    // Calculate total winnings from user choices
    const totalScore = userChoices.reduce((acc: number, choice: any) => acc + (choice.credits_won || 0), 0);

    let gameCompleted = false;
    let final_result: "win" | "loss" | null = null;
    let net_result: number | null = null;
    let passages_navigated: number | null = null;

    const max_rounds = pre?.max_rounds ?? 6;

    if (!isSuccessful || round_number >= max_rounds) {
      gameCompleted = true;
      final_result = isSuccessful ? "win" : "loss";
      passages_navigated = isSuccessful ? max_rounds : Math.max(0, round_number - 1);
      net_result = totalScore - (session.amount_wagered as number);

      // Complete the session
      const { error: updateErr } = await supabase
        .from("game_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          passages_navigated,
          final_result,
          net_result,
        })
        .eq("id", session_id);
      if (updateErr) throw updateErr;

      // Update leaderboard (today only)
      const today = new Date().toISOString().split("T")[0];
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      if (profErr) throw profErr;
      const username = profile?.username || "Explorer";

      const roundsPlayed = isSuccessful ? max_rounds : round_number; // counts the losing click as played

      // Get existing row for today
      const { data: existing, error: getLbErr } = await supabase
        .from("global_leaderboard")
        .select("id,daily_rounds,daily_net_credits,total_rounds,total_net_credits")
        .eq("id", user.id)
        .eq("date", today)
        .maybeSingle();
      if (getLbErr) throw getLbErr;

      if (existing) {
        const { error: updLbErr } = await supabase
          .from("global_leaderboard")
          .update({
            username,
            daily_rounds: (existing.daily_rounds || 0) + roundsPlayed,
            daily_net_credits: (existing.daily_net_credits || 0) + (net_result || 0),
            total_rounds: (existing.total_rounds || 0) + roundsPlayed,
            total_net_credits: (existing.total_net_credits || 0) + (net_result || 0),
          })
          .eq("id", user.id)
          .eq("date", today);
        if (updLbErr) throw updLbErr;
      } else {
        const { error: insLbErr } = await supabase.from("global_leaderboard").insert({
          id: user.id,
          username,
          date: today,
          daily_rounds: roundsPlayed,
          daily_net_credits: net_result || 0,
          total_rounds: roundsPlayed,
          total_net_credits: net_result || 0,
        });
        if (insLbErr) throw insLbErr;
      }
    }

    return new Response(
      JSON.stringify({
        isSuccessful,
        treasureFound,
        totalScore,
        nextRound: round_number + 1,
        gameCompleted,
        final_result,
        net_result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("play-round error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});