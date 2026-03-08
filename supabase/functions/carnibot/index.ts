import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch context data
    const [{ data: events }, { data: contacts }, { data: faqs }, { data: scores }] = await Promise.all([
      supabase.from("events").select("*").eq("is_active", true).order("name"),
      supabase.from("bot_contacts").select("*, events(name)").eq("is_active", true).order("display_order"),
      supabase.from("bot_faqs").select("*").eq("is_active", true),
      supabase.from("college_scores").select("college_name, points").order("points", { ascending: false }).limit(10),
    ]);

    // Build context
    const eventList = (events || []).map((e: any) =>
      `- ${e.name} (${e.category}): ${e.description || 'No description'}. Team: ${e.team_size_min}-${e.team_size_max}. Date: ${e.date || 'TBA'}. Time: ${e.time || 'TBA'}. Venue: ${e.venue || 'TBA'}. Prize: ${e.prize_pool || 'TBA'}. Rules: ${(e.rules || []).join('; ')}`
    ).join('\n');

    const contactList = (contacts || []).map((c: any) =>
      `- ${c.role === 'core_team' ? '🎯 Core Team' : `🎪 ${c.events?.name || 'Event'} Coordinator`}: ${c.name} — 📞 +91 ${c.phone}${c.email ? ` — ✉️ ${c.email}` : ''}`
    ).join('\n');

    const faqList = (faqs || []).map((f: any) => `Q patterns: "${f.question_pattern}" → A: ${f.answer}`).join('\n');

    const leaderboard = (scores || []).reduce((acc: any, s: any) => {
      acc[s.college_name] = (acc[s.college_name] || 0) + s.points;
      return acc;
    }, {});
    const topColleges = Object.entries(leaderboard)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, pts], i) => `${i + 1}. ${name}: ${pts} points`)
      .join('\n');

    const systemPrompt = `You are CarniBOT 🤖 — the friendly, enthusiastic AI assistant for Tech Carnival 2K26, a college tech fest.

PERSONALITY: Be warm, use emojis, carnival/tech-themed language. Keep answers concise but informative.

EVENTS DATA:
${eventList}

CONTACTS:
${contactList}

FAQ KNOWLEDGE:
${faqList}

LEADERBOARD (Top colleges):
${topColleges || 'No scores yet'}

RULES:
1. Answer questions about events, registration, schedule, venue, prizes, rules, and team sizes using the data above.
2. For registration help, tell users to scroll to the Registration section on the website.
3. When users ask for contact info, phone numbers, or say "help", "talk to someone", "coordinator" — show the relevant contacts from the list above.
4. If you can't answer, say: "Hmm, I'm not sure about that! 🤔 Let me connect you with our team:" and show contacts.
5. For leaderboard/scores questions, use the leaderboard data.
6. Always end responses with a helpful suggestion or follow-up question.
7. Keep responses under 200 words unless detailed info is specifically requested.
8. Use markdown formatting for readability (bold, lists, etc.)`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("CarniBOT error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
