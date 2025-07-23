// supabase/functions/welcome-email/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

// ✅ CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Or replace with "https://yourdomain.com"
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ✅ Start the server
serve(async (req) => {
  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: corsHeaders,
      status: 200,
    });
  }

  // ✅ Handle POST
  if (req.method === "POST") {
    try {
      const { email, name } = await req.json();

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        throw new Error("Missing RESEND_API_KEY");
      }

      const resend = new Resend(resendApiKey);

      const data = await resend.emails.send({
        from: "Trust Tracker <team@trusttracker.live>", // Verified sender with display name Trust Tracker
        to: email,
        subject: "Welcome to Trust Tracker!",
        html: `
  <p>Hi ${name || "there"},</p>
  <p>Welcome to Trust Tracker! We're excited to have you on board.</p>
  <p>At Trust Tracker, we’re committed to helping you manage your trust and keep everything transparent and secure.</p>
  <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
  <p>Thank you for choosing Trust Tracker.</p>
  <p>Best regards,<br/>The Trust Tracker Team</p>
`,
      });

      return new Response(JSON.stringify({ success: true, data }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      });
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 500,
        }
      );
    }
  }

  // ❌ Any other method is not allowed
  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
});
