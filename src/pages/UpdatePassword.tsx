import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Icons } from "../components/ui/icons";
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-5">
        <div className="text-center mb-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center mx-auto mb-2">
            <Icons.Shield size={24} />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Update Your Password</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Enter your current password and choose a new one.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-7 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
            </button>
          </div>

          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            className="w-full justify-center"
            icon={<Icons.Forward size={16} />}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
