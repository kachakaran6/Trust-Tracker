// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishSignIn = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession();
      console.log("OAuth callback:", data, error);

      if (data?.session) {
        navigate("/dashboard");
      } else {
        console.error("OAuth callback error:", error);
        navigate("/login");
      }
    };

    finishSignIn();
  }, [navigate]);

  return <div className="text-center mt-20">Loading...</div>;
}
