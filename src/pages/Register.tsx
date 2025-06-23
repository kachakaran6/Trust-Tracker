import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, User } from "lucide-react";
import { supabase } from "../lib/supabase";

function Register() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name, email, password);
    } catch (err) {
      setError("Error creating account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const redirectUrl = "https://fintica.vercel.app" + "/auth/callback";

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl, // <- you can choose a safe landing page
        },
      });
      if (error) {
        setError("Google sign-in failed");
        console.error("OAuth error:", error.message);
      }
    } catch (err) {
      setError("Google login error");
      console.error("Google login failed:", err);
    }
    console.log("Redirecting to:", import.meta.env.VITE_APP_URL);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E3F2FD] via-[#4d88c2] to-[#e19ec0] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual effects */}
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-primary-100 rounded-full blur-3xl opacity-30 z-0" />
      <div className="absolute bottom-[-120px] right-[-100px] w-[280px] h-[280px] bg-primary-200 rounded-full blur-2xl opacity-20 z-0" />

      <div className="w-full max-w-md space-y-8 bg-white/70 backdrop-blur-md border border-gray-200 p-10 rounded-3xl shadow-2xl z-10 transition-all duration-300 ease-in-out">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-extrabold text-primary-700 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
              Fintica
            </span>
          </h1>
          <h2 className="text-xl text-gray-800 font-medium">
            Create your account
          </h2>
          <p className="text-sm text-gray-500">
            Or{" "}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:underline"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-md text-sm shadow-sm">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="form-label text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-primary-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="input-field pl-10 focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email-address"
                className="form-label text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-primary-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field pl-10 focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="form-label text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-primary-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-field pl-10 focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="form-label text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-primary-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-field pl-10 focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg"
            >
              {isSubmitting ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Create Account"
              )}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-gray-300 hover:shadow-md text-gray-700 font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google logo"
                className="h-5 w-5"
              />
              Sign up with Google
            </button>

            <p className="text-xs text-center text-gray-500">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-primary-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
