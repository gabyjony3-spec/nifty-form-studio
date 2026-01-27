import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwilioRequest {
  test?: boolean;
  accountSid?: string;
  authToken?: string;
  to?: string;
  message?: string;
  userId?: string;
  adminId?: string;
  recipientName?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: TwilioRequest = await req.json();
    console.log("[send-twilio] Request received:", { 
      test: body.test, 
      to: body.to, 
      userId: body.userId 
    });

    // Get Twilio config from database
    const { data: twilioConfig, error: configError } = await supabase
      .from("admin_twilio_config")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (configError) {
      console.error("[send-twilio] Config error:", configError);
      throw new Error("Erro ao carregar configuração Twilio");
    }

    // Use config from request (for testing) or from database
    const ACCOUNT_SID = body.accountSid || twilioConfig?.account_sid;
    const AUTH_TOKEN = body.authToken || twilioConfig?.auth_token;
    const FROM_NUMBER = twilioConfig?.phone_number;

    if (!ACCOUNT_SID || !AUTH_TOKEN) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Credenciais Twilio não configuradas" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test mode - just validate credentials
    if (body.test) {
      console.log("[send-twilio] Testing credentials...");
      
      const testResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}.json`,
        {
          headers: {
            Authorization: `Basic ${btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`)}`,
          },
        }
      );

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error("[send-twilio] Credential test failed:", errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Credenciais inválidas" 
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[send-twilio] Credentials valid!");
      return new Response(
        JSON.stringify({ success: true, message: "Credenciais válidas" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send message mode
    if (!body.to || !body.message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Destinatário e mensagem são obrigatórios" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!FROM_NUMBER) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Número de telefone Twilio não configurado" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number
    let toNumber = body.to.replace(/\D/g, "");
    if (!toNumber.startsWith("+")) {
      if (toNumber.length === 9 && toNumber.startsWith("9")) {
        toNumber = `+351${toNumber}`;
      } else if (!toNumber.startsWith("351") && !toNumber.startsWith("55")) {
        toNumber = `+${toNumber}`;
      } else {
        toNumber = `+${toNumber}`;
      }
    }

    console.log(`[send-twilio] Sending SMS to ${toNumber} from ${FROM_NUMBER}`);

    // Create initial log entry
    const { data: logEntry, error: logError } = await supabase
      .from("communication_logs")
      .insert({
        user_id: body.userId || null,
        admin_id: body.adminId || null,
        provider: "twilio",
        recipient_phone: toNumber,
        recipient_name: body.recipientName || null,
        message_content: body.message,
        status: "pending",
      })
      .select()
      .single();

    if (logError) {
      console.error("[send-twilio] Log insert error:", logError);
    }

    // Send via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append("To", toNumber);
    formData.append("From", FROM_NUMBER);
    formData.append("Body", body.message);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const responseData = await response.json();
    console.log("[send-twilio] Twilio response:", JSON.stringify(responseData));

    if (!response.ok) {
      console.error("[send-twilio] Twilio error:", responseData);
      
      // Update log with error
      if (logEntry) {
        await supabase
          .from("communication_logs")
          .update({
            status: "failed",
            error_message: responseData.message || "Erro desconhecido",
            metadata: { twilio_response: responseData }
          })
          .eq("id", logEntry.id);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: responseData.message || "Erro ao enviar mensagem" 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update log with success
    if (logEntry) {
      await supabase
        .from("communication_logs")
        .update({
          status: "sent",
          external_id: responseData.sid,
          metadata: { twilio_response: responseData }
        })
        .eq("id", logEntry.id);
    }

    console.log("[send-twilio] Message sent successfully! SID:", responseData.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: responseData.sid,
        status: responseData.status
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[send-twilio] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
