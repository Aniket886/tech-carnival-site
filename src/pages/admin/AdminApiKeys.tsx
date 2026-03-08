import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

interface ApiKeyRow {
  id: string;
  api_key: string;
  event_website_url: string | null;
  is_active: boolean;
  last_used_at: string | null;
  event_id: string;
  events?: { name: string; icon: string | null } | null;
}

interface UpdateLog {
  id: string;
  update_type: string;
  sync_status: string;
  created_at: string;
}

const AdminApiKeys = () => {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [editingUrl, setEditingUrl] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    supabase.from("api_keys").select("*, events(name, icon)").order("created_at").then(({ data }) => {
      if (data) setKeys(data as unknown as ApiKeyRow[]);
      setLoading(false);
    });
  }, []);

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "API key copied!" });
  };

  const regenerateKey = async (id: string) => {
    const newKey = crypto.randomUUID() + "-" + crypto.randomUUID().slice(0, 8);
    const { error } = await supabase.from("api_keys").update({ api_key: newKey }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, api_key: newKey } : k)));
      toast({ title: "API key regenerated" });
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("api_keys").update({ is_active: !current }).eq("id", id);
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: !current } : k)));
  };

  const saveUrl = async () => {
    if (!editingUrl) return;
    await supabase.from("api_keys").update({ event_website_url: editingUrl.url }).eq("id", editingUrl.id);
    setKeys((prev) => prev.map((k) => (k.id === editingUrl.id ? { ...k, event_website_url: editingUrl.url } : k)));
    setEditingUrl(null);
    toast({ title: "URL updated" });
  };

  const loadLogs = async (apiKeyId: string) => {
    if (expandedId === apiKeyId) { setExpandedId(null); return; }
    setExpandedId(apiKeyId);
    const keyRow = keys.find((k) => k.id === apiKeyId);
    if (!keyRow) return;
    const { data } = await supabase.from("event_updates").select("id, update_type, sync_status, created_at").eq("api_key_id", apiKeyId).order("created_at", { ascending: false }).limit(10);
    setLogs(data || []);
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">API Key Management</h2>
      <div className="space-y-4">
        {keys.map((k) => (
          <div key={k.id} className="rounded-lg border border-border bg-card/30 overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{k.events?.icon} {k.events?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted/30 px-2 py-0.5 rounded font-mono text-muted-foreground">
                    {revealed.has(k.id) ? k.api_key : "••••••••••••••••••••••••"}
                  </code>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggleReveal(k.id)}>
                    {revealed.has(k.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyKey(k.api_key)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {editingUrl?.id === k.id ? (
                  <div className="flex gap-2 mt-2">
                    <Input value={editingUrl.url} onChange={(e) => setEditingUrl({ ...editingUrl, url: e.target.value })} className="text-xs h-8" placeholder="https://..." />
                    <Button size="sm" className="h-8" onClick={saveUrl}>Save</Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingUrl(null)}>Cancel</Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 cursor-pointer hover:text-foreground" onClick={() => setEditingUrl({ id: k.id, url: k.event_website_url || "" })}>
                    🔗 {k.event_website_url || "No URL set"} <span className="text-primary">(edit)</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={k.is_active ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}>
                  {k.is_active ? "Active" : "Inactive"}
                </Badge>
                <Switch checked={k.is_active} onCheckedChange={() => toggleActive(k.id, k.is_active)} />
                <Button size="sm" variant="outline" className="gap-1" onClick={() => regenerateKey(k.id)}>
                  <RefreshCw className="h-3 w-3" /> Regen
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => loadLogs(k.id)}>
                  {expandedId === k.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {k.last_used_at && (
              <p className="px-4 pb-2 text-xs text-muted-foreground">Last used: {new Date(k.last_used_at).toLocaleString()}</p>
            )}
            {expandedId === k.id && (
              <div className="border-t border-border bg-muted/5 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Recent API Usage</p>
                {logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No API calls recorded yet.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead><tr className="text-muted-foreground"><th className="text-left py-1">Type</th><th className="text-left py-1">Status</th><th className="text-left py-1">Time</th></tr></thead>
                    <tbody>
                      {logs.map((l) => (
                        <tr key={l.id} className="border-t border-border/30">
                          <td className="py-1.5 text-foreground">{l.update_type}</td>
                          <td className="py-1.5"><Badge variant="outline" className="text-[10px]">{l.sync_status}</Badge></td>
                          <td className="py-1.5 text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApiKeys;
