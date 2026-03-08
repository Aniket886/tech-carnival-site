import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

interface OtherCollegeDialogProps {
  open: boolean;
  onClose: () => void;
  onCollegeSaved: (collegeName: string) => void;
}

const OtherCollegeDialog = ({ open, onClose, onCollegeSaved }: OtherCollegeDialogProps) => {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) errs.name = "College name is required";
    else if (trimmed.length < 3) errs.name = "Must be at least 3 characters";
    else if (trimmed.length > 100) errs.name = "Must not exceed 100 characters";
    if (!city.trim()) errs.city = "City is required";
    if (!state.trim()) errs.state = "State is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const collegeName = name.trim();

    // Check if college already exists
    const { data: existing } = await supabase
      .from("colleges")
      .select("id, name")
      .ilike("name", collegeName)
      .limit(1);

    if (existing && existing.length > 0) {
      // College already exists, just use it
      onCollegeSaved(existing[0].name);
      resetAndClose();
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("colleges").insert({
      name: collegeName,
      short_name: shortName.trim() || null,
      city: city.trim(),
      state: state.trim(),
      is_active: true,
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to save college: " + error.message);
      return;
    }

    toast.success("College added successfully!");
    onCollegeSaved(collegeName);
    resetAndClose();
  };

  const resetAndClose = () => {
    setName("");
    setShortName("");
    setCity("");
    setState("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); }}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Building2 size={20} className="text-primary" />
            Add Your College
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your college will be saved for future registrations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">College Name *</Label>
            <Input
              placeholder="e.g. ABC College of Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Short Name / Abbreviation</Label>
            <Input
              placeholder="e.g. ABCCE"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">City *</Label>
              <Input
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={50}
                className={errors.city ? "border-destructive" : ""}
              />
              {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">State *</Label>
              <Input
                placeholder="e.g. Maharashtra"
                value={state}
                onChange={(e) => setState(e.target.value)}
                maxLength={50}
                className={errors.state ? "border-destructive" : ""}
              />
              {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OtherCollegeDialog;
