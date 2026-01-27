import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // 'instagram' or 'facebook'
    
    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    console.log(`Processing ${state} OAuth callback with code:`, code.substring(0, 10) + '...');

    // Get environment variables
    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      throw new Error('Facebook App credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get authenticated user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log('User authenticated:', user.id);

    // Build redirect URI
    const redirectUri = `${url.origin}/oauth/callback`;

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;
    
    console.log('Exchanging code for access token...');
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      throw new Error(tokenData.error?.message || 'Failed to exchange code for token');
    }

    console.log('Access token obtained successfully');

    let accountData;
    let platform = state;

    if (state === 'instagram') {
      // For Instagram, we need to get the user's Facebook pages first
      console.log('Fetching Facebook pages...');
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
      );
      const pagesData = await pagesResponse.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook pages found. You need a Facebook Page to connect Instagram Business account.');
      }

      const pageAccessToken = pagesData.data[0].access_token;
      const pageId = pagesData.data[0].id;

      // Get Instagram Business Account connected to the page
      console.log('Fetching Instagram Business account...');
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );
      const igData = await igResponse.json();

      if (!igData.instagram_business_account) {
        throw new Error('No Instagram Business account connected to this Facebook Page.');
      }

      const igAccountId = igData.instagram_business_account.id;

      // Get Instagram account details
      console.log('Fetching Instagram account details...');
      const igDetailsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}?fields=username,followers_count&access_token=${pageAccessToken}`
      );
      const igDetails = await igDetailsResponse.json();

      accountData = {
        account_id: igAccountId,
        account_name: igDetails.username,
        followers_count: igDetails.followers_count,
        access_token: pageAccessToken, // Store page access token for future API calls
      };
    } else {
      // For Facebook, get page information
      console.log('Fetching Facebook page details...');
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,followers_count&access_token=${tokenData.access_token}`
      );
      const pagesData = await pagesResponse.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook pages found');
      }

      const page = pagesData.data[0];
      accountData = {
        account_id: page.id,
        account_name: page.name,
        followers_count: page.followers_count || 0,
        access_token: page.access_token, // Store page access token
      };
    }

    // Save to database
    console.log(`Saving ${platform} account to database...`);
    const { data: existingAccount } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single();

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabase
        .from('social_accounts')
        .update({
          account_id: accountData.account_id,
          account_name: accountData.account_name,
          followers_count: accountData.followers_count,
          access_token: accountData.access_token,
          is_connected: true,
          connected_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
    } else {
      // Insert new account
      const { error: insertError } = await supabase
        .from('social_accounts')
        .insert({
          user_id: user.id,
          platform,
          account_id: accountData.account_id,
          account_name: accountData.account_name,
          followers_count: accountData.followers_count,
          access_token: accountData.access_token,
          is_connected: true,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
    }

    console.log(`${platform} account connected successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        platform,
        account_name: accountData.account_name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
