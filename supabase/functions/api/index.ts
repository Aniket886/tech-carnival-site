import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// Rate limiting (in-memory, per-instance)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(apiKey: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(apiKey);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(apiKey, { count: 1, resetAt: now + 60000 });
    return true;
  }
  entry.count++;
  return entry.count <= 100;
}

// Validate API key and return event_id
async function validateApiKey(req: Request, supabase: ReturnType<typeof createClient>) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return { error: json({ error: "Missing x-api-key header" }, 401) };
  if (!checkRateLimit(apiKey)) return { error: json({ error: "Rate limit exceeded (100/min)" }, 429) };

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, event_id, is_active")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (error || !data) return { error: json({ error: "Invalid API key" }, 401) };
  if (!data.is_active) return { error: json({ error: "API key is inactive" }, 403) };

  // Update last_used_at (fire-and-forget)
  supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(() => {});

  return { eventId: data.event_id as string, apiKeyId: data.id as string };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Extract path after the function name
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Path format: /api/v1/<endpoint>
  const version = pathParts.find((_, i) => pathParts[i - 1] === "api" || pathParts[i] === "v1");
  const endpointIndex = pathParts.indexOf("v1");
  const endpoint = endpointIndex >= 0 ? pathParts[endpointIndex + 1] : pathParts[pathParts.length - 1];

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const auth = await validateApiKey(req, supabase);
  if ("error" in auth) return auth.error;
  const { eventId, apiKeyId } = auth;

  try {
    // ── POST /register ──
    if (endpoint === "register" && req.method === "POST") {
      const body = await req.json();
      const { team_name, leader_name, leader_email, leader_phone, college_name, semester, members, college_id } = body;
      if (!leader_name || !leader_email || !leader_phone || !college_name) {
        return json({ error: "Missing required fields: leader_name, leader_email, leader_phone, college_name" }, 400);
      }

      const { data, error } = await supabase.from("registrations").insert({
        event_id: eventId,
        team_name: team_name || null,
        leader_name,
        leader_email,
        leader_phone,
        college_name,
        college_id: college_id || null,
        semester: semester || null,
        members: members || null,
        source: "event_site",
      }).select("id").single();

      if (error) return json({ error: error.message }, 400);

      // Log the update
      await supabase.from("event_updates").insert({
        event_id: eventId,
        api_key_id: apiKeyId,
        update_type: "registration",
        payload: { registration_id: data.id, team_name, leader_name },
      });

      return json({ success: true, registration_id: data.id, message: "Registration submitted successfully" });
    }

    // ── GET /event ──
    if (endpoint === "event" && req.method === "GET") {
      const { data, error } = await supabase
        .from("events")
        .select("name, description, date, time, venue, team_size_min, team_size_max, rules, is_active, icon, category, prize_pool, slug")
        .eq("id", eventId)
        .single();
      if (error) return json({ error: error.message }, 404);
      return json({ success: true, event: data });
    }

    // ── POST /scores ──
    if (endpoint === "scores" && req.method === "POST") {
      const body = await req.json();
      const { college_name, points, position, team_name } = body;
      if (!college_name || points === undefined) {
        return json({ error: "Missing required fields: college_name, points" }, 400);
      }

      // Get event info for category/name
      const { data: event } = await supabase
        .from("events")
        .select("name, category")
        .eq("id", eventId)
        .single();
      if (!event) return json({ error: "Event not found" }, 404);

      const { data, error } = await supabase.from("college_scores").insert({
        event_id: eventId,
        event_name: event.name,
        category: event.category,
        college_name,
        points,
        position: position || "participant",
        team_name: team_name || null,
      }).select("id").single();

      if (error) return json({ error: error.message }, 400);

      await supabase.from("event_updates").insert({
        event_id: eventId,
        api_key_id: apiKeyId,
        update_type: "result",
        payload: { score_id: data.id, college_name, points, position },
      });

      return json({ success: true, score_id: data.id, message: "Score submitted successfully" });
    }

    // ── GET /registrations ──
    if (endpoint === "registrations" && req.method === "GET") {
      let query = supabase
        .from("registrations")
        .select("id, team_name, leader_name, leader_email, leader_phone, college_name, semester, members, registration_status, source, created_at")
        .eq("event_id", eventId);

      const status = url.searchParams.get("status");
      const college = url.searchParams.get("college");
      if (status) query = query.eq("registration_status", status);
      if (college) query = query.ilike("college_name", `%${college}%`);

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true, registrations: data, count: data?.length || 0 });
    }

    // ── POST /update ──
    if (endpoint === "update" && req.method === "POST") {
      const body = await req.json();
      const { update_type, payload } = body;
      if (!update_type) return json({ error: "Missing update_type" }, 400);
      const validTypes = ["announcement", "result", "schedule_change"];
      if (!validTypes.includes(update_type)) {
        return json({ error: `Invalid update_type. Must be one of: ${validTypes.join(", ")}` }, 400);
      }

      const { data, error } = await supabase.from("event_updates").insert({
        event_id: eventId,
        api_key_id: apiKeyId,
        update_type,
        payload: payload || {},
      }).select("id").single();

      if (error) return json({ error: error.message }, 400);
      return json({ success: true, update_id: data.id, message: "Update recorded" });
    }

    // ── GET /colleges ──
    if (endpoint === "colleges" && req.method === "GET") {
      const { data, error } = await supabase
        .from("colleges")
        .select("id, name, short_name, city, state, logo_url")
        .eq("is_active", true)
        .order("name");
      if (error) return json({ error: error.message }, 400);
      return json({ success: true, colleges: data });
    }

    // ── GET /leaderboard ──
    if (endpoint === "leaderboard" && req.method === "GET") {
      let query = supabase.from("college_scores").select("college_name, event_name, category, points, position, team_name");
      const category = url.searchParams.get("category");
      if (category) query = query.eq("category", category);

      const { data, error } = await query;
      if (error) return json({ error: error.message }, 400);

      // Aggregate by college
      const collegeMap = new Map<string, { total: number; events: number; categories: Set<string> }>();
      (data || []).forEach((row) => {
        const entry = collegeMap.get(row.college_name) || { total: 0, events: 0, categories: new Set<string>() };
        entry.total += row.points;
        entry.events++;
        entry.categories.add(row.category);
        collegeMap.set(row.college_name, entry);
      });

      const leaderboard = Array.from(collegeMap.entries())
        .map(([name, stats]) => ({
          college_name: name,
          total_points: stats.total,
          events_participated: stats.events,
          categories: Array.from(stats.categories),
        }))
        .sort((a, b) => b.total_points - a.total_points);

      return json({ success: true, leaderboard, raw_scores: data });
    }

    return json({ error: `Unknown endpoint: ${endpoint}` }, 404);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Internal server error" }, 500);
  }
});
