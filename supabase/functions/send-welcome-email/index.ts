import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  profileScore?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("[send-welcome-email] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, profileScore }: WelcomeEmailRequest = await req.json();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      console.error("[send-welcome-email] Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Could not fetch user profile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userName = profile.full_name || "Mentor";
    const dashboardUrl = "https://neo-insight-ai.lovable.app/radar";

    // Dynamic content based on profile score
    let scoreSection = "";
    if (profileScore !== undefined) {
      scoreSection = `
        <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 8px 0;">O seu Profile Score atual é</p>
          <p style="color: #ffffff; font-size: 48px; font-weight: bold; margin: 0;">${profileScore}</p>
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0 0;">/100 pontos</p>
        </div>
      `;
    } else {
      scoreSection = `
        <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0;">🎯 Descubra o seu Score de Autoridade</p>
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 12px 0 0 0;">Faça a sua primeira análise e receba um diagnóstico completo do seu perfil.</p>
        </div>
      `;
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao AI INsight</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #0891b2, #06b6d4); padding: 16px 32px; border-radius: 12px;">
                <span style="color: #ffffff; font-size: 24px; font-weight: bold;">🚀 AI INsight</span>
              </div>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; border: 1px solid rgba(6, 182, 212, 0.2);">
                <tr>
                  <td style="padding: 40px;">
                    <!-- Greeting -->
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 16px 0;">
                      Olá, ${userName}! 👋
                    </h1>
                    
                    <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      Bem-vindo ao <strong style="color: #06b6d4;">AI INsight</strong> — o seu acesso ao ecossistema de inteligência para mentores foi ativado com sucesso.
                    </p>

                    <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      O nosso <strong style="color: #ffffff;">Radar de Nicho</strong> já está pronto para escanear o seu perfil. Sabia que <strong style="color: #f59e0b;">87% dos mentores</strong> falham em converter seguidores em clientes porque a sua foto e Bio não transmitem a autoridade necessária?
                    </p>

                    ${scoreSection}

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding: 24px 0;">
                          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 16px 32px; border-radius: 12px; box-shadow: 0 8px 32px rgba(6, 182, 212, 0.3);">
                            ${profileScore ? 'Ver o Meu Diagnóstico Completo' : 'Descobrir o Meu Score de Autoridade'} →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Features -->
                    <div style="background: rgba(6, 182, 212, 0.05); border-radius: 16px; padding: 24px; margin: 24px 0;">
                      <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">O que pode fazer agora:</p>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">✅ Analisar o seu perfil com IA</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">✅ Receber um plano de ação personalizado</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">✅ Gerar conteúdo com um clique</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">✅ Ver os melhores horários para postar</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Footer text -->
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                      Precisa de ajuda? Responda a este e-mail e a nossa equipa irá apoiá-lo.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding: 32px 0;">
              <p style="color: #475569; font-size: 12px; margin: 0;">
                © 2024 AI INsight. Todos os direitos reservados.
              </p>
              <p style="color: #475569; font-size: 12px; margin: 8px 0 0 0;">
                Você está recebendo este email porque se registou no AI INsight.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    console.log(`[send-welcome-email] Sending to ${profile.email}`);

    // Use fetch to call Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "AI INsight <onboarding@resend.dev>",
        to: [profile.email],
        subject: "🚀 O seu diagnóstico de Mentor está pronto (ou quase...)",
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[send-welcome-email] Resend error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("[send-welcome-email] Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[send-welcome-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);