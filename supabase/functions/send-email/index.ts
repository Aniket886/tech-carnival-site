const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailPayload {
  type: "registration_received" | "registration_confirmed" | "registration_rejected" | "custom";
  to: string;
  leader_name: string;
  team_name?: string;
  registration_id: string;
  event_name: string;
  event_date?: string;
  event_time?: string;
  event_venue?: string;
  rejection_reason?: string;
  custom_html?: string;
  custom_subject?: string;
}

function buildHtml(payload: EmailPayload): string {
  const { type, leader_name, team_name, registration_id, event_name, event_date, event_time, event_venue, rejection_reason } = payload;
  const displayName = team_name || leader_name;

  const header = `
    <div style="position: relative; background: #0a0e1a; padding: 48px 24px 40px; text-align: center; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse 70% 60% at 50% 20%, rgba(14,165,233,0.15) 0%, transparent 70%);"></div>
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse 50% 70% at 75% 80%, rgba(168,85,247,0.12) 0%, transparent 70%);"></div>
      <div style="position: relative; z-index: 1;">
        <p style="margin: 0 0 4px; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #38bdf8; font-family: 'Segoe UI', Arial, sans-serif;">📅 MARCH 27-28, 2026</p>
        <h1 style="font-size: 36px; margin: 8px 0 0; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 900; letter-spacing: 1px; line-height: 1.1; background: linear-gradient(135deg, #38bdf8, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Tech Carnival</h1>
        <p style="font-size: 28px; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 700; color: rgba(248,250,252,0.9); letter-spacing: 6px;">2K26</p>
        <div style="margin: 12px auto 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span style="display: inline-block; width: 40px; height: 1px; background: rgba(56,189,248,0.4);"></span>
          <span style="font-size: 11px; color: #94a3b8; letter-spacing: 1px;">Innovation Meets Celebration</span>
          <span style="display: inline-block; width: 40px; height: 1px; background: rgba(56,189,248,0.4);"></span>
        </div>
      </div>
    </div>`;

  const footer = `
    <div style="padding: 20px 24px; text-align: center; border-top: 1px solid #1e293b;">
      <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.6;">Tech Carnival – 2K26 | GM University, Davangere</p>
      <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">
        <a href="mailto:support@techcarnival.online" style="color: #38bdf8; text-decoration: none;">support@techcarnival.online</a> | +91 8073491988
      </p>
    </div>`;

  const detailsCard = (title: string, rows: string) => `
    <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">${title}</p>
      ${rows}
    </div>`;

  const detailRow = (label: string, value: string) =>
    `<p style="color: #e2e8f0; margin: 6px 0; font-size: 14px;"><strong style="color: #f8fafc;">${label}:</strong> ${value}</p>`;

  const regIdTag = `<code style="background: #334155; padding: 3px 10px; border-radius: 6px; font-size: 12px; color: #e2e8f0; font-family: 'SF Mono', 'Consolas', monospace;">${registration_id}</code>`;

  let body = "";

  if (type === "registration_received") {
    body = `
      <div style="padding: 32px 28px;">
        <h2 style="color: #f8fafc; font-size: 22px; margin: 0 0 20px; font-weight: 700;">Registration Received! 📋</h2>
        <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 12px; font-size: 15px;">
          Hi <strong style="color: #f8fafc;">${leader_name}</strong>,
        </p>
        <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 28px; font-size: 15px;">
          Your registration for <strong style="color: #38bdf8;">${event_name}</strong> has been received successfully!
        </p>
        ${detailsCard("Registration Details",
          detailRow("Event", event_name) +
          detailRow("Team/Name", displayName) +
          `<p style="color: #e2e8f0; margin: 6px 0; font-size: 14px;"><strong style="color: #f8fafc;">Reg ID:</strong> ${regIdTag}</p>`
        )}
        <div style="background: linear-gradient(135deg, #0c4a6e, #1e3a5f); border-left: 4px solid #0ea5e9; padding: 18px 20px; border-radius: 0 10px 10px 0;">
          <p style="color: #7dd3fc; margin: 0; font-size: 14px; line-height: 1.6;">
            ⏳ Your registration is under review. You'll receive a confirmation email once it's approved.
          </p>
        </div>
      </div>`;
  } else if (type === "registration_confirmed") {
    body = `
      <div style="padding: 32px 28px;">
        <h2 style="color: #f8fafc; font-size: 22px; margin: 0 0 20px; font-weight: 700;">Registration Confirmed! 🎉</h2>
        <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 12px; font-size: 15px;">
          Hi <strong style="color: #f8fafc;">${leader_name}</strong>,
        </p>
        <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 28px; font-size: 15px;">
          Great news! Your registration for <strong style="color: #4ade80;">${event_name}</strong> has been <strong style="color: #4ade80;">confirmed</strong>!
        </p>
        ${detailsCard("Event Details",
          detailRow("Event", event_name) +
          (event_date ? detailRow("Date", event_date) : "") +
          (event_time ? detailRow("Time", event_time) : "") +
          (event_venue ? detailRow("Venue", event_venue) : "") +
          detailRow("Team/Name", displayName) +
          `<p style="color: #e2e8f0; margin: 6px 0; font-size: 14px;"><strong style="color: #f8fafc;">Reg ID:</strong> ${regIdTag}</p>`
        )}
        <div style="background: linear-gradient(135deg, #14532d, #166534); border-left: 4px solid #4ade80; padding: 18px 20px; border-radius: 0 10px 10px 0;">
          <p style="color: #86efac; margin: 0 0 10px; font-size: 15px; font-weight: 700;">📋 What to bring:</p>
          <ul style="color: #bbf7d0; margin: 0; padding-left: 20px; font-size: 14px; line-height: 2;">
            <li>Valid College ID</li>
            <li>Laptop &amp; charger (for coding/hackathon events)</li>
            <li>Contact your specific event coordinator for more important details</li>
            <li>Your enthusiasm! 🚀</li>
          </ul>
        </div>
      </div>`;
  } else if (type === "registration_rejected") {
    body = `
      <div style="padding: 32px 28px;">
        <h2 style="color: #f8fafc; font-size: 22px; margin: 0 0 20px; font-weight: 700;">Registration Update ⚠️</h2>
        <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 12px; font-size: 15px;">
          Hi <strong style="color: #f8fafc;">${leader_name}</strong>,
        </p>
        <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 28px; font-size: 15px;">
          We're sorry, but your registration for <strong style="color: #f87171;">${event_name}</strong> could not be confirmed at this time.
        </p>
        ${rejection_reason ? `
        <div style="background: linear-gradient(135deg, #450a0a, #7f1d1d); border-left: 4px solid #f87171; padding: 18px 20px; border-radius: 0 10px 10px 0; margin: 0 0 24px;">
          <p style="color: #fca5a5; margin: 0; font-size: 14px; line-height: 1.6;"><strong>Reason:</strong> ${rejection_reason}</p>
        </div>` : ""}
        ${detailsCard("Details",
          `<p style="color: #94a3b8; margin: 0 0 8px; font-size: 14px; line-height: 1.6;">You can try re-registering or contact us for more information.</p>` +
          `<p style="color: #e2e8f0; margin: 6px 0; font-size: 14px;"><strong style="color: #f8fafc;">Reg ID:</strong> ${regIdTag}</p>`
        )}
      </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin: 0; padding: 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
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
