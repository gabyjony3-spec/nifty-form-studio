import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, plan } = await req.json();
    
    console.log("[welcome-message] Processing welcome message for user:", userId, "plan:", plan);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, whatsapp, email")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("[welcome-message] Error fetching profile:", profileError);
      throw new Error("Could not fetch user profile");
    }

    console.log("[welcome-message] Profile found:", profile.full_name);

    // Build welcome message
    const userName = profile.full_name || "Utilizador";
    const planName = plan === "advanced" ? "Pro" : plan === "pro_ai" ? "Pro AI" : "Basic";
    
    const welcomeMessage = `Olá, ${userName}! Bem-vindo ao time de elite do AI INsight! 🚀

O seu acesso ${planName} foi ativado com sucesso. Agora você tem o poder da nossa IA trabalhando 24/7 para converter seus visitantes em clientes.

Para começar, que tal fazer sua primeira Análise Ilimitada ou configurar sua Automação de Respostas?

Acesse seu Dashboard: https://neo-insight-ai.lovable.app/dashboard

Precisa de ajuda para configurar sua API? Responda a esta mensagem e nosso suporte prioritário falará com você.`;

    // Check if user has WhatsApp number
    if (!profile.whatsapp) {
      console.log("[welcome-message] No WhatsApp number configured for user");
      
      // Create notification instead
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "pro_upgrade",
        title: "Bem-vindo ao Plano Pro!",
        message: `Parabéns ${userName}! O seu acesso ${planName} foi ativado. Acesse o dashboard para explorar todas as funcionalidades.`,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notification created (no WhatsApp configured)" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send WhatsApp message via Infobip
    const INFOBIP_API_KEY = Deno.env.get("INFOBIP_API_KEY");
    const INFOBIP_BASE_URL = Deno.env.get("INFOBIP_BASE_URL");

    if (!INFOBIP_API_KEY || !INFOBIP_BASE_URL) {
      console.log("[welcome-message] Infobip not configured, creating notification");
      
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "pro_upgrade",
        title: "Bem-vindo ao Plano Pro!",
        message: `Parabéns ${userName}! O seu acesso ${planName} foi ativado.`,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notification created (Infobip not configured)" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number
    const phoneNumber = profile.whatsapp.replace(/\D/g, "");
    console.log("[welcome-message] Sending WhatsApp to:", phoneNumber);

    const infobipResponse = await fetch(`${INFOBIP_BASE_URL}/sms/2/text/advanced`, {
      method: "POST",
      headers: {
        "Authorization": `App ${INFOBIP_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to: phoneNumber }],
            text: welcomeMessage,
          },
        ],
      }),
    });

    const infobipResult = await infobipResponse.json();
    console.log("[welcome-message] Infobip response:", JSON.stringify(infobipResult));

    // Also create a notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "pro_upgrade",
      title: "Bem-vindo ao Plano Pro!",
      message: `Parabéns ${userName}! O seu acesso ${planName} foi ativado.`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Welcome message sent",
        infobipResult 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[welcome-message] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
