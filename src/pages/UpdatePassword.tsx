import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login"); // If no token/auth session, redirect
      } else {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully!");
      navigate("/login");
    }

    setLoading(false);
  };

  if (!sessionChecked) return <p>Loading...</p>;

  return (
    <form onSubmit={handleUpdate} className="max-w-md mx-auto mt-10">
      <h2 className="text-xl mb-4">Set a New Password</h2>
      <input
        type="password"
        required
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white p-2 rounded w-full"
        disabled={loading}
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
};

export default UpdatePassword;
