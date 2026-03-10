import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Hardcoded schedule (single source of truth, mirrors src/data/schedule.ts) ──
const SCHEDULE_TEXT = `FULL EVENT SCHEDULE:
Tech Carnival 2K26 dates: Day 1 = 27th March 2026, Day 2 = 28th March 2026.

Day 1 (27th March 2026):
  🏁 Assemble — 8:45 AM – 9:00 AM — 📍 Main Gate [ceremony]
  🎤 Inauguration + Flash Mob + Banner Drop — 9:00 AM – 10:00 AM — 📍 Main Auditorium [ceremony]
  🔍 Myth Busters — 9:00 AM – 11:00 AM — 📍 Seminar Hall B | Team: Solo [technical]
  ⚡ Hack Momentum (6hr Hackathon) — 10:30 AM – 5:30 PM — 📍 Main Auditorium | Team: 2-4 [technical]
  🧠 Brain Quest (Mega Quiz) — 10:30 AM – 1:30 PM — 📍 Seminar Hall A | Team: 2 [technical]
  📊 Pixel Perfect — 10:30 AM – 1:30 PM — 📍 Exhibition Hall | Team: 1-2 [technical]
  🍽️ Lunch Break — 1:30 PM – 2:30 PM — 📍 Food Court [break]
  🎯 Pitch Perfect — 2:30 PM – 5:00 PM — 📍 Seminar Hall B | Team: 1-2 [technical]
  🎮 Battle Ground – Free Fire — 2:30 PM – 5:30 PM — 📍 Gaming Arena | Team: 4 (squad) [gaming]
  💃 Dance Mania (Group Dance) — 6:00 PM – 8:00 PM — 📍 Main Stage | Team: 6-12 [cultural]

Day 2 (28th March 2026):
  🧭 Code Compass — 9:00 AM – 11:00 AM — 📍 Computer Lab 1 | Team: Solo [technical]
  🎬 Scitopia (Skit Play) — 11:30 AM – 2:00 PM — 📍 Main Auditorium | Team: 5-10 [cultural]
  🍽️ Lunch Break — 2:00 PM – 3:00 PM — 📍 Food Court [break]
  🏆 Valedictory + Special Band Performance — 3:15 PM – 6:00 PM — 📍 Main Auditorium [ceremony]`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages = body.messages || body.history || [];
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
    const eventList = (events || [])
      .map(
        (e: any) =>
          `- ${e.name} (${e.category}): ${e.description || "No description"}. Team: ${e.team_size_min}-${e.team_size_max}. Date: ${e.date || "TBA"}. Time: ${e.time || "TBA"}. Venue: ${e.venue || "TBA"}. Prize: ${e.prize_pool || "TBA"}. Rules: ${(e.rules || []).join("; ")}`,
      )
      .join("\n");

    // Group contacts by event for better lookup
    const coreTeamContacts = (contacts || []).filter((c: any) => c.role === "core_team");
    const eventCoordinators = (contacts || []).filter((c: any) => c.role !== "core_team");

    const eventContactMap: Record<string, any[]> = {};
    for (const c of eventCoordinators) {
      const eventName = c.events?.name || "Unassigned";
      if (!eventContactMap[eventName]) eventContactMap[eventName] = [];
      eventContactMap[eventName].push(c);
    }

    const contactList = [
      "CORE TEAM (general help — always show when user asks for contacts/help):",
      ...coreTeamContacts.map((c: any) =>
        `  - 🎯 ${c.name} — 📞 +91 ${c.phone}${c.email ? ` — ✉️ ${c.email}` : ""}`
      ),
      "",
      "EVENT-SPECIFIC COORDINATORS (show the matching event's coordinator when user asks about that event):",
      ...Object.entries(eventContactMap).map(([eventName, coords]) =>
        `  ${eventName}:\n${(coords as any[]).map((c: any) =>
          `    - ${c.name} — 📞 +91 ${c.phone}${c.email ? ` — ✉️ ${c.email}` : ""}`
        ).join("\n")}`
      ),
    ].join("\n");

    const faqList = (faqs || []).map((f: any) => `Q patterns: "${f.question_pattern}" → A: ${f.answer}`).join("\n");

    const leaderboard = (scores || []).reduce((acc: any, s: any) => {
      acc[s.college_name] = (acc[s.college_name] || 0) + s.points;
      return acc;
    }, {});
    const topColleges = Object.entries(leaderboard)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, pts], i) => `${i + 1}. ${name}: ${pts} points`)
      .join("\n");

    const systemPrompt = `You are CarniBOT 🤖 — the friendly, enthusiastic AI assistant for Tech Carnival 2K26, a college tech fest.

PERSONALITY: Be warm, use emojis, carnival/tech-themed language. Keep answers concise but informative.

${SCHEDULE_TEXT}

EVENTS DATA (from database):
${eventList}

CONTACTS:
${contactList}

FAQ KNOWLEDGE:
${faqList}

LEADERBOARD (Top colleges):
${topColleges || "No scores yet"}

RULES:
1. For schedule/timing questions, ALWAYS use the FULL EVENT SCHEDULE above. It is the exact schedule shown on the website.
2. Answer questions about events, registration, schedule, venue, prizes, rules, and team sizes using the data above.
3. For registration help, tell users to scroll to the Registration section on the website.
4. **CONTACT FORMAT RULES — VERY IMPORTANT:**
   When users ask for "contact", "coordinator", "phone", "help", or "talk to someone", format the response EXACTLY like this:

   📞 **Here are the people who can help you!**

   🌟 **CORE TEAM**
   ─────────────
   👤 **Name Here**
   +91 XXXXXXXXXX
   ✉️ email@example.com

   (repeat for each core team member, skip email line if no email)

   🎪 **EVENT COORDINATORS**
   ─────────────────────
   ⚡ **Event Name**
   👤 Name — +91 XXXXXXXXXX — ✉️ email@example.com

   (repeat for each event, with its emoji, skip email if none)
   (use these emojis: ⚡ Hack Momentum, 🧠 Brain Quest, 📊 Pixel Perfect, 🧭 Code Compass, 🔍 Myth Busters, 🎮 Battle Ground, 💃 Dance Mania, 🎬 Scitopia)

   💡 Tap any phone number to call directly! You can also reach us via the Contact section below 👇

   IMPORTANT: Always show ALL contacts from the data above. Include every core team member and every event coordinator. Do NOT skip any.

5. When user asks about a SPECIFIC event's coordinator only, show just that event's coordinator in a smaller format, then say "Need more contacts? Just ask! 😊"
6. If you can't answer, say: "Hmm, I'm not sure about that! 🤔 Let me connect you with our team:" and show contacts.
7. For leaderboard/scores questions, use the leaderboard data.
8. Always end responses with a helpful suggestion or follow-up question.
9. Keep responses under 200 words unless contact info or detailed info is specifically requested (contacts can be longer).
10. Use markdown formatting for readability (bold, lists, etc.)
11. Phone numbers MUST always include the +91 prefix so they become clickable links.`;
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("CarniBOT error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
