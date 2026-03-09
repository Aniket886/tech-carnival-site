import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, ImagePlus, User, Pencil } from "lucide-react";
import { useAdminRefresh } from "@/components/AdminLayout";
import { useIsOwner } from "@/hooks/useIsOwner";

type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  section: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
};

const AdminTeam = () => {
  const refreshKey = useAdminRefresh();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"organizing_committee" | "core_team">("organizing_committee");

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  // Image upload
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) {
      toast.error("Failed to load team members");
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, [refreshKey]);

  const filtered = members.filter(m => m.section === activeTab);

  const openAdd = () => {
    setEditingMember(null);
    setName("");
    setRole("");
    setShowDialog(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role || "");
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);

    if (editingMember) {
      const { error } = await supabase
        .from("team_members")
        .update({ name: name.trim(), role: role.trim() || null })
        .eq("id", editingMember.id);
      if (error) toast.error("Failed to update"); else toast.success("Updated");
    } else {
      const maxOrder = filtered.reduce((max, m) => Math.max(max, m.display_order), 0);
      const { error } = await supabase
        .from("team_members")
        .insert({ name: name.trim(), role: role.trim() || null, section: activeTab, display_order: maxOrder + 1 });
      if (error) toast.error("Failed to add"); else toast.success("Added");
    }
    setSaving(false);
    setShowDialog(false);
    fetchMembers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this team member?")) return;
    // Delete image from storage if exists
    const member = members.find(m => m.id === id);
    if (member?.image_url) {
      const path = member.image_url.split("/team-images/")[1];
      if (path) await supabase.storage.from("team-images").remove([path]);
    }
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) toast.error("Failed to delete"); else { toast.success("Removed"); fetchMembers(); }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = filtered.findIndex(m => m.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= filtered.length) return;

    const a = filtered[idx], b = filtered[swapIdx];
    await Promise.all([
      supabase.from("team_members").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("team_members").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    fetchMembers();
  };

  const handleImageUpload = async (memberId: string, file: File) => {
    setUploadingId(memberId);
    const ext = file.name.split(".").pop();
    const filePath = `${memberId}.${ext}`;

    // Remove old image
    const member = members.find(m => m.id === memberId);
    if (member?.image_url) {
      const oldPath = member.image_url.split("/team-images/")[1];
      if (oldPath) await supabase.storage.from("team-images").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage
      .from("team-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploadingId(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("team-images").getPublicUrl(filePath);
    const cacheBust = `?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("team_members")
      .update({ image_url: urlData.publicUrl + cacheBust })
      .eq("id", memberId);

    if (updateError) toast.error("Failed to save image URL");
    else toast.success("Image updated");

    setUploadingId(null);
    fetchMembers();
  };

  const handleRemoveImage = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member?.image_url) return;

    const path = member.image_url.split("/team-images/")[1];
    if (path) await supabase.storage.from("team-images").remove([path]);

    await supabase.from("team_members").update({ image_url: null }).eq("id", memberId);
    toast.success("Image removed");
    fetchMembers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "organizing_committee" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("organizing_committee")}
          >
            Organizing Committee
          </Button>
          <Button
            variant={activeTab === "core_team" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("core_team")}
          >
            Core Team
          </Button>
        </div>
        <Button size="sm" onClick={openAdd}><Plus size={16} className="mr-1" /> Add Member</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No members yet. Add one above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member, idx) => (
            <Card key={member.id} className="relative">
              <CardContent className="pt-5 flex flex-col items-center text-center gap-3">
                {/* Image */}
                <div className="relative w-24 h-24 rounded-full border-2 border-primary/30 bg-muted/60 flex items-center justify-center overflow-hidden group">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground/50" />
                  )}
                  <label className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <ImagePlus size={20} className="text-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingId === member.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(member.id, file);
                      }}
                    />
                  </label>
                </div>

                <div>
                  <p className="font-semibold text-foreground text-sm">{member.name}</p>
                  {member.role && <p className="text-xs text-muted-foreground">{member.role}</p>}
                </div>

                {uploadingId === member.id && (
                  <p className="text-xs text-muted-foreground animate-pulse">Uploading…</p>
                )}

                {/* Actions */}
                <div className="flex gap-1 flex-wrap justify-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(member)}>
                    <Pencil size={14} />
                  </Button>
                  {member.image_url && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveImage(member.id)}>
                      <ImagePlus size={14} />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={idx === 0} onClick={() => handleReorder(member.id, "up")}>
                    <ArrowUp size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={idx === filtered.length - 1} onClick={() => handleReorder(member.id, "down")}>
                    <ArrowDown size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(member.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? "Edit Member" : "Add Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <Label>Role / Designation</Label>
              <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Dean, FCIT (optional for core team)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeam;
