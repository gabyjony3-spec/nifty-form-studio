import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style, aspectRatio } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Image generation service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine image dimensions based on aspect ratio
    let width = 1024;
    let height = 1024;

    if (aspectRatio === "16:9") {
      width = 1920;
      height = 1080;
    } else if (aspectRatio === "9:16") {
      width = 1080;
      height = 1920;
    }

    // Build enhanced prompt for better image generation
    const enhancedPrompt = `Professional social media post image: ${prompt}. 
Style: ${style || "modern"}, high quality, professional photography, perfect for marketing, 
clean design, visually appealing, suitable for business use. Ultra high resolution.`;

    console.log("Generating image with prompt:", enhancedPrompt);
    console.log("Dimensions:", width, "x", height);

    // Call Lovable AI API for image generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Lovable API response received");

    // Extract image from response - new format with images array
    let imageUrl: string | null = null;

    // Check for images array first (new format)
    if (data.choices && data.choices[0]?.message?.images) {
      const images = data.choices[0].message.images;
      if (images.length > 0 && images[0]?.image_url?.url) {
        const base64Image = images[0].image_url.url;
        
        // Upload to Supabase Storage if configured
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseServiceKey && base64Image.startsWith("data:image")) {
          try {
            const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
            
            // Extract base64 data
            const base64Data = base64Image.split(",")[1];
            const imageData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const fileName = `generated-post-${Date.now()}.png`;
            
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
              .from("avatars")
              .upload(`posts/${fileName}`, imageData, {
                contentType: "image/png",
                upsert: true,
              });

            if (uploadError) {
              console.error("Upload error:", uploadError);
              imageUrl = base64Image; // Use data URL as fallback
            } else {
              const { data: urlData } = supabaseClient.storage
                .from("avatars")
                .getPublicUrl(`posts/${fileName}`);
              
              imageUrl = urlData.publicUrl;
            }
          } catch (uploadErr) {
            console.error("Upload processing error:", uploadErr);
            imageUrl = base64Image;
          }
        } else {
          imageUrl = base64Image;
        }
      }
    }
    
    // Fallback: check old format with content array
    if (!imageUrl && data.choices && data.choices[0]?.message?.content) {
      const content = data.choices[0].message.content;
      
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === "image" && item.data) {
            imageUrl = `data:image/png;base64,${item.data}`;
            break;
          }
        }
      }
    }

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      return new Response(
        JSON.stringify({ error: "No image was generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Image generated successfully");

    return new Response(
      JSON.stringify({ imageUrl, prompt: enhancedPrompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in generate-post-image:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
