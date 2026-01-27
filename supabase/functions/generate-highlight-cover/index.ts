import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { highlight_name, niche, colors, icon } = await req.json();

    if (!highlight_name) {
      return new Response(
        JSON.stringify({ error: "highlight_name is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-highlight-cover] Generating cover for: ${highlight_name}, niche: ${niche}`);

    // Build the prompt for generating a highlight cover
    const colorPalette = colors?.join(", ") || "#1E3A8A, #3B82F6, #FBBF24";
    const prompt = `Create a minimalist Instagram highlight cover icon for "${highlight_name}". 
Style: Modern, clean, circular design suitable for Instagram highlights.
Theme: ${niche || "Professional business"}
Icon suggestion: ${icon || "relevant icon for the topic"}
Color palette: ${colorPalette}
Background: Solid or subtle gradient using the main colors.
The design should be simple, with a single centered icon or symbol.
No text, just the icon/symbol.
Square format, 1:1 aspect ratio.
High quality, vector-like appearance.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-highlight-cover] AI API error: ${errorText}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    console.log(`[generate-highlight-cover] Successfully generated cover for: ${highlight_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        highlight_name,
        image_url: imageUrl,
        message: `Cover generated for "${highlight_name}"`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[generate-highlight-cover] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
