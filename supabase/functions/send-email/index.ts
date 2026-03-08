const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailPayload {
  type: "registration_received" | "registration_confirmed" | "registration_rejected";
  to: string;
  leader_name: string;
  team_name?: string;
  registration_id: string;
  event_name: string;
  event_date?: string;
  event_time?: string;
  event_venue?: string;
  rejection_reason?: string;
}

function buildHtml(payload: EmailPayload): string {
  const { type, leader_name, team_name, registration_id, event_name, event_date, event_time, event_venue, rejection_reason } = payload;
  const displayName = team_name || leader_name;

  const header = `
    <div style="background: linear-gradient(135deg, #0ea5e9, #8b5cf6); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">⚡ Tech Carnival – 2K26</h1>
    </div>`;

  const footer = `
    <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #1e293b;">
      <p style="margin: 0;">Tech Carnival – 2K26 | XYZ College of Engineering</p>
      <p style="margin: 4px 0 0;">techcarnival@college.edu | +91 98765 43210</p>
    </div>`;

  let body = "";

  if (type === "registration_received") {
    body = `
      <div style="padding: 32px 24px;">
        <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 16px;">Registration Received! 📋</h2>
        <p style="color: #cbd5e1; line-height: 1.6; margin: 0 0 16px;">
          Hi <strong style="color: #f1f5f9;">${leader_name}</strong>,
        </p>
        <p style="color: #cbd5e1; line-height: 1.6; margin: 0 0 24px;">
          Your registration for <strong style="color: #0ea5e9;">${event_name}</strong> has been received successfully!
        </p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Registration Details</p>
          <p style="color: #f1f5f9; margin: 4px 0;"><strong>Event:</strong> ${event_name}</p>
          <p style="color: #f1f5f9; margin: 4px 0;"><strong>Team/Name:</strong> ${displayName}</p>
          <p style="color: #f1f5f9; margin: 4px 0;"><strong>Registration ID:</strong> <code style="background: #334155; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${registration_id}</code></p>
        </div>
        <div style="background: #1e3a5f; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 0 8px 8px 0; margin: 0 0 24px;">
          <p style="color: #7dd3fc; margin: 0; font-size: 14px;">
            ⏳ Your registration is under review. You'll receive a confirmation email soon.
          </p>
        </div>
      </div>`;
  } else if (type === "registration_confirmed") {
    body = `
      <div style="padding: 32px 24px;">
        <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 16px;">Registration Confirmed! 🎉</h2>
        <p style="color: #cbd5e1; line-height: 1.6; margin: 0 0 16px;">
          Hi <strong style="color: #f1f5f9;">${leader_name}</strong>,
        </p>
        <p style="color: #cbd5e1; line-height: 1.6; margin: 0 0 24px;">
          Great news! Your registration for <strong style="color: #22c55e;">${event_name}</strong> has been <strong style="color: #22c55e;">confirmed</strong>!
        </p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Event Details</p>
          <p style="color: #f1f5f9; margin: 4px 0;"><strong>Event:</strong> ${event_name}</p>
          ${event_date ? `<p style="color: #f1f5f9; margin: 4px 0;"><strong>Date:</strong> ${event_date}</p>` : ""}
          ${event_time ? `<p style="color: #f1f5f9; margin: 4px 0;"><strong>Time:</strong> ${event_time}</p>` : ""}
          ${event_venue ? `<p style="color: #f1f5f9; margin: 4px 0;"><strong>Venue:</strong> ${event_venue}</p>` : ""}
          <p style="color: #f1f5f9; margin: 4px 0;"><strong>Team/Name:</strong> ${displayName}</p>
          <p style="color: #f1f5f9; margin: 4px 0;"><strong>Reg ID:</strong> <code style="background: #334155; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${registration_id}</code></p>
        </div>
        <div style="background: #14532d; border-left: 4px solid #22c55e; padding: 16px; border-radius: 0 8px 8px 0; margin: 0 0 24px;">
          <p style="color: #86efac; margin: 0 0 8px; font-size: 14px; font-weight: bold;">📋 What to bring:</p>
          <ul style="color: #86efac; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li>Valid College ID</li>
            <li>Laptop & charger (for coding/hackathon events)</li>
            <li>Your enthusiasm! 🚀</li>
          </ul>
        </div>
      </div>`;
  } else if (type === "registration_rejected") {
    body = `
      <div style="padding: 32px 24px;">
        <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 16px;">Registration Update</h2>
        <p style="color: #cbd5e1; line-height: 1.6; margin: 0 0 16px;">
          Hi <strong style="color: #f1f5f9;">${leader_name}</strong>,
        </p>
        <p style="color: #cbd5e1; line-height: 1.6; margin: 0 0 24px;">
          We're sorry, but your registration for <strong style="color: #ef4444;">${event_name}</strong> could not be confirmed at this time.
        </p>
        ${rejection_reason ? `
        <div style="background: #451a1a; border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0; margin: 0 0 24px;">
          <p style="color: #fca5a5; margin: 0; font-size: 14px;"><strong>Reason:</strong> ${rejection_reason}</p>
        </div>` : ""}
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
          <p style="color: #94a3b8; margin: 0 0 8px; font-size: 14px;">You can try re-registering or contact us for more information.</p>
          <p style="color: #f1f5f9; margin: 4px 0;"><strong>Reg ID:</strong> <code style="background: #334155; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${registration_id}</code></p>
        </div>
      </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin: 0; padding: 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        ${header}${body}${footer}
      </div>
    </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: EmailPayload = await req.json();
    const { type, to } = payload;

    const subjects: Record<string, string> = {
      registration_received: "Registration Received – Tech Carnival 2K26",
      registration_confirmed: "Registration Confirmed – Tech Carnival 2K26 🎉",
      registration_rejected: "Registration Update – Tech Carnival 2K26",
    };

    const html = buildHtml(payload);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tech Carnival <noreply@techcarnival.online>",
        to: [to],
        subject: subjects[type] || "Tech Carnival – 2K26",
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Email send failed", details: result }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
