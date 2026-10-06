import React, { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Icons } from "../components/ui/icons";
import { toast } from "sonner";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && !isLoading) {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
    } catch {
      // Error handled by AuthContext via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] mb-2">
          <Icons.Shield size={24} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          Sign in to TrustTracker
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Personal finance, shared expenses, loans, and subscriptions in one place.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8 space-y-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              disabled={isSubmitting}
              className="w-full justify-center"
              icon={<Icons.Forward size={16} />}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border)]">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-[var(--primary)] hover:underline">
              Create account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
