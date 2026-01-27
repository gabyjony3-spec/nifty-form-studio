import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map Meta status to internal status
const META_STATUS_MAP: Record<string, string> = {
  'sent': 'sent',
  'delivered': 'delivered',
  'read': 'read',
  'failed': 'failed',
  'deleted': 'deleted'
};

// Status priority for updates (only update if new status is higher priority)
const STATUS_PRIORITY: Record<string, number> = {
  'pending': 0,
  'sent': 1,
  'delivered': 2,
  'read': 3,
  'failed': 4,
  'deleted': 5
};

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Handle webhook verification (GET request from Meta)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log("[meta-webhook] Verification request:", { mode, token });

    if (mode === 'subscribe' && token) {
      // Find company with matching verify token
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('webhook_verify_token', token)
        .single();

      if (company) {
        console.log("[meta-webhook] Verification successful for company:", company.name);
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        console.error("[meta-webhook] Invalid verify token:", token);
        return new Response('Forbidden', { status: 403 });
      }
    }

    return new Response('Bad Request', { status: 400 });
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle webhook events (POST request from Meta)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log("[meta-webhook] Webhook received:", JSON.stringify(body, null, 2));

      // Process Meta webhook payload
      const entry = body.entry?.[0];
      if (!entry) {
        console.log("[meta-webhook] No entry in webhook payload");
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      const changes = entry.changes?.[0];
      if (!changes) {
        console.log("[meta-webhook] No changes in webhook payload");
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      const value = changes.value;

      // Process message status updates
      if (value?.statuses && Array.isArray(value.statuses)) {
        for (const status of value.statuses) {
          const metaMessageId = status.id;
          const recipientId = status.recipient_id;
          const statusName = status.status;
          const timestamp = status.timestamp;
          const errorInfo = status.errors?.[0];

          console.log("[meta-webhook] Processing status:", { metaMessageId, statusName, recipientId });

          const mappedStatus = META_STATUS_MAP[statusName] || statusName;

          // Find and update the log entry
          const { data: existingLog, error: findError } = await supabase
            .from('automation_logs')
            .select('id, status')
            .eq('meta_message_id', metaMessageId)
            .single();

          if (findError || !existingLog) {
            console.log("[meta-webhook] Log entry not found for message:", metaMessageId);
            continue;
          }

          // Only update if new status has higher priority (prevents downgrade)
          const currentPriority = STATUS_PRIORITY[existingLog.status] || 0;
          const newPriority = STATUS_PRIORITY[mappedStatus] || 0;

          if (newPriority > currentPriority || mappedStatus === 'failed') {
            const updateData: Record<string, unknown> = {
              status: mappedStatus,
              updated_at: new Date().toISOString()
            };

            if (errorInfo) {
              updateData.error_message = `${errorInfo.code}: ${errorInfo.title} - ${errorInfo.message}`;
            }

            const { error: updateError } = await supabase
              .from('automation_logs')
              .update(updateData)
              .eq('id', existingLog.id);

            if (updateError) {
              console.error("[meta-webhook] Error updating log:", updateError);
            } else {
              console.log("[meta-webhook] Log updated:", existingLog.id, "->", mappedStatus);
            }
          } else {
            console.log("[meta-webhook] Skipping update (lower priority):", existingLog.status, "->", mappedStatus);
          }
        }
      }

      // Process incoming messages (if needed in the future)
      if (value?.messages && Array.isArray(value.messages)) {
        for (const message of value.messages) {
          console.log("[meta-webhook] Incoming message received:", {
            from: message.from,
            type: message.type,
            timestamp: message.timestamp
          });
          
          // TODO: Implement incoming message handling
          // This could trigger auto-replies, store conversations, etc.
        }
      }

      return new Response('OK', { status: 200, headers: corsHeaders });

    } catch (error) {
      console.error("[meta-webhook] Error processing webhook:", error);
      // Return 200 to prevent Meta from retrying
      return new Response('OK', { status: 200, headers: corsHeaders });
    }
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
});
