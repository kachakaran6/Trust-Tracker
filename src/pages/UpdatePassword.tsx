import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function UpdatePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      await api.auth.updatePassword({ currentPassword, newPassword });
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/settings"), 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 text-white">
      <form
        onSubmit={handleUpdate}
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl p-8 space-y-4"
      >
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Update Your Password</h2>
          <p className="text-xs text-slate-400 mt-1">Enter your current password and choose a new one.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Current Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 bg-slate-900/60 border border-slate-700 rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
