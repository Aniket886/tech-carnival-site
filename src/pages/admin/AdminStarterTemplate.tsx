import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileCode, Copy } from "lucide-react";
import { toast } from "sonner";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/event-api`;

const getApiServiceCode = (base: string) => `// apiService.ts — Pre-configured API client for Tech Carnival 2K26
const API_BASE = import.meta.env.VITE_API_BASE || "${base}";
const API_KEY = import.meta.env.VITE_API_KEY;

const headers = () => ({
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
});

export const api = {
  async getEvent() {
    const res = await fetch(API_BASE + "/v1/event", { headers: headers() });
    return res.json();
  },

  async register(data) {
    const res = await fetch(API_BASE + "/v1/register", {
      method: "POST", headers: headers(), body: JSON.stringify(data),
    });
    return res.json();
  },

  async pushScore(data) {
    const res = await fetch(API_BASE + "/v1/scores", {
      method: "POST", headers: headers(), body: JSON.stringify(data),
    });
    return res.json();
  },

  async getRegistrations(params) {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetch(API_BASE + "/v1/registrations?" + query, { headers: headers() });
    return res.json();
  },

  async getColleges() {
    const res = await fetch(API_BASE + "/v1/colleges", { headers: headers() });
    return res.json();
  },

  async getLeaderboard(category) {
    const query = category ? "?category=" + category : "";
    const res = await fetch(API_BASE + "/v1/leaderboard" + query, { headers: headers() });
    return res.json();
  },

  async pushUpdate(update_type, payload) {
    const res = await fetch(API_BASE + "/v1/update", {
      method: "POST", headers: headers(), body: JSON.stringify({ update_type, payload }),
    });
    return res.json();
  },
};
`;

const getEnvExample = (base: string) => `# .env — Tech Carnival 2K26 Event Website Config
VITE_API_BASE=${base}
VITE_API_KEY=your_api_key_here
`;

const AdminStarterTemplate = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const apiServiceCode = getApiServiceCode(API_BASE);
  const envExample = getEnvExample(API_BASE);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(label + " copied");
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadTemplate = () => {
    const content = [
      "// ========== apiService.ts ==========",
      apiServiceCode,
      "",
      "// ========== .env.example ==========",
      envExample,
      "",
      "// ========== README.md ==========",
      "# Event Website Starter",
      "",
      "Pre-configured to connect to Tech Carnival 2K26 main site.",
      "",
      "## Setup",
      "1. Copy .env.example to .env",
      "2. Replace your_api_key_here with your event API key",
      "3. Import apiService.ts in your components",
      "",
      "## API Base URL",
      API_BASE,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "event-website-starter.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Starter template downloaded");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileCode size={20} className="text-primary" />
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Event Website Starter</h2>
            <p className="text-xs text-muted-foreground">Download a pre-configured API client for event websites</p>
          </div>
        </div>
        <Button size="sm" onClick={downloadTemplate}>
          <Download size={14} className="mr-1.5" /> Download Template
        </Button>
      </div>

      <div className="glass rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground font-mono">apiService.ts</h3>
          <Button variant="ghost" size="sm" onClick={() => copy(apiServiceCode, "apiService.ts")}>
            <Copy size={12} className="mr-1" /> {copied === "apiService.ts" ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="bg-muted/30 rounded-lg p-4 text-xs font-mono text-muted-foreground overflow-x-auto max-h-96 whitespace-pre-wrap">{apiServiceCode}</pre>
      </div>

      <div className="glass rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground font-mono">.env.example</h3>
          <Button variant="ghost" size="sm" onClick={() => copy(envExample, ".env.example")}>
            <Copy size={12} className="mr-1" /> {copied === ".env.example" ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="bg-muted/30 rounded-lg p-4 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">{envExample}</pre>
      </div>
    </div>
  );
};

export default AdminStarterTemplate;
