import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { loginAndCheckRole } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    const error = await loginAndCheckRole(email, password);
    if (error) {
      toast.error(error);
      setBusy(false);
    } else {
      navigate("/admin/overview", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm flex flex-col gap-2.5 px-8 pb-4 bg-[#171717] rounded-[25px] transition-all duration-400 hover:scale-105 hover:border hover:border-black"
      >
        <p className="text-center my-8 text-foreground text-lg font-semibold">Admin Login</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div className="flex items-center justify-center gap-2 rounded-[25px] p-2.5 bg-[#171717] shadow-[inset_2px_5px_10px_rgb(5,5,5)]">
            <svg className="h-5 w-5 fill-foreground shrink-0" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16">
              <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z" />
            </svg>
            <input
              autoComplete="off"
              placeholder="Email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-[#d3d3d3] text-sm"
            />
          </div>

          <div className="flex items-center justify-center gap-2 rounded-[25px] p-2.5 bg-[#171717] shadow-[inset_2px_5px_10px_rgb(5,5,5)]">
            <svg className="h-5 w-5 fill-foreground shrink-0" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16">
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            </svg>
            <input
              placeholder="Password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-[#d3d3d3] text-sm"
            />
          </div>

          <div className="flex justify-center mt-6 gap-2">
            <button
              type="submit"
              disabled={busy}
              className="py-2 px-6 rounded-md border-none outline-none transition-all duration-400 bg-[#252525] text-foreground hover:bg-black disabled:opacity-50 disabled:pointer-events-none text-sm"
            >
              {busy ? "Signing in…" : "Login"}
            </button>
          </div>
        </form>

        <button
          onClick={() => navigate("/")}
          className="mb-6 py-2 rounded-md border-none outline-none transition-all duration-400 bg-[#252525] text-foreground hover:bg-destructive hover:text-destructive-foreground text-sm"
        >
          ← Back to site
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
