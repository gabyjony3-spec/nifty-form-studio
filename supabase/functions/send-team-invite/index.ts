import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-TEAM-INVITE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      logStep("RESEND_API_KEY not configured, skipping email");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Invite created but email not sent - RESEND_API_KEY not configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id });

    const { email, inviterName, token: inviteToken, role } = await req.json();
    
    if (!email || !inviteToken) {
      throw new Error("Email and token are required");
    }

    logStep("Sending invite email", { to: email, role });

    const origin = req.headers.get("origin") || "https://ucvzqfmyhxyjyeiljmvl.lovableproject.com";
    const inviteLink = `${origin}/auth?invite=${inviteToken}`;

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AI INsight <onboarding@resend.dev>",
        to: [email],
        subject: `${inviterName || 'Alguém'} convidou você para o AI INsight`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 AI INsight</h1>
              </div>
              <div class="content">
                <h2>Você foi convidado!</h2>
                <p><strong>${inviterName || 'Um usuário'}</strong> convidou você para fazer parte da equipe no AI INsight como <strong>${role === 'editor' ? 'Editor' : 'Visualizador'}</strong>.</p>
                <p>Clique no botão abaixo para aceitar o convite e criar sua conta:</p>
                <p style="text-align: center;">
                  <a href="${inviteLink}" class="button">Aceitar Convite</a>
                </p>
                <p style="font-size: 12px; color: #666;">Se o botão não funcionar, copie e cole este link no seu navegador:<br>${inviteLink}</p>
              </div>
              <div class="footer">
                <p>© 2024 AI INsight. Todos os direitos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    logStep("Email sent", { status: emailResponse.status, result: emailResult });

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResult.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
