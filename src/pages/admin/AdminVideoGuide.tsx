import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Video, ExternalLink, Save } from "lucide-react";

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const AdminVideoGuide = () => {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "how_to_register_video_url")
        .maybeSingle();
      if (data?.setting_value) setUrl(data.setting_value);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_settings")
      .upsert(
        { setting_key: "how_to_register_video_url", setting_value: url, updated_at: new Date().toISOString() },
        { onConflict: "setting_key" }
      );
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Video URL saved");
  };

  const videoId = extractYouTubeId(url);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Video Guide</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set the YouTube video shown in the "How to Register" section on the public site.
        </p>
      </div>

      <div className="p-6 rounded-xl border border-border bg-card space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Video size={16} className="text-primary" />
          YouTube Video URL
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save size={14} /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
        {url && !videoId && (
          <p className="text-xs text-destructive">Invalid YouTube URL. Please use a standard YouTube link.</p>
        )}
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <ExternalLink size={12} /> Open in YouTube
          </a>
        )}
      </div>

      {/* Preview */}
      {videoId && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Preview</h3>
          <div className="max-w-xl rounded-xl overflow-hidden border border-border">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                title="Video Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideoGuide;
