/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";
import { Toaster } from "sonner";

function Register() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState<"terms" | "privacy" | null>(null);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (value !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user;
        if (!user) return;

        const isEmailConfirmed = !!user.email_confirmed_at;

        if (
          (event === "SIGNED_IN" && isEmailConfirmed) ||
          (event === "USER_UPDATED" && isEmailConfirmed)
        ) {
          try {
            await fetch(
              "https://mvpmvpdjtwuoiomokfjf.functions.supabase.co/welcome-email",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user.email,
                  name:
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    "User",
                }),
              }
            );

            console.log("✅ Welcome email sent");
          } catch (err) {
            console.error("❌ Failed to send welcome email:", err);
          }
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (value.includes(" ")) {
      setPasswordError("Password cannot contain spaces");
    } else if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
    } else {
      setPasswordError(""); // no error
    }
  };

  // Generate random password
  function generateRandomPassword(length = 14) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    return Array.from(crypto.getRandomValues(new Uint32Array(length)))
      .map((x) => chars[x % chars.length])
      .join("");
  }

  // Insert pass for google auth user
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

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name, email, password);

      // // Send welcome email
      // await fetch(
      //   "https://mvpmvpdjtwuoiomokfjf.functions.supabase.co/welcome-email",
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       email: email,
      //       name: name,
      //     }),
      //   }
      // );

      toast.success(
        "Registration successful! Please check your email to verify."
      );
    } catch (err: any) {
      // Show specific toast for invalid email from Supabase
      if (
        err.name === "AuthApiError" &&
        err.message?.toLowerCase().includes("invalid")
      ) {
        toast.error("Invalid email. Please use a valid email address.");
      } else {
        toast.error(err.message || "Error creating account.");
      }

      setError("Error creating account"); // optional: for inline display
    } finally {
      setIsSubmitting(false);
    }
  };

  const redirectUrl = "https://trust-tracker.vercel.app" + "/auth/callback";

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
      <Toaster position="top-right" />

      {/* Background visual effects */}
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-primary-100 rounded-full blur-3xl opacity-30 z-0" />
      <div className="absolute bottom-[-120px] right-[-100px] w-[280px] h-[280px] bg-primary-200 rounded-full blur-2xl opacity-20 z-0" />

      <div className="w-full max-w-md space-y-8 bg-white/70 backdrop-blur-md border border-gray-200 p-10 rounded-3xl shadow-2xl z-10 transition-all duration-300 ease-in-out">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-extrabold text-primary-700 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
              Trust Tracker
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
            {/* Email */}
            <div>
              <label
                htmlFor="email-address"
                className="form-label text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="relative mt-1 h-12">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={22} className="text-primary-400" />
                </div>

                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`input-field pl-10 focus:ring-2 ${
                    emailError
                      ? "focus:ring-red-400 focus:border-red-500"
                      : "focus:ring-primary-400 focus:border-primary-500"
                  }`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);

                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                      setEmailError("Please enter a valid email address");
                    } else {
                      setEmailError("");
                    }
                  }}
                />
                {emailError && (
                  <p className="text-red-500 text-xs mt-1">{emailError}</p>
                )}
              </div>
            </div>
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="form-label text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1 h-12">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-primary-400" />
                </div>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"} // ✅ toggle visibility
                  autoComplete="new-password"
                  required
                  className={`input-field pl-10 pr-10 h-full focus:ring-2 focus:ring-primary-400 focus:border-primary-500 ${
                    passwordError ? "border-red-500" : ""
                  }`}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                />

                {/* Eye Icon */}
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </div>
              </div>

              {passwordError && (
                <p className="text-sm mt-1 text-red-600">{passwordError}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mt-4">
              <label
                htmlFor="confirm-password"
                className="form-label text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative mt-1 h-12">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-primary-400" />
                </div>

                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className={`input-field pl-10 pr-10 h-full focus:ring-2 focus:ring-primary-400 focus:border-primary-500 ${
                    confirmPasswordError ? "border-red-500" : ""
                  }`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                />

                {/* Eye Icon */}
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </div>
              </div>

              {confirmPasswordError && (
                <p className="text-sm text-red-600 mt-1">
                  {confirmPasswordError}
                </p>
              )}
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
              <button
                type="button"
                onClick={() => setShowModal("terms")}
                className="text-primary-600 hover:underline"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setShowModal("privacy")}
                className="text-primary-600 hover:underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </form>
      </div>
      {/* Terms and condition - Privacy Policy */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg animate-fade-in">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {showModal === "terms" ? "Terms of Service" : "Privacy Policy"}
            </h2>
            <div className="text-sm text-gray-600 max-h-64 overflow-y-auto">
              {showModal === "terms" ? (
                <p>
                  These Terms of Service govern your use of our platform. By
                  signing up, you agree to comply with all terms including
                  responsible use, account security, and fair conduct.
                </p>
              ) : (
                <p>
                  We respect your privacy. Your data will be handled in
                  accordance with applicable privacy laws and only used to
                  enhance your experience.
                </p>
              )}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowModal(null)}
                className="text-primary-600 hover:underline text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
