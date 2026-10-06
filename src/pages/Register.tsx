import React, { useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { CURRENCIES, detectUserCurrency } from "../utils/currency";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Icons } from "../components/ui/icons";
import { toast } from "sonner";

export default function Register() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTarget =
    searchParams.get("redirect") ||
    sessionStorage.getItem("tt_join_redirect") ||
    "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currency, setCurrency] = useState(detectUserCurrency());
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrency(detectUserCurrency());
  }, []);

  if (isAuthenticated && !isLoading) {
    if (sessionStorage.getItem("tt_join_redirect")) {
      sessionStorage.removeItem("tt_join_redirect");
    }
    return <Navigate to={redirectTarget} replace />;
  }

  const currencyOptions = CURRENCIES.map((c) => ({
    label: `${c.code} (${c.symbol}) - ${c.name}`,
    value: c.code,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register(name, email, password, { currency });
    } catch {
      // Error handled in AuthContext
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
          Create a TrustTracker Account
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Track expenses, split group bills, and monitor subscriptions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8 space-y-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
            />

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
            />

            <Select
              label="Primary Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={currencyOptions}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <Input
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />

            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center"
              icon={<Icons.Forward size={16} />}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border)]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[var(--primary)] hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
