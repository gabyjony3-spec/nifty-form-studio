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
    const { websiteUrl, keywords, headline, industry, campaignId } = await req.json();

    if (!websiteUrl) {
      throw new Error("Website URL é obrigatório");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Create a prompt for ad image generation
    const imagePrompt = `Create a professional, high-quality advertisement image for a ${industry || 'business'} company.
    
Website: ${websiteUrl}
Headline: ${headline || 'Professional services for you'}
Keywords: ${keywords?.join(', ') || 'professional, modern, quality'}

Requirements:
- Modern, clean design suitable for Instagram/Facebook ads
- Vibrant colors that grab attention
- Professional and trustworthy aesthetic
- 1:1 aspect ratio (square format for social media)
- No text overlays - just visual imagery
- High-quality, photorealistic style
- Should evoke trust and professionalism

Style: Modern advertising photography, commercial quality, premium feel. Ultra high resolution.`;

    console.log("Generating image with prompt:", imagePrompt);

    // Call Lovable AI with image generation model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Image generation failed: ${errorText}`);
    }

    const data = await response.json();
    console.log("Image generation response received");

    // Extract the generated image
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract base64 data (remove data URL prefix if present)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate unique filename
    const fileName = `ad-images/${campaignId || crypto.randomUUID()}-${Date.now()}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars") // Using existing avatars bucket, can be changed
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log("Image uploaded successfully:", publicUrl);

    // If campaignId provided, update the campaign with the image URL
    if (campaignId) {
      const { error: updateError } = await supabase
        .from("ad_campaigns")
        .update({ 
          creative_url: publicUrl,
          // Store the prompt for regeneration
        })
        .eq("id", campaignId);

      if (updateError) {
        console.error("Update campaign error:", updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: publicUrl,
        prompt: imagePrompt
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-ad-image:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
