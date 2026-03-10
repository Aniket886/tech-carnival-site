import { useState, useEffect, useRef } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAdminRefresh } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ImageIcon, Plus, Pencil, Trash2, Loader2, Upload } from "lucide-react";

interface GalleryItem {
  id: string;
  image_url: string;
  caption: string | null;
  category: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
}

const CATEGORIES = ["general", "technical", "cultural", "sports", "backstage"];

const AdminGallery = () => {
  const refreshKey = useAdminRefresh();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editItem, setEditItem] = useState<GalleryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [editCaption, setEditCaption] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    const q = supabase.from("gallery_items").select("*").order("display_order").order("created_at", { ascending: false });
    const { data } = await q;
    if (data) setItems(data as unknown as GalleryItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [refreshKey]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    let count = 0;
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("gallery-images").upload(path, file);
      if (uploadErr) { toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" }); continue; }
      const { data: urlData } = supabase.storage.from("gallery-images").getPublicUrl(path);
      await supabase.from("gallery_items").insert({ image_url: urlData.publicUrl, category: "general" });
      count++;
    }
    setUploading(false);
    if (count) { toast({ title: `${count} image(s) uploaded` }); fetchItems(); }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    await supabase.from("gallery_items").update({ caption: editCaption || null, category: editCategory }).eq("id", editItem.id);
    toast({ title: "Updated" });
    setEditItem(null);
    fetchItems();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const item = items.find(i => i.id === deleteId);
    if (item) {
      const path = item.image_url.split("/gallery-images/").pop();
      if (path) await supabase.storage.from("gallery-images").remove([path]);
    }
    await supabase.from("gallery_items").delete().eq("id", deleteId);
    toast({ title: "Deleted" });
    
    setDeleteId(null);
    fetchItems();
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    await supabase.from("gallery_items").update({ is_visible: !current }).eq("id", id);
    fetchItems();
  };

  const filtered = filterCat === "all" ? items : items.filter(i => i.category === filterCat);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <ImageIcon className="text-primary" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Gallery</h2>
            <p className="text-sm text-muted-foreground">Manage event photos & media</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} size="sm">
            {uploading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Upload size={16} className="mr-1" />}
            Upload
          </Button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No images yet. Upload some!</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <Card key={item.id} className={`overflow-hidden border-border group ${!item.is_visible ? "opacity-50" : ""}`}>
              <div className="relative aspect-square">
                <img src={item.image_url} alt={item.caption || "Gallery"} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(item); setEditCaption(item.caption || ""); setEditCategory(item.category); }}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(item.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{item.category}</Badge>
                  <Switch checked={item.is_visible} onCheckedChange={() => toggleVisibility(item.id, item.is_visible)} />
                </div>
                {item.caption && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.caption}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Image</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Caption</Label><Input value={editCaption} onChange={e => setEditCaption(e.target.value)} /></div>
            <div>
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the image from storage and database.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminGallery;
