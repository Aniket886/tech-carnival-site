import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, MailOpen, Mail, Phone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsOwner } from "@/hooks/useIsOwner";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

const AdminMessages = () => {
  const [messages, setMessages] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetch_ = async () => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load messages");
    else setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, 10_000);
    return () => clearInterval(interval);
  }, []);

  const toggleRead = async (m: Contact) => {
    const { error } = await supabase.from("contacts").update({ is_read: !m.is_read }).eq("id", m.id);
    if (error) toast.error("Failed to update");
    else {
      setMessages(prev => prev.map(x => x.id === m.id ? { ...x, is_read: !x.is_read } : x));
      toast.success(m.is_read ? "Marked as unread" : "Marked as read");
    }
  };

  const deleteOne = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { setMessages(prev => prev.filter(x => x.id !== id)); toast.success("Message deleted"); }
  };

  const deleteAll = async () => {
    const ids = messages.map(m => m.id);
    if (!ids.length) return;
    const { error } = await supabase.from("contacts").delete().in("id", ids);
    if (error) toast.error("Failed to delete all");
    else { setMessages([]); toast.success("All messages deleted"); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter(m =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.message.toLowerCase().includes(q)
    );
  }, [messages, search]);

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) return <p className="text-muted-foreground">Loading messages…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground">
          Contact Messages ({messages.length})
          {unreadCount > 0 && <span className="text-sm font-normal text-muted-foreground ml-2">· {unreadCount} unread</span>}
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48 bg-muted/50" />
          </div>
          {messages.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 size={14} className="mr-1.5" /> Delete All ({messages.length})</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all messages?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete all {messages.length} contact messages.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {search ? "No messages match your search." : "No contact messages yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <div key={m.id} className={`rounded-xl border p-4 sm:p-5 transition-colors ${m.is_read ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.email}</span>
                    {m.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone size={10} /> {m.phone}
                      </span>
                    )}
                    <Badge variant={m.is_read ? "secondary" : "default"} className="text-[10px] px-1.5 py-0">
                      {m.is_read ? "Read" : "New"}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/80">{m.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "numeric", day: "numeric" })},{" "}
                    {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => toggleRead(m)} title={m.is_read ? "Mark unread" : "Mark read"}>
                    {m.is_read ? <Mail size={16} /> : <MailOpen size={16} />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete message?</AlertDialogTitle>
                        <AlertDialogDescription>Delete message from {m.name}?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteOne(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
