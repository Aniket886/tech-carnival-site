import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Upload, X, QrCode, IndianRupee, FileText, Eye } from "lucide-react";

const SETTING_KEYS = [
  "payment_upi_id",
  "payment_upi_name",
  "payment_instructions",
  "payment_qr_url",
] as const;

type SettingKey = (typeof SETTING_KEYS)[number];

const AdminPaymentInstructions = () => {
  const [values, setValues] = useState<Record<SettingKey, string>>({
    payment_upi_id: "",
    payment_upi_name: "",
    payment_instructions: "",
    payment_qr_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [...SETTING_KEYS]);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r) => (map[r.setting_key] = r.setting_value));
        setValues((v) => ({
          ...v,
          ...Object.fromEntries(
            SETTING_KEYS.map((k) => [k, map[k] || ""])
          ),
        }));
        if (map.payment_qr_url) setQrPreview(map.payment_qr_url);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload QR if a new file was selected
      let qrUrl = values.payment_qr_url;
      if (qrFile) {
        const ext = qrFile.name.split(".").pop() || "png";
        const filePath = `payment-qr.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("payment-screenshots")
          .upload(filePath, qrFile, { upsert: true });
        if (uploadErr) {
          toast.error("Failed to upload QR code image");
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage
          .from("payment-screenshots")
          .getPublicUrl(filePath);
        qrUrl = urlData.publicUrl;
      }

      const finalValues = { ...values, payment_qr_url: qrUrl };

      for (const key of SETTING_KEYS) {
        const val = finalValues[key];
        // Upsert: try update first, then insert
        const { data: existing } = await supabase
          .from("admin_settings")
          .select("id")
          .eq("setting_key", key)
          .limit(1);

        if (existing && existing.length > 0) {
          await supabase
            .from("admin_settings")
            .update({ setting_value: val, updated_at: new Date().toISOString() })
            .eq("setting_key", key);
        } else {
          await supabase
            .from("admin_settings")
            .insert({ setting_key: key, setting_value: val });
        }
      }

      setValues(finalValues);
      setQrFile(null);
      if (qrUrl) setQrPreview(qrUrl);
      toast.success("Payment instructions saved");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Payment Instructions
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the payment details shown to participants during registration.
        </p>
      </div>

      {/* UPI Details */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <IndianRupee size={18} className="text-primary" />
          UPI Details
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-foreground font-medium">UPI ID</Label>
          <Input
            placeholder="example@upi"
            value={values.payment_upi_id}
            onChange={(e) =>
              setValues((v) => ({ ...v, payment_upi_id: e.target.value }))
            }
            className="bg-muted/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-foreground font-medium">
            Recipient Name
          </Label>
          <Input
            placeholder="Name shown on UPI"
            value={values.payment_upi_name}
            onChange={(e) =>
              setValues((v) => ({ ...v, payment_upi_name: e.target.value }))
            }
            className="bg-muted/50"
          />
        </div>
      </div>

      {/* QR Code */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <QrCode size={18} className="text-primary" />
          QR Code Image
        </div>

        {(qrPreview || qrFile) && (
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-lg p-2 shrink-0">
              <img
                src={qrFile ? URL.createObjectURL(qrFile) : qrPreview!}
                alt="Payment QR"
                className="w-32 h-32 object-contain rounded"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setQrFile(null);
                setQrPreview(null);
                setValues((v) => ({ ...v, payment_qr_url: "" }));
              }}
            >
              <X size={14} className="mr-1" /> Remove
            </Button>
          </div>
        )}

        <label className="flex flex-col items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 p-6 transition-colors">
          <Upload size={24} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Click to upload QR code image
          </span>
          <span className="text-xs text-muted-foreground/70">
            PNG, JPG up to 5MB
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 5 * 1024 * 1024) {
                  toast.error("File too large. Max 5MB.");
                  return;
                }
                setQrFile(file);
              }
            }}
          />
        </label>
      </div>

      {/* Instructions Text */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <FileText size={18} className="text-primary" />
          Custom Instructions
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-foreground font-medium">
            Instructions (shown to participants)
          </Label>
          <Textarea
            placeholder="e.g. Pay using UPI and upload your payment screenshot below. Contact 9876543210 for payment issues."
            value={values.payment_instructions}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                payment_instructions: e.target.value,
              }))
            }
            className="bg-muted/50 min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use the default message.
          </p>
        </div>
      </div>

      {/* Live Preview */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Eye size={18} className="text-primary" />
          Participant Preview
        </div>
        <p className="text-xs text-muted-foreground">
          This is how the payment section appears to participants during registration.
        </p>

        <div className="rounded-lg border border-primary/20 bg-background p-5 space-y-4">
          <p className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">💳 Payment Details</p>

          {(values.payment_upi_id || values.payment_upi_name || values.payment_instructions) ? (
            <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
              {(values.payment_upi_id || values.payment_upi_name) && (
                <div className="text-center space-y-1">
                  {values.payment_upi_id && (
                    <p className="text-xs text-muted-foreground">UPI ID: <span className="font-mono text-foreground select-all">{values.payment_upi_id}</span></p>
                  )}
                  {values.payment_upi_name && (
                    <p className="text-xs text-muted-foreground">Name: <span className="font-medium text-foreground">{values.payment_upi_name}</span></p>
                  )}
                </div>
              )}
              {values.payment_instructions && (
                <p className="text-sm text-muted-foreground text-center pt-2 border-t border-border">{values.payment_instructions}</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <p className="text-sm text-muted-foreground text-center">Complete your payment and fill in the details below.</p>
            </div>
          )}

          {/* Mock fields */}
          <div className="space-y-3 opacity-60 pointer-events-none">
            <div className="space-y-1">
              <p className="text-xs text-foreground font-medium">Amount Paid (₹) <span className="text-destructive">*</span></p>
              <div className="h-9 rounded-md border border-border bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">e.g. 200</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-foreground font-medium">UTR Number <span className="text-destructive">*</span></p>
              <div className="h-9 rounded-md border border-border bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">Enter UTR / Reference Number</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-foreground font-medium">Transaction ID <span className="text-destructive">*</span></p>
              <div className="h-9 rounded-md border border-border bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">Enter Transaction ID</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-foreground font-medium">Payment Screenshot <span className="text-destructive">*</span></p>
              <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 flex flex-col items-center gap-1.5">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Click to upload screenshot</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="gap-2"
      >
        <Save size={16} />
        {saving ? "Saving…" : "Save Payment Instructions"}
      </Button>
    </div>
  );
};

export default AdminPaymentInstructions;
