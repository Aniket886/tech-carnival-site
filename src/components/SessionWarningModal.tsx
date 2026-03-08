import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  remainingSeconds: number;
  onStay: () => void;
  onLogout: () => void;
}

const SessionWarningModal = ({ open, remainingSeconds, onStay, onLogout }: Props) => {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-card border-destructive/40 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive text-xl flex items-center gap-2">
            ⚠️ Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            You've been inactive for a while. Your session will expire shortly.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex justify-center py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Logging out in</p>
            <div className="text-5xl font-mono font-bold text-destructive tabular-nums animate-pulse">
              {mins}:{secs.toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            onClick={onLogout}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            🚪 Logout Now
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onStay}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            ✅ Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionWarningModal;
