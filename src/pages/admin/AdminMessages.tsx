import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, MailOpen, Trash2 } from "lucide-react";

interface Msg {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminMessages = () => {
  const { toast } = useToast();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("contacts").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setMsgs(data);
      setLoading(false);
    });
  }, []);

  const toggleRead = async (id: string, current: boolean) => {
    await supabase.from("contacts").update({ is_read: !current }).eq("id", id);
    setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: !current } : m)));
  };

  const deleteMsg = async (id: string) => {
    await supabase.from("contacts").delete().eq("id", id);
    setMsgs((prev) => prev.filter((m) => m.id !== id));
    toast({ title: "Message deleted" });
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  const unread = msgs.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-foreground">Messages</h2>
        {unread > 0 && <Badge className="bg-primary/20 text-primary">{unread} unread</Badge>}
      </div>
      <div className="space-y-3">
        {msgs.map((m) => (
          <div key={m.id} className={`rounded-lg border p-4 transition-colors ${m.is_read ? "border-border bg-card/30" : "border-primary/30 bg-primary/5"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">{m.name}</p>
                  {!m.is_read && <Badge className="bg-primary/20 text-primary text-[10px]">New</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{m.email} · {new Date(m.created_at).toLocaleString()}</p>
                <p className="text-sm text-foreground/80">{m.message}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleRead(m.id, m.is_read)}>
                  {m.is_read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5 text-primary" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMsg(m.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {msgs.length === 0 && <p className="text-center py-8 text-muted-foreground">No messages yet</p>}
      </div>
    </div>
  );
};

export default AdminMessages;
