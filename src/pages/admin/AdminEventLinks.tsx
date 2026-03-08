import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ExternalLink, Pencil, Link2, Link2Off, Copy, Check } from "lucide-react";

interface EventLink {
  id: string;
  name: string;
  slug: string;
  category: string;
  website_url: string | null;
  is_active: boolean;
}

const AdminEventLinks = () => {
  const [events, setEvents] = useState<EventLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEvent, setEditEvent] = useState<EventLink | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("id, name, slug, category, website_url, is_active")
      .order("category")
      .order("name");
    if (error) {
      toast.error("Failed to load events");
      return;
    }
    setEvents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const openEdit = (ev: EventLink) => {
    setEditEvent(ev);
    setEditUrl(ev.website_url || "");
  };

  const handleSave = async () => {
    if (!editEvent) return;
    setSaving(true);
    const url = editUrl.trim() || null;
    const { error } = await supabase
      .from("events")
      .update({ website_url: url })
      .eq("id", editEvent.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update link");
      return;
    }
    toast.success(`Link updated for ${editEvent.name}`);
    setEditEvent(null);
    fetchEvents();
  };

  const clearLink = async (ev: EventLink) => {
    const { error } = await supabase
      .from("events")
      .update({ website_url: null })
      .eq("id", ev.id);
    if (error) {
      toast.error("Failed to remove link");
      return;
    }
    toast.success(`Link removed for ${ev.name}`);
    fetchEvents();
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const linked = events.filter(e => e.website_url);
  const unlinked = events.filter(e => !e.website_url);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Event Links</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage external website URLs for each event
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            <Link2 size={14} /> {linked.length} linked
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Link2Off size={14} /> {unlinked.length} unlinked
          </Badge>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading events…</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Event</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Website URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(ev => (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium text-foreground">{ev.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">{ev.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    {ev.website_url ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground truncate">
                          {ev.website_url}
                        </span>
                        <button
                          onClick={() => copyUrl(ev.id, ev.website_url!)}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          {copiedId === ev.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground/50 italic">No link set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ev.website_url ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Linked</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Unlinked</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ev)}>
                        <Pencil size={15} />
                      </Button>
                      {ev.website_url && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={ev.website_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={15} />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => clearLink(ev)}>
                            <Link2Off size={15} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No events found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editEvent} onOpenChange={open => !open && setEditEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Link — {editEvent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium text-foreground">Website URL</label>
            <Input
              placeholder="https://event-website.com"
              value={editUrl}
              onChange={e => setEditUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to remove the link. Use full URL including https://
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEvent(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventLinks;
