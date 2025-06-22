import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      // Important: This parses the URL and stores the session
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.warn("Trying URL hash recovery");
        // Use this fallback if Supabase hasn't stored session yet
        const {
          data: { session },
          error: hashError,
        } = await supabase.auth.getSessionFromUrl(); // <== This is critical
        if (session) {
          navigate("/dashboard");
        } else {
          console.error("OAuth login failed:", hashError);
          navigate("/login");
        }
      } else {
        navigate("/dashboard");
      }
    };

    handleRedirect();
  }, [navigate]);

  return <p>Signing you in with Google...</p>;
};

export default AuthCallback;
