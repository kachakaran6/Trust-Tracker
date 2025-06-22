import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.error("OAuth login failed:", error);
        // Optional: Redirect to /login or show an error
        return;
      }

      // You can now use the session
      console.log("Session:", data.session);

      // Redirect to dashboard or wherever you want
      navigate("/dashboard");
    };

    getSession();
  }, [navigate]);

  return <p>Signing you in with Google...</p>;
};

export default AuthCallback;
