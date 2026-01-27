import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Loader2, Download, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  platform: string;
  score: number;
  strengths: string;
  weaknesses: string;
}

const AIImageGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [prompt, setPrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("modern");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: analysis } = await supabase
          .from("social_media_analysis")
          .select("platform, score, strengths, weaknesses")
          .eq("user_id", user.id)
          .order("analyzed_at", { ascending: false })
          .limit(1)
          .single();

        if (analysis) {
          setUserProfile(analysis);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Descrição Necessária",
        description: "Por favor, descreva a imagem que deseja criar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      // Build contextual prompt based on user profile
      let contextualPrompt = prompt;
      
      if (userProfile) {
        contextualPrompt = `${prompt}. 
Style: ${imageStyle} and professional.
Context: This is for social media marketing on ${userProfile.platform}.
Brand strengths to highlight: ${userProfile.strengths || "professional and trustworthy"}.
Aspect ratio: ${aspectRatio === "1:1" ? "Square" : aspectRatio === "16:9" ? "Landscape" : "Portrait"}.`;
      }

      const { data, error } = await supabase.functions.invoke("generate-post-image", {
        body: {
          prompt: contextualPrompt,
          style: imageStyle,
          aspectRatio,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({
          title: "Imagem Gerada!",
          description: "Sua imagem foi criada com sucesso.",
        });
      } else {
        throw new Error("Nenhuma imagem foi retornada");
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast({
        title: "Erro ao Gerar Imagem",
        description: error.message || "Ocorreu um erro ao gerar a imagem.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `ai-post-${Date.now()}.png`;
    link.target = "_blank";
    link.click();
  };

  const styleOptions = [
    { value: "modern", label: "Moderno e Clean" },
    { value: "vibrant", label: "Vibrante e Colorido" },
    { value: "minimal", label: "Minimalista" },
    { value: "corporate", label: "Corporativo" },
    { value: "creative", label: "Criativo e Artístico" },
    { value: "luxury", label: "Luxo e Premium" },
  ];

  const aspectRatioOptions = [
    { value: "1:1", label: "Quadrado (1:1) - Feed" },
    { value: "16:9", label: "Paisagem (16:9) - YouTube" },
    { value: "9:16", label: "Retrato (9:16) - Stories" },
  ];

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-cyan-800/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <ImageIcon className="h-5 w-5" />
          Gerador de Imagens IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : (
          <>
            {userProfile && (
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/30 rounded-lg">
                <p className="text-xs text-cyan-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Contexto carregado: {userProfile.platform} • Score: {userProfile.score}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-cyan-300">Descreva sua imagem</Label>
              <Textarea
                placeholder="Ex: Imagem para post sobre marketing digital com elementos tecnológicos e cores vibrantes..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-cyan-950/30 border-cyan-800/50 text-cyan-100 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-cyan-300">Estilo Visual</Label>
                <Select value={imageStyle} onValueChange={setImageStyle}>
                  <SelectTrigger className="bg-cyan-950/30 border-cyan-800/50 text-cyan-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-cyan-300">Proporção</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="bg-cyan-950/30 border-cyan-800/50 text-cyan-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatioOptions.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generateImage}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Imagem...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Imagem
                </>
              )}
            </Button>

            {generatedImage && (
              <div className="space-y-4 pt-4 border-t border-cyan-800/30">
                <div className="relative rounded-lg overflow-hidden bg-gray-800">
                  <img
                    src={generatedImage}
                    alt="Imagem Gerada"
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={downloadImage}
                    variant="outline"
                    className="flex-1 border-cyan-700 text-cyan-300 hover:bg-cyan-950/50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                  <Button
                    onClick={() => {
                      setGeneratedImage(null);
                      generateImage();
                    }}
                    variant="outline"
                    className="flex-1 border-cyan-700 text-cyan-300 hover:bg-cyan-950/50"
                    disabled={loading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerar
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIImageGenerator;
