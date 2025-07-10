/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Lock, Mail } from "lucide-react";
// import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";
import { Toaster } from "sonner";

function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const navigate = useNavigate();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Generate random password
  function generateRandomPassword(length = 14) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    return Array.from(crypto.getRandomValues(new Uint32Array(length)))
      .map((x) => chars[x % chars.length])
      .join("");
  }
  // Insert random password in db
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user;
        const provider = user?.app_metadata?.provider;

        // Check if Google login and user has no password
        if (event === "SIGNED_IN" && provider === "google") {
          const passwordAlreadySet = user?.user_metadata?.password_initialized;

          if (!passwordAlreadySet) {
            const randomPassword = generateRandomPassword();

            // Set password via Supabase
            const { error: updateError } = await supabase.auth.updateUser({
              password: randomPassword,
              data: {
                password_initialized: true, // mark as handled
              },
            });

            if (updateError) {
              console.error(
                "Failed to set random password:",
                updateError.message
              );
            } else {
              console.log("Random password set successfully");
            }
          }
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);
  // succes toast
  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Login successful!"); // or move this from login()
      const timeout = setTimeout(() => {
        setShouldRedirect(true);
      }, 1000); // wait 1 sec for toast to show
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated]);

  if (shouldRedirect) {
    return <Navigate to="/dashboard" replace />;
  }

  // Wait for auth status before rendering or redirecting
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-primary-300 h-12 w-12 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      toast.success("Login successful!");

      // ✅ Delay before redirect
      // setTimeout(() => {
      //   navigate("/dashboard");
      // }, 800); // 800ms works better than 50,000ms (50 seconds!)
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password");
      // setError(err.message || "Invalid email or password");
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

  // Forgot Password

  const handleForgotPassword = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setShowResetModal(true);
  };

  const sendResetEmail = async () => {
    if (!resetEmail) {
      alert("Please enter your email.");
      return;
    }

    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: "https://fintica.vercel.app/update-password",
    });

    setResetLoading(false);
    setShowResetModal(false);

    if (error) {
      alert("Error sending reset email: " + error.message);
    } else {
      alert("Reset email sent! Check your inbox.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E3F2FD] via-[#4d88c2] to-[#e19ec0] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <Toaster position="top-right" />
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
            Sign in to your account
          </h2>
          <p className="text-sm text-gray-500">
            Or{" "}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:underline"
            >
              create a new account
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
                  autoComplete="current-password"
                  required
                  className="input-field pl-10 focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-600">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2">Remember me</span>
            </label>

            <a
              href="#"
              onClick={handleForgotPassword}
              className="text-primary-600 hover:text-primary-500 hover:underline"
            >
              Forgot password?
            </a>
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
                "Sign in"
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
              Sign in with Google
            </button>
          </div>
        </form>
      </div>
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              🔐 Reset Your Password
            </h2>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <div className="flex justify-between">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-md text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={sendResetEmail}
                disabled={resetLoading}
                className={`px-4 py-2 rounded-md text-white ${
                  resetLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {resetLoading ? "Sending..." : "Send Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
