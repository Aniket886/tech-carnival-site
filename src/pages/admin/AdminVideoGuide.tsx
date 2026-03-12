import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Video, ExternalLink, Plus, Trash2, GripVertical } from "lucide-react";

interface GuideVideo {
  id: string;
  title: string;
  url: string;
  display_order: number;
}

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const AdminVideoGuide = () => {
  const [videos, setVideos] = useState<GuideVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchVideos = async () => {
    const { data } = await supabase
      .from("guide_videos")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setVideos(data);
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, []);

  const handleAdd = async () => {
    if (!newUrl.trim()) { toast.error("Enter a YouTube URL"); return; }
    if (!extractYouTubeId(newUrl)) { toast.error("Invalid YouTube URL"); return; }
    setAdding(true);
    const { error } = await supabase.from("guide_videos").insert({
      title: newTitle.trim() || "Untitled",
      url: newUrl.trim(),
      display_order: videos.length,
    });
    setAdding(false);
    if (error) { toast.error("Failed to add video"); return; }
    toast.success("Video added");
    setNewUrl("");
    setNewTitle("");
    fetchVideos();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("guide_videos").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Video removed");
    fetchVideos();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Video Guide</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage YouTube videos shown in the "How to Register" section. Users can paginate through them.
        </p>
      </div>

      {/* Add new video */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Plus size={16} className="text-primary" />
          Add New Video
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
          <Input
            placeholder="Title (e.g. Step 1)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Input
            placeholder="https://www.youtube.com/watch?v=..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={adding} className="gap-2">
            <Plus size={14} /> {adding ? "Adding…" : "Add"}
          </Button>
        </div>
        {newUrl && !extractYouTubeId(newUrl) && (
          <p className="text-xs text-destructive">Invalid YouTube URL.</p>
        )}
      </div>

      {/* Video list */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Videos ({videos.length})</h3>
        {videos.length === 0 && (
          <p className="text-sm text-muted-foreground">No videos added yet.</p>
        )}
        {videos.map((video) => {
          const vid = extractYouTubeId(video.url);
          return (
            <div key={video.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <GripVertical size={16} className="text-muted-foreground mt-1 flex-shrink-0" />
              {vid && (
                <div className="w-40 flex-shrink-0 rounded-lg overflow-hidden border border-border">
                  <img
                    src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full aspect-video object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium text-sm text-foreground truncate">{video.title || "Untitled"}</p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink size={12} /> {video.url}
                </a>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive flex-shrink-0"
                onClick={() => handleDelete(video.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminVideoGuide;
