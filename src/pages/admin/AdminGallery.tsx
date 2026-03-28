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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ImageIcon, Plus, Pencil, Trash2, Loader2, Upload, ImageOff, Download } from "lucide-react";
import heic2any from "heic2any";

interface GalleryItem {
  id: string;
  image_url: string;
  caption: string | null;
  category: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
}

const DEFAULT_CATEGORIES = ["general", "technical", "cultural", "sports", "backstage"];

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
  const [isDragging, setIsDragging] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...customCategories])];



  const fetchItems = async () => {
    const q = supabase.from("gallery_items").select("*").order("display_order").order("created_at", { ascending: false });
    const { data } = await q;
    if (data) {
      setItems(data as unknown as GalleryItem[]);
      // Discover categories from existing items not in defaults
      const extra = (data as unknown as GalleryItem[])
        .map(i => i.category)
        .filter(c => !DEFAULT_CATEGORIES.includes(c));
      setCustomCategories(prev => [...new Set([...prev, ...extra])]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [refreshKey]);

  const handleAddCategory = () => {
    const name = newCatName.trim().toLowerCase();
    if (!name) return;
    if (allCategories.includes(name)) {
      toast({ title: "Category already exists", variant: "destructive" });
      return;
    }
    setCustomCategories(prev => [...prev, name]);
    setNewCatName("");
    setNewCatOpen(false);
    toast({ title: `Category "${name}" added` });
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files.length) return;
    setUploading(true);
    let count = 0;
    for (const file of Array.from(files)) {
      let uploadFile: File | Blob = file;
      let finalExt = (file.name.split(".").pop() || "jpg").toLowerCase();

      // Detect HEIC by extension OR by mime type (iPhone often sends image/heic)
      const isHeic = ["heic", "heif"].includes(finalExt) || 
        file.type.toLowerCase().includes("heic") || 
        file.type.toLowerCase().includes("heif");

      if (isHeic) {
        try {
          const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
          uploadFile = converted as Blob;
          finalExt = "jpg";
        } catch {
          // Fallback: try browser-native decoding via createImageBitmap + Canvas
          try {
            const bitmap = await createImageBitmap(file);
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(bitmap, 0, 0);
            bitmap.close();
            const jpegBlob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(b => b ? resolve(b) : reject(new Error("Canvas export failed")), "image/jpeg", 0.85);
            });
            uploadFile = jpegBlob;
            finalExt = "jpg";
          } catch (fallbackErr: any) {
            toast({ title: "HEIC conversion failed", description: "This image format is not supported by your browser. Try converting to JPG first.", variant: "destructive" });
            continue;
          }
        }
      }

      // Auto-compress if over 4MB
      if (uploadFile.size > 4 * 1024 * 1024) {
        try {
          const bitmap = await createImageBitmap(uploadFile instanceof Blob ? uploadFile : new Blob([uploadFile]));
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
          let compressed = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(b => b ? resolve(b) : reject(new Error("Compress failed")), "image/jpeg", 0.92);
          });
          if (compressed.size > 4 * 1024 * 1024) {
            compressed = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(b => b ? resolve(b) : reject(new Error("Compress failed")), "image/jpeg", 0.85);
            });
          }
          uploadFile = compressed;
          finalExt = "jpg";
        } catch {
          // If compression fails, upload as-is
        }
      }

      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${finalExt}`;
      const contentType = finalExt === "jpg" ? "image/jpeg" : file.type;
      const { error: uploadErr } = await supabase.storage.from("gallery-images").upload(path, uploadFile, { contentType });
      if (uploadErr) { toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" }); continue; }
      const { data: urlData } = supabase.storage.from("gallery-images").getPublicUrl(path);
      await supabase.from("gallery_items").insert({ image_url: urlData.publicUrl, category: "general" });
      count++;
    }
    setUploading(false);
    if (count) { toast({ title: `${count} image(s) uploaded` }); fetchItems(); }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

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
              {allCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus size={14} /> Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Category name"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setNewCatOpen(false)}>Cancel</Button>
                <Button onClick={handleAddCategory} disabled={!newCatName.trim()}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} size="sm">
            {uploading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Upload size={16} className="mr-1" />}
            Upload
          </Button>
          <input ref={fileRef} type="file" accept="*/*" multiple className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/10 text-primary"
            : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
        }`}
      >
        <Upload size={28} className="mx-auto mb-2" />
        <p className="text-sm font-medium">{uploading ? "Uploading…" : "Drag & drop files here or click to browse"}</p>
        <p className="text-xs mt-1">Supports all image formats including HEIC</p>
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
                <img
                  src={item.image_url}
                  alt={item.caption || "Gallery"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const placeholder = document.createElement("div");
                    placeholder.className = "w-full h-full flex items-center justify-center bg-muted";
                    placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                    target.parentElement?.appendChild(placeholder);
                  }}
                />
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(item); setEditCaption(item.caption || ""); setEditCategory(item.category); }}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(item.id)}>
                    <Trash2 size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const res = await fetch(item.image_url);
                      const blob = await res.blob();
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = (item.caption || "gallery-image") + "." + (item.image_url.split(".").pop() || "jpg");
                      a.click();
                      URL.revokeObjectURL(a.href);
                    } catch { toast({ title: "Download failed", variant: "destructive" }); }
                  }}>
                    <Download size={16} />
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
                  {allCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
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
