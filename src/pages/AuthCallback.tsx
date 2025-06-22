import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession();

      if (error) {
        console.error("Error exchanging code for session:", error.message);
        navigate("/login");
        return;
      }

      // Session has been established
      console.log("OAuth session:", data.session);
      navigate("/dashboard");
    };

    handleRedirect();
  }, [navigate]);

  return <p>Signing you in with Google...</p>;
};

export default AuthCallback;
