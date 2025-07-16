import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";
import { Toaster } from "sonner";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Try to use token from URL
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error("Error refreshing session:", error.message);
          navigate("/login"); // Fallback
          return;
        }
      }

      setSessionChecked(true);
    };

    checkSession();
  }, [navigate]);

  const handleUpdate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to update password.");
    } else {
      toast.success("Password updated successfully!");

      // Delay navigation slightly to allow toast to display
      setTimeout(() => {
        navigate("/login");
      }, 1000); // 1 second delay
    }
  };

  if (!sessionChecked) return <p>Loading...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Toaster position="top-right" />
      <form
        onSubmit={handleUpdate}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          🔒 Reset Your Password
        </h2>

        <div className="mb-4 relative">
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            New Password
          </label>
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Enter a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          type="submit"
          className={`w-full py-2 px-4 text-white rounded-lg font-medium transition ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        <p className="text-sm text-center text-gray-500 mt-4">
          You’ll be redirected to login after updating.
        </p>
      </form>
    </div>
  );
};

export default UpdatePassword;
