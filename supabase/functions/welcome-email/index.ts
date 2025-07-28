// supabase/functions/welcome-email/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";
// ✅ CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
// ✅ Start the server
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: corsHeaders,
      status: 200,
    });
  }
  if (req.method === "POST") {
    try {
      const body = await req.json();
      let email, name;
      // ✅ Handle Supabase webhook
      if (
        body?.event === "USER_UPDATED" &&
        body?.record?.email_confirmed_at &&
        !body?.record?.user_metadata?.welcome_email_sent
      ) {
        email = body.record.email;
        name =
          body.record.user_metadata?.full_name ||
          body.record.user_metadata?.name ||
          "User";
      } else if (body?.email && body?.name) {
        email = body.email;
        name = body.name;
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid payload",
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 400,
          }
        );
      }
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        throw new Error("Missing RESEND_API_KEY");
      }
      const resend = new Resend(resendApiKey);
      const data = await resend.emails.send({
        from: "Trust Tracker <team@trusttracker.live>",
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
      const updateResponse = await fetch(
        `https://mvpmvpdjtwuoiomokfjf.supabase.co/auth/v1/admin/users/${body.record.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${Deno.env.get(
              "SUPABASE_SERVICE_ROLE_KEY"
            )}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_metadata: {
              welcome_email_sent: true,
            },
          }),
        }
      );

      const updateResult = await updateResponse.json();
      console.log("User metadata update result:", updateResult);

      if (!updateResponse.ok) {
        throw new Error(
          "Failed to update user metadata: " + JSON.stringify(updateResult)
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        }
      );
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
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
  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
});
