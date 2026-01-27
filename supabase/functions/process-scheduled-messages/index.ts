import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('[process-scheduled-messages] Starting scheduled message processing...');

    // Find all pending scheduled messages that are due
    const now = new Date().toISOString();
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('scheduled_whatsapp_messages')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('[process-scheduled-messages] Error fetching messages:', fetchError);
      throw fetchError;
    }

    console.log(`[process-scheduled-messages] Found ${pendingMessages?.length || 0} messages to process`);

    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending messages' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const message of pendingMessages) {
      try {
        // Mark as processing
        await supabase
          .from('scheduled_whatsapp_messages')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', message.id);

        // Prepare message content with variable substitution
        let messageContent = message.message_template;
        
        // Replace variables if metadata exists
        if (message.metadata) {
          const meta = message.metadata as Record<string, string>;
          messageContent = messageContent
            .replace(/\{nome\}/gi, message.lead_name || meta.nome || '')
            .replace(/\{empresa\}/gi, meta.empresa || '')
            .replace(/\{score_geral\}/gi, meta.score_geral || '')
            .replace(/\{url\}/gi, meta.url || '')
            .replace(/\{data\}/gi, new Date().toLocaleDateString('pt-BR'));
        }

        // Send the message via send-whatsapp function
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            to: message.lead_phone,
            message: messageContent,
            userId: message.user_id
          }
        });

        if (sendError || !sendResult?.success) {
          throw new Error(sendError?.message || sendResult?.error || 'Failed to send message');
        }

        // Mark as sent
        await supabase
          .from('scheduled_whatsapp_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', message.id);

        results.push({ id: message.id, success: true });
        console.log(`[process-scheduled-messages] Successfully sent message ${message.id}`);

      } catch (msgError: unknown) {
        const errorMessage = msgError instanceof Error ? msgError.message : 'Unknown error';
        console.error(`[process-scheduled-messages] Error processing message ${message.id}:`, errorMessage);

        // Mark as failed
        await supabase
          .from('scheduled_whatsapp_messages')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', message.id);

        results.push({ id: message.id, success: false, error: errorMessage });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[process-scheduled-messages] Completed: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        sent: successCount,
        failed: failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[process-scheduled-messages] Error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
