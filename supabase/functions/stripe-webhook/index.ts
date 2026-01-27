import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

// Verify Stripe signature
async function verifyStripeSignature(payload: string, signature: string): Promise<boolean> {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));
    
    if (!timestampPart || !signaturePart) {
      console.error('Invalid signature format');
      return false;
    }

    const timestamp = timestampPart.split('=')[1];
    const expectedSignature = signaturePart.split('=')[1];
    
    // Check timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) {
      console.error('Timestamp too old');
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(STRIPE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedSignature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const payload = await req.text();

    console.log('Webhook received, verifying signature...');

    // Verify signature
    if (signature && STRIPE_WEBHOOK_SECRET) {
      const isValid = await verifyStripeSignature(payload, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const event = JSON.parse(payload);
    console.log('Processing event:', event.type);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        console.log('Checkout completed for:', customerEmail);

        if (!customerEmail) {
          console.error('No customer email found');
          break;
        }

        // Find user by email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail)
          .single();

        if (profileError || !profile) {
          console.error('User not found:', customerEmail);
          break;
        }

        const userId = profile.id;

        // Determine plan from metadata or price
        let plan: 'basic' | 'advanced' | 'pro_ai' = 'basic';
        const metadata = session.metadata || {};
        if (metadata.plan) {
          plan = metadata.plan as typeof plan;
        }

        // Check if lifetime purchase
        const isLifetime = metadata.is_lifetime === 'true' || session.mode === 'payment';

        if (isLifetime) {
          // Update profile with lifetime access
          await supabase
            .from('profiles')
            .update({ has_lifetime_access: true })
            .eq('id', userId);

          console.log('Lifetime access granted to:', userId);
        }

        // Upsert subscription record
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            plan: plan,
            is_lifetime: isLifetime,
            current_period_start: new Date().toISOString(),
            current_period_end: subscriptionId 
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (subError) {
          console.error('Error upserting subscription:', subError);
        } else {
          console.log('Subscription activated for:', userId);
        }

        // Create admin alert for new subscription
        await supabase.from('admin_alerts').insert({
          type: 'new_subscription',
          title: 'Nova Assinatura',
          message: `${customerEmail} assinou o plano ${plan.toUpperCase()}`,
          data: { user_id: userId, plan, email: customerEmail }
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        console.log('Subscription cancelled:', subscriptionId);

        // Find and update subscription
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (existingSub) {
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscriptionId);

          console.log('Subscription cancelled for user:', existingSub.user_id);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        const status = subscription.status;

        console.log('Subscription updated:', subscriptionId, 'Status:', status);

        let mappedStatus: 'active' | 'cancelled' | 'expired' | 'trial' = 'active';
        if (status === 'canceled' || status === 'unpaid') {
          mappedStatus = 'cancelled';
        } else if (status === 'past_due') {
          mappedStatus = 'expired';
        } else if (status === 'trialing') {
          mappedStatus = 'trial';
        }

        await supabase
          .from('subscriptions')
          .update({ 
            status: mappedStatus,
            current_period_start: subscription.current_period_start 
              ? new Date(subscription.current_period_start * 1000).toISOString()
              : null,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerEmail = invoice.customer_email;

        console.log('Payment failed for:', customerEmail);

        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscriptionId);

          // Create admin alert
          await supabase.from('admin_alerts').insert({
            type: 'payment_failed',
            title: 'Pagamento Falhou',
            message: `Falha no pagamento de ${customerEmail}`,
            data: { email: customerEmail, subscription_id: subscriptionId }
          });
        }

        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
