import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Wand2, Copy, Loader2, Video, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { useCredits } from "@/hooks/useCredits";
import { CreditExhaustedModal } from "@/components/credits/CreditExhaustedModal";

interface Weakness {
  id: string;
  text: string;
}

interface OneClickPostProps {
  weaknesses?: Weakness[] | null;
  niche?: string | null;
}

export function OneClickPost({ weaknesses: propWeaknesses, niche }: OneClickPostProps) {
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [selectedWeakness, setSelectedWeakness] = useState<Weakness | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const { credits, plan, consumeCredit, checkCredits, showUpgradeModal, setShowUpgradeModal } = useCredits();

  useEffect(() => {
    const loadWeaknesses = async () => {
      setIsLoading(true);
      try {
        if (propWeaknesses && propWeaknesses.length > 0) {
          setWeaknesses(propWeaknesses);
          setIsLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: analysis } = await supabase
          .from("social_media_analysis")
          .select("weaknesses")
          .eq("user_id", user.id)
          .order("analyzed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (analysis?.weaknesses) {
          const parsedWeaknesses = analysis.weaknesses
            .split(/[.;\n]/)
            .filter((w: string) => w.trim().length > 10)
            .slice(0, 5)
            .map((w: string, i: number) => ({
              id: `real-${i}`,
              text: w.trim()
            }));
          
          if (parsedWeaknesses.length > 0) {
            setWeaknesses(parsedWeaknesses);
          }
        }
      } catch (error) {
        console.error("Error loading weaknesses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeaknesses();
  }, [propWeaknesses]);

  const generateScript = async (weakness: Weakness) => {
    // Check credits before generating
    if (!checkCredits(1)) {
      return;
    }

    setSelectedWeakness(weakness);
    setIsGenerating(true);
    setGeneratedScript("");

    try {
      const nicheContext = niche ? ` no nicho de ${niche}` : "";
      
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Crie um roteiro de vídeo curto (Reel/TikTok de 30-60 segundos)${nicheContext} que aborda a seguinte fraqueza identificada em um perfil: "${weakness.text}"
          
O roteiro deve ter:
1. HOOK (3 segundos): Frase de abertura impactante
2. PROBLEMA (5 segundos): Mencionar o problema que muitos têm
3. SOLUÇÃO (15-20 segundos): Explicar como resolver
4. CTA (5 segundos): Chamada para ação

Responda APENAS com o roteiro formatado, sem JSON, pronto para ser gravado.
Use linguagem direta e conversacional.`
          }]
        },
      });

      if (error) throw error;

      const script = data.response || data.generatedText || "";
      if (script && script.length > 50) {
        // Consume credit on success
        await consumeCredit(1);
        setGeneratedScript(script);
        toast.success("Roteiro gerado com sucesso!");
      } else {
        throw new Error("Resposta vazia");
      }
    } catch (error) {
      console.error("Error generating script:", error);
      
      // Fallback script (still consume credit)
      await consumeCredit(1);
      setGeneratedScript(`🎬 ROTEIRO DE VÍDEO - "${weakness.text}"

🔥 HOOK (0-3s):
"Você está cometendo esse erro no seu Instagram?"

❌ PROBLEMA (3-8s):
"A maioria das pessoas ${weakness.text.toLowerCase()}, e isso está prejudicando o crescimento do perfil."

✅ SOLUÇÃO (8-25s):
"A solução é simples:
1. Primeiro, analise seu perfil como se fosse um visitante novo
2. Pergunte-se: 'Em 3 segundos, eu entendo o que esse perfil oferece?'
3. Faça os ajustes necessários para clareza máxima
4. Teste com alguém que não conhece seu trabalho"

📢 CTA (25-30s):
"Salva esse vídeo e me conta nos comentários: qual dessas dicas você vai aplicar primeiro?"`);
      
      toast.success("Roteiro de exemplo gerado!");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    toast.success("Roteiro copiado!");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Gerador One-Click Post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (weaknesses.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Wand2 className="h-5 w-5" />
            Gerador One-Click Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 waiting-state">
            <div className="w-16 h-16 rounded-full bg-cyan-950/30 border-2 border-dashed border-cyan-800/50 flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8 text-cyan-700/50" />
            </div>
            <p className="text-sm text-cyan-300/70 font-medium mb-2">
              Aguardando análise de perfil...
            </p>
            <p className="text-xs text-muted-foreground">
              Analise um perfil para identificar pontos de melhoria e gerar roteiros automaticamente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Gerador One-Click Post
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {credits === 9999 ? "∞" : credits} créditos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Transforme fraquezas identificadas em roteiros de vídeo prontos para gravar (1 crédito):
            </p>
            
            <div className="space-y-2">
              {weaknesses.map((weakness) => (
                <div
                  key={weakness.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedWeakness?.id === weakness.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => !isGenerating && generateScript(weakness)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/30">
                      Fraqueza
                    </Badge>
                    <span className="text-sm">{weakness.text}</span>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isGenerating}
                    onClick={(e) => {
                      e.stopPropagation();
                      generateScript(weakness);
                    }}
                  >
                    {isGenerating && selectedWeakness?.id === weakness.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {generatedScript && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Roteiro Gerado</span>
                </div>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              
              <Textarea
                value={generatedScript}
                readOnly
                className="min-h-[300px] font-mono text-sm"
              />
              
              <p className="text-xs text-muted-foreground">
                💡 Dica: Grave este vídeo em formato vertical (9:16) para melhor performance
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <CreditExhaustedModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </>
  );
}
