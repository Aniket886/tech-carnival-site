import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Format decimal hour to readable string, e.g. 14.5 → "2:30 PM" */
function formatHour(h: number): string {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:${min.toString().padStart(2, "0")} ${ampm}`;
}

/** Build schedule text from schedule_events rows */
function buildScheduleFromDB(rows: any[]): string {
  const lines: string[] = [
    "FULL EVENT SCHEDULE:",
    "Tech Carnival 2K26 dates: Day 1 = 27th March 2026, Day 2 = 28th March 2026.",
  ];
  for (const day of [1, 2]) {
    lines.push(`\nDay ${day} (${day === 1 ? "27th" : "28th"} March 2026):`);
    const dayEvents = rows
      .filter((e: any) => e.day === day)
      .sort((a: any, b: any) => a.start_hour - b.start_hour);
    for (const ev of dayEvents) {
      const time = `${formatHour(ev.start_hour)} – ${formatHour(ev.end_hour)}`;
      const team = ev.team_size ? ` | Team: ${ev.team_size}` : "";
      lines.push(`  ${ev.emoji} ${ev.name} — ${time} — 📍 ${ev.venue}${team} [${ev.category}]`);
    }
  }
  return lines.join("\n");
}

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

    // Fetch context data (including schedule)
    const [{ data: events }, { data: contacts }, { data: faqs }, { data: scores }, { data: scheduleRows }] = await Promise.all([
      supabase.from("events").select("*").eq("is_active", true).order("name"),
      supabase.from("bot_contacts").select("*, events(name)").eq("is_active", true).order("display_order"),
      supabase.from("bot_faqs").select("*").eq("is_active", true),
      supabase.from("college_scores").select("college_name, points").order("points", { ascending: false }).limit(10),
      supabase.from("schedule_events").select("*").eq("is_active", true).order("day").order("start_hour"),
    ]);

    // Build dynamic schedule text
    const SCHEDULE_TEXT = buildScheduleFromDB(scheduleRows || []);

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
4. **CONSISTENCY RULE — CRITICAL:** ALWAYS provide COMPLETE information. NEVER give just names without phone numbers. NEVER omit details you have. Every contact MUST include name + phone number + email (if available). Every event answer MUST include date, time, venue, team size. Be thorough and consistent — the same question must always get the same level of detail.
5. **CONTACT FORMAT RULES — VERY IMPORTANT:**
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

6. When user asks about a SPECIFIC event's coordinator only, show just that event's coordinator in a smaller format, then say "Need more contacts? Just ask! 😊"
7. If you can't answer, say: "Hmm, I'm not sure about that! 🤔 Let me connect you with our team:" and show contacts.
8. For leaderboard/scores questions, use the leaderboard data.
9. Always end responses with a helpful suggestion or follow-up question.
10. Keep responses under 200 words unless contact info or detailed info is specifically requested (contacts can be longer).
11. Use markdown formatting for readability (bold, lists, etc.)
12. Phone numbers MUST always include the +91 prefix so they become clickable links.`;

    const chatMessages = [{ role: "system", content: systemPrompt }, ...messages];

    // Helper to call an AI provider
    async function callProvider(url: string, apiKey: string, model: string) {
      return fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages: chatMessages, stream: true, temperature: 0.2 }),
      });
    }

    // Try Groq first, fallback to Lovable AI
    let response: Response | null = null;

    if (GROQ_API_KEY) {
      try {
        response = await callProvider(
          "https://api.groq.com/openai/v1/chat/completions",
          GROQ_API_KEY,
          "llama-3.1-8b-instant"
        );
        if (!response.ok) {
          console.log(`Groq returned ${response.status}, falling back to Lovable AI`);
          await response.text();
          response = null;
        }
      } catch (e) {
        console.log("Groq request failed, falling back to Lovable AI:", e);
        response = null;
      }
    }

    if (!response && LOVABLE_API_KEY) {
      response = await callProvider(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        LOVABLE_API_KEY,
        "google/gemini-2.5-flash-lite"
      );
    }

    if (!response) {
      return new Response(JSON.stringify({ error: "No AI provider available" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      console.error("AI error:", response.status, t);
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
