import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map Infobip status to our status
const statusMap: Record<string, string> = {
  'PENDING': 'pending',
  'PENDING_ENROUTE': 'pending',
  'PENDING_ACCEPTED': 'pending',
  'SENT': 'sent',
  'DELIVERED': 'delivered',
  'DELIVERED_TO_HANDSET': 'delivered',
  'SEEN': 'read',
  'READ': 'read',
  'UNDELIVERABLE': 'failed',
  'REJECTED': 'failed',
  'EXPIRED': 'failed',
  'FAILED': 'failed',
  'UNKNOWN': 'pending',
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[whatsapp-webhook][${requestId}] Received ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET request for webhook verification (if Infobip requires it)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const challenge = url.searchParams.get('hub.challenge');
    if (challenge) {
      console.log(`[whatsapp-webhook][${requestId}] Webhook verification challenge received`);
      return new Response(challenge, { status: 200 });
    }
    return new Response('Webhook endpoint active', { status: 200 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Log headers for debugging
    const headers = Object.fromEntries(req.headers.entries());
    console.log(`[whatsapp-webhook][${requestId}] Headers:`, JSON.stringify(headers));

    const body = await req.json();
    console.log(`[whatsapp-webhook][${requestId}] Raw payload:`, JSON.stringify(body));

    // Handle Infobip delivery reports
    // Infobip can send in multiple formats:
    // 1. { results: [...] } - batch format
    // 2. Single object with messageId, status, etc.
    // 3. { messages: [...] } - alternative format
    let results: any[] = [];
    
    if (Array.isArray(body.results)) {
      results = body.results;
    } else if (Array.isArray(body.messages)) {
      results = body.messages;
    } else if (Array.isArray(body)) {
      results = body;
    } else if (body.messageId || body.message_id || body.bulkId) {
      results = [body];
    }

    console.log(`[whatsapp-webhook][${requestId}] Processing ${results.length} message(s)`);

    let processedCount = 0;
    let errorCount = 0;

    for (const result of results) {
      // Extract messageId from various possible fields
      const messageId = result.messageId || result.message_id || result.bulkId || result.id;
      
      // Extract status from various possible fields
      const statusName = result.status?.name || 
                         result.status?.groupName || 
                         result.deliveryStatus || 
                         result.status ||
                         (typeof result.status === 'string' ? result.status : null);
      
      const errorDescription = result.status?.description || 
                               result.error?.description ||
                               result.error?.message ||
                               result.errorMessage;

      if (!messageId) {
        console.log(`[whatsapp-webhook][${requestId}] No messageId found in result:`, JSON.stringify(result));
        continue;
      }

      const statusKey = typeof statusName === 'string' ? statusName.toUpperCase() : 'UNKNOWN';
      console.log(`[whatsapp-webhook][${requestId}] Processing messageId: ${messageId}, status: ${statusName} (${statusKey})`);

      // Map the status
      const mappedStatus = statusMap[statusKey] || 'pending';

      // Find the log entry by external_message_id
      const { data: existingLog, error: findError } = await supabase
        .from('automation_logs')
        .select('id, status, user_id')
        .eq('external_message_id', messageId)
        .maybeSingle();

      if (findError) {
        console.error(`[whatsapp-webhook][${requestId}] Error finding log for messageId ${messageId}:`, findError.message);
        errorCount++;
        continue;
      }

      if (!existingLog) {
        // Try with meta_message_id as fallback
        const { data: fallbackLog, error: fallbackError } = await supabase
          .from('automation_logs')
          .select('id, status, user_id')
          .eq('meta_message_id', messageId)
          .maybeSingle();

        if (fallbackError || !fallbackLog) {
          console.log(`[whatsapp-webhook][${requestId}] Log entry not found for messageId ${messageId}`);
          continue;
        }

        // Use fallback log
        Object.assign(existingLog || {}, fallbackLog);
      }

      if (!existingLog) {
        console.log(`[whatsapp-webhook][${requestId}] No log entry found for messageId ${messageId}`);
        continue;
      }

      // Only update if the new status is "better" than the current one
      const statusOrder = ['pending', 'sent', 'delivered', 'read', 'failed'];
      const currentStatusIndex = statusOrder.indexOf(existingLog.status || 'pending');
      const newStatusIndex = statusOrder.indexOf(mappedStatus);

      // Allow update if new status is better, or if it's a failure status
      if (newStatusIndex > currentStatusIndex || mappedStatus === 'failed') {
        const updateData: Record<string, unknown> = {
          status: mappedStatus,
          updated_at: new Date().toISOString(),
        };

        if (mappedStatus === 'failed' && errorDescription) {
          updateData.error_message = errorDescription;
        }

        const { error: updateError } = await supabase
          .from('automation_logs')
          .update(updateData)
          .eq('id', existingLog.id);

        if (updateError) {
          console.error(`[whatsapp-webhook][${requestId}] Error updating log ${existingLog.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`[whatsapp-webhook][${requestId}] Updated log ${existingLog.id}: ${existingLog.status} -> ${mappedStatus}`);
          processedCount++;

          // Create notification for user if delivered or read
          if (mappedStatus === 'delivered' || mappedStatus === 'read') {
            await supabase.from('notifications').insert({
              user_id: existingLog.user_id,
              type: 'whatsapp_status',
              title: mappedStatus === 'delivered' ? 'Mensagem Entregue' : 'Mensagem Lida',
              message: `A sua mensagem WhatsApp foi ${mappedStatus === 'delivered' ? 'entregue' : 'lida'}.`,
              data: { log_id: existingLog.id, status: mappedStatus }
            });
          }
        }
      } else {
        console.log(`[whatsapp-webhook][${requestId}] Skipping update - current status (${existingLog.status}) is same or better than ${mappedStatus}`);
      }
    }

    console.log(`[whatsapp-webhook][${requestId}] Completed: ${processedCount} processed, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        requestId,
        processed: processedCount,
        errors: errorCount,
        total: results.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error(`[whatsapp-webhook][${requestId}] Error processing webhook:`, error);
    
    return new Response(
      JSON.stringify({ success: false, requestId, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
