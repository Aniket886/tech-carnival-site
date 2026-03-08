import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Play, ChevronDown, ChevronUp } from "lucide-react";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api/v1`;

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  body?: Record<string, string>;
  queryParams?: string[];
  response: string;
}

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/register",
    title: "Submit Registration",
    description: "Submit a new registration from an event website.",
    body: {
      team_name: "Team Alpha",
      leader_name: "John Doe",
      leader_email: "john@example.com",
      leader_phone: "9876543210",
      college_name: "Tech University",
      semester: "6th",
      members: '["Jane Doe", "Bob Smith"]',
    },
    response: '{ "success": true, "registration_id": "uuid", "message": "Registration submitted successfully" }',
  },
  {
    method: "GET",
    path: "/event",
    title: "Get Event Details",
    description: "Fetch details for the event linked to this API key.",
    response: '{ "success": true, "event": { "name": "...", "description": "...", "date": "...", ... } }',
  },
  {
    method: "POST",
    path: "/scores",
    title: "Push Scores",
    description: "Submit scores/results from an event website. Triggers real-time leaderboard update.",
    body: {
      college_name: "Tech University",
      points: "100",
      position: "1st",
      team_name: "Team Alpha",
    },
    response: '{ "success": true, "score_id": "uuid", "message": "Score submitted successfully" }',
  },
  {
    method: "GET",
    path: "/registrations",
    title: "Get Registrations",
    description: "Fetch all registrations for the linked event.",
    queryParams: ["status=confirmed", "college=GMU"],
    response: '{ "success": true, "registrations": [...], "count": 42 }',
  },
  {
    method: "POST",
    path: "/update",
    title: "Push Update",
    description: "Push announcements, results, or schedule changes.",
    body: {
      update_type: "announcement",
      payload: '{"title": "Results out!", "message": "Check the leaderboard"}',
    },
    response: '{ "success": true, "update_id": "uuid", "message": "Update recorded" }',
  },
  {
    method: "GET",
    path: "/colleges",
    title: "Get Colleges",
    description: "Fetch all active participating colleges.",
    response: '{ "success": true, "colleges": [{ "id": "...", "name": "...", ... }] }',
  },
  {
    method: "GET",
    path: "/leaderboard",
    title: "Get Leaderboard",
    description: "Fetch live leaderboard data with aggregated scores.",
    queryParams: ["category=technical"],
    response: '{ "success": true, "leaderboard": [{ "college_name": "...", "total_points": 500, ... }], "raw_scores": [...] }',
  },
];

const AdminApiDocs = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [tryResults, setTryResults] = useState<Record<number, { status: number; body: string } | null>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const tryEndpoint = async (idx: number, ep: Endpoint) => {
    if (!apiKey) { toast({ title: "Enter an API key first", variant: "destructive" }); return; }
    setLoading((p) => ({ ...p, [idx]: true }));

    try {
      const url = `${BASE_URL}${ep.path}`;
      const opts: RequestInit = {
        method: ep.method,
        headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      };
      if (ep.method === "POST" && ep.body) {
        const parsed: Record<string, unknown> = {};
        Object.entries(ep.body).forEach(([k, v]) => {
          try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
        });
        opts.body = JSON.stringify(parsed);
      }
      const res = await fetch(url, opts);
      const body = await res.text();
      setTryResults((p) => ({ ...p, [idx]: { status: res.status, body } }));
    } catch (e) {
      setTryResults((p) => ({ ...p, [idx]: { status: 0, body: (e as Error).message } }));
    }
    setLoading((p) => ({ ...p, [idx]: false }));
  };

  const curlCommand = (ep: Endpoint) => {
    const url = `${BASE_URL}${ep.path}`;
    let cmd = `curl -X ${ep.method} "${url}" \\\n  -H "x-api-key: YOUR_API_KEY"`;
    if (ep.method === "POST" && ep.body) {
      const parsed: Record<string, unknown> = {};
      Object.entries(ep.body).forEach(([k, v]) => {
        try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
      });
      cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(parsed, null, 2)}'`;
    }
    return cmd;
  };

  const reactSnippet = (ep: Endpoint) => {
    const url = `\${BASE_URL}${ep.path}`;
    if (ep.method === "GET") {
      return `const response = await fetch(\`${url}\`, {
  headers: { "x-api-key": API_KEY },
});
const data = await response.json();`;
    }
    const parsed: Record<string, unknown> = {};
    if (ep.body) Object.entries(ep.body).forEach(([k, v]) => {
      try { parsed[k] = JSON.parse(v); } catch { parsed[k] = v; }
    });
    return `const response = await fetch(\`${url}\`, {
  method: "POST",
  headers: {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${JSON.stringify(parsed, null, 4)}),
});
const data = await response.json();`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">API Documentation</h2>

      <div className="rounded-lg border border-border bg-card/30 p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Base URL: <code className="bg-muted/30 px-2 py-0.5 rounded text-xs text-foreground font-mono">{BASE_URL}</code>
        </p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Paste your API key to test endpoints..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="max-w-md font-mono text-xs"
          />
          <Button size="sm" variant="outline" className="gap-1" onClick={() => copyText(BASE_URL)}>
            <Copy className="h-3 w-3" /> Copy URL
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Rate limit: 100 requests/minute per API key. All endpoints require <code className="text-foreground">x-api-key</code> header.</p>
      </div>

      <div className="space-y-3">
        {endpoints.map((ep, idx) => {
          const isExpanded = expandedIdx === idx;
          const result = tryResults[idx];

          return (
            <div key={idx} className="rounded-lg border border-border bg-card/30 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/10 transition-colors"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              >
                <Badge
                  variant="outline"
                  className={`font-mono text-[10px] ${
                    ep.method === "GET"
                      ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                      : "bg-green-500/15 text-green-400 border-green-500/30"
                  }`}
                >
                  {ep.method}
                </Badge>
                <code className="text-sm font-mono text-foreground">/v1{ep.path}</code>
                <span className="text-sm text-muted-foreground flex-1">{ep.title}</span>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border/50 p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">{ep.description}</p>

                  {ep.body && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Request Body:</p>
                      <pre className="bg-muted/10 rounded p-3 text-xs font-mono text-foreground overflow-x-auto">
                        {JSON.stringify(
                          Object.fromEntries(
                            Object.entries(ep.body).map(([k, v]) => {
                              try { return [k, JSON.parse(v)]; } catch { return [k, v]; }
                            })
                          ),
                          null, 2
                        )}
                      </pre>
                    </div>
                  )}

                  {ep.queryParams && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Query Parameters:</p>
                      <div className="flex gap-2">
                        {ep.queryParams.map((q) => (
                          <code key={q} className="bg-muted/20 px-2 py-0.5 rounded text-[10px] text-muted-foreground">?{q}</code>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Response:</p>
                    <pre className="bg-muted/10 rounded p-3 text-xs font-mono text-foreground overflow-x-auto">{ep.response}</pre>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">cURL:</p>
                    <div className="relative">
                      <pre className="bg-muted/10 rounded p-3 text-xs font-mono text-foreground overflow-x-auto">{curlCommand(ep)}</pre>
                      <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6" onClick={() => copyText(curlCommand(ep))}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">React / JavaScript:</p>
                    <div className="relative">
                      <pre className="bg-muted/10 rounded p-3 text-xs font-mono text-foreground overflow-x-auto">{reactSnippet(ep)}</pre>
                      <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6" onClick={() => copyText(reactSnippet(ep))}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => tryEndpoint(idx, ep)}
                      disabled={loading[idx]}
                    >
                      <Play className="h-3 w-3" /> {loading[idx] ? "Running..." : "Try It"}
                    </Button>
                  </div>

                  {result && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-muted-foreground">Response:</p>
                        <Badge variant="outline" className={`text-[10px] ${result.status >= 200 && result.status < 300 ? "text-green-400" : "text-red-400"}`}>
                          {result.status || "Error"}
                        </Badge>
                      </div>
                      <pre className="bg-muted/10 rounded p-3 text-xs font-mono text-foreground overflow-x-auto max-h-48">
                        {(() => { try { return JSON.stringify(JSON.parse(result.body), null, 2); } catch { return result.body; } })()}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Starter Template Section */}
      <div className="rounded-lg border border-border bg-card/30 p-4 space-y-3">
        <h3 className="font-semibold text-foreground">📦 Event Website Starter Template</h3>
        <p className="text-sm text-muted-foreground">
          Use this <code className="text-foreground">apiService.ts</code> in your event website:
        </p>
        <div className="relative">
          <pre className="bg-muted/10 rounded p-3 text-xs font-mono text-foreground overflow-x-auto max-h-96">{`// apiService.ts — Drop into your event website project
const BASE_URL = import.meta.env.VITE_MAIN_SITE_API || "${BASE_URL}";
const API_KEY = import.meta.env.VITE_API_KEY;

const headers = () => ({
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
});

export const api = {
  async getEvent() {
    const res = await fetch(\`\${BASE_URL}/event\`, { headers: headers() });
    return res.json();
  },

  async register(data: {
    team_name?: string;
    leader_name: string;
    leader_email: string;
    leader_phone: string;
    college_name: string;
    semester?: string;
    members?: string[];
  }) {
    const res = await fetch(\`\${BASE_URL}/register\`, {
      method: "POST", headers: headers(), body: JSON.stringify(data),
    });
    return res.json();
  },

  async pushScore(data: {
    college_name: string;
    points: number;
    position?: string;
    team_name?: string;
  }) {
    const res = await fetch(\`\${BASE_URL}/scores\`, {
      method: "POST", headers: headers(), body: JSON.stringify(data),
    });
    return res.json();
  },

  async getRegistrations(status?: string, college?: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (college) params.set("college", college);
    const res = await fetch(\`\${BASE_URL}/registrations?\${params}\`, { headers: headers() });
    return res.json();
  },

  async pushUpdate(update_type: string, payload: object) {
    const res = await fetch(\`\${BASE_URL}/update\`, {
      method: "POST", headers: headers(),
      body: JSON.stringify({ update_type, payload }),
    });
    return res.json();
  },

  async getColleges() {
    const res = await fetch(\`\${BASE_URL}/colleges\`, { headers: headers() });
    return res.json();
  },

  async getLeaderboard(category?: string) {
    const params = category ? \`?category=\${category}\` : "";
    const res = await fetch(\`\${BASE_URL}/leaderboard\${params}\`, { headers: headers() });
    return res.json();
  },
};

// .env.example:
// VITE_API_KEY=your-api-key-here
// VITE_MAIN_SITE_API=${BASE_URL}`}</pre>
          <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6" onClick={() => copyText("See console for full template")}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminApiDocs;
