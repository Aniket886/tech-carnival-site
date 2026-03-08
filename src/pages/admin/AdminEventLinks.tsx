import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface EventLink {
  id: string;
  name: string;
  icon: string | null;
  category: string;
  apiKey?: {
    event_website_url: string | null;
    is_active: boolean;
    last_used_at: string | null;
  };
  mainRegs: number;
  siteRegs: number;
}

const AdminEventLinks = () => {
  const [links, setLinks] = useState<EventLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: events }, { data: keys }, { data: regs }] = await Promise.all([
        supabase.from("events").select("id, name, icon, category"),
        supabase.from("api_keys").select("event_id, event_website_url, is_active, last_used_at"),
        supabase.from("registrations").select("event_id, source"),
      ]);
      if (events) {
        const keyMap = new Map(keys?.map((k) => [k.event_id, k]) || []);
        setLinks(events.map((e) => ({
          ...e,
          apiKey: keyMap.get(e.id) || undefined,
          mainRegs: regs?.filter((r) => r.event_id === e.id && r.source === "main").length || 0,
          siteRegs: regs?.filter((r) => r.event_id === e.id && r.source === "event_site").length || 0,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Event Websites</h2>
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
          🌐 Main Website: <a href="https://techcarnival.online/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">https://techcarnival.online/</a>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {links.map((l) => {
          const connected = l.apiKey?.is_active && l.apiKey?.event_website_url;
          return (
            <Card key={l.id} className="bg-card/50 border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{l.icon} {l.name}</p>
                  <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                </div>
                {l.apiKey?.event_website_url ? (
                  <a href={l.apiKey.event_website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    {l.apiKey.event_website_url} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">No website configured</p>
                )}
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px]">Main: {l.mainRegs}</Badge>
                  <Badge variant="outline" className="text-[10px]">Site: {l.siteRegs}</Badge>
                </div>
                {l.apiKey?.last_used_at && (
                  <p className="text-[10px] text-muted-foreground">Last sync: {new Date(l.apiKey.last_used_at).toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminEventLinks;
