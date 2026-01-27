import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronDown, ChevronUp, Copy, Sparkles, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface HighlightWithScript {
  name: string;
  objective: string;
  order: number;
  icon?: string;
  cover_text?: string;
  stories_script?: string[];
  generated_cover?: string;
}

interface ProfitableHighlightsProps {
  highlights?: HighlightWithScript[];
  niche?: string;
  colors?: string[];
  onGenerateCovers?: () => void;
}

const DEFAULT_HIGHLIGHTS: HighlightWithScript[] = [
  {
    name: "COMECE AQUI",
    objective: "Apresentar quem você é e o que oferece",
    order: 1,
    icon: "👋",
    stories_script: [
      "Olá! Seja bem-vindo ao meu perfil. Sou [seu nome] e ajudo [público] a [transformação].",
      "Aqui você vai encontrar conteúdo sobre [tema 1], [tema 2] e [tema 3].",
      "Para começar, clique no link da bio e [CTA específica]."
    ]
  },
  {
    name: "RESULTADOS",
    objective: "Prova social com depoimentos reais",
    order: 2,
    icon: "⭐",
    stories_script: [
      "Veja o que os nossos clientes estão conquistando...",
      "[Nome] conseguiu [resultado específico] em [tempo]",
      "Quer resultados assim? Fale connosco pelo link na bio!"
    ]
  },
  {
    name: "SERVIÇOS",
    objective: "Mostrar o que você oferece",
    order: 3,
    icon: "🎯",
    stories_script: [
      "Conheça os nossos serviços/produtos:",
      "[Serviço 1]: Para quem quer [benefício]. [Serviço 2]: Para quem busca [benefício].",
      "Qual faz mais sentido para você? Responda aqui!"
    ]
  },
  {
    name: "DÚVIDAS",
    objective: "Responder perguntas frequentes",
    order: 4,
    icon: "❓",
    stories_script: [
      "Perguntas que mais recebo:",
      "P: [Pergunta comum]? R: [Resposta objetiva]",
      "Tem outra dúvida? Envie uma mensagem!"
    ]
  },
  {
    name: "CONTATO",
    objective: "Facilitar o contacto direto",
    order: 5,
    icon: "📞",
    stories_script: [
      "Quer falar diretamente comigo?",
      "WhatsApp: [número] | Email: [email]",
      "Ou simplesmente clique no link da bio!"
    ]
  }
];

export function ProfitableHighlights({ highlights, niche, colors, onGenerateCovers }: ProfitableHighlightsProps) {
  const [expandedHighlight, setExpandedHighlight] = useState<number | null>(null);
  const [generatingCovers, setGeneratingCovers] = useState(false);
  const [generatedCovers, setGeneratedCovers] = useState<Record<string, string>>({});
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  
  const displayHighlights = highlights && highlights.length > 0 ? highlights : DEFAULT_HIGHLIGHTS;

  const handleCopyScript = (scripts: string[]) => {
    const fullScript = scripts.join("\n\n");
    navigator.clipboard.writeText(fullScript);
    toast.success("Roteiro copiado!");
  };

  const toggleExpand = (order: number) => {
    setExpandedHighlight(expandedHighlight === order ? null : order);
  };

  const generateSingleCover = async (highlight: HighlightWithScript) => {
    setGeneratingFor(highlight.name);
    try {
      const { data, error } = await supabase.functions.invoke("generate-highlight-cover", {
        body: {
          highlight_name: highlight.name,
          niche: niche || "Professional",
          colors: colors || ["#1E3A8A", "#3B82F6", "#FBBF24"],
          icon: highlight.icon
        }
      });

      if (error) throw error;
      
      if (data?.image_url) {
        setGeneratedCovers(prev => ({
          ...prev,
          [highlight.name]: data.image_url
        }));
        toast.success(`Capa gerada para "${highlight.name}"!`);
      }
    } catch (error: any) {
      console.error("Error generating cover:", error);
      if (error.message?.includes("429")) {
        toast.error("Limite de requisições atingido. Tente novamente em alguns segundos.");
      } else if (error.message?.includes("402")) {
        toast.error("Créditos insuficientes para gerar imagens.");
      } else {
        toast.error("Erro ao gerar capa. Tente novamente.");
      }
    } finally {
      setGeneratingFor(null);
    }
  };

  const generateAllCovers = async () => {
    setGeneratingCovers(true);
    toast.info("Gerando capas para todos os destaques...");
    
    for (const highlight of displayHighlights) {
      if (!generatedCovers[highlight.name]) {
        await generateSingleCover(highlight);
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    setGeneratingCovers(false);
    toast.success("Todas as capas foram geradas!");
  };

  const downloadCover = (name: string, imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `highlight-cover-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download iniciado!");
  };

  return (
    <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/10 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.1)]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Star className="h-5 w-5" />
            Estratégia de Destaques Lucrativos
          </div>
          {niche && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50">
              {niche}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Organize os seus destaques assim para converter seguidores em clientes:
        </p>

        <div className="space-y-3">
          {displayHighlights.sort((a, b) => a.order - b.order).map((highlight, index) => (
            <motion.div
              key={highlight.order}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-amber-500/20 rounded-lg overflow-hidden"
            >
              {/* Highlight Header */}
              <button
                onClick={() => toggleExpand(highlight.order)}
                className="w-full p-3 flex items-center justify-between hover:bg-amber-500/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Show generated cover or default icon */}
                  {generatedCovers[highlight.name] ? (
                    <img 
                      src={generatedCovers[highlight.name]} 
                      alt={highlight.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/50"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center text-lg">
                      {highlight.icon || "📌"}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium text-sm text-white">{highlight.name}</p>
                    <p className="text-xs text-muted-foreground">{highlight.objective}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                    #{highlight.order}
                  </Badge>
                  {expandedHighlight === highlight.order ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Scripts */}
              <AnimatePresence>
                {expandedHighlight === highlight.order && highlight.stories_script && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-0 space-y-3 border-t border-amber-500/10">
                      <p className="text-xs text-muted-foreground font-medium">
                        Roteiro de 3 Stories:
                      </p>
                      <div className="space-y-2">
                        {highlight.stories_script.map((script, scriptIndex) => (
                          <div
                            key={scriptIndex}
                            className="flex items-start gap-2 p-2 rounded bg-amber-500/5"
                          >
                            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 shrink-0">
                              {scriptIndex + 1}
                            </Badge>
                            <p className="text-xs text-muted-foreground">{script}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-300"
                          onClick={() => handleCopyScript(highlight.stories_script!)}
                        >
                          <Copy className="h-3 w-3" />
                          Copiar Roteiro
                        </Button>
                        
                        {generatedCovers[highlight.name] ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 text-xs border-green-500/30 hover:bg-green-500/10 text-green-300"
                            onClick={() => downloadCover(highlight.name, generatedCovers[highlight.name])}
                          >
                            <Download className="h-3 w-3" />
                            Baixar Capa
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 text-xs border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-300"
                            onClick={() => generateSingleCover(highlight)}
                            disabled={generatingFor === highlight.name}
                          >
                            {generatingFor === highlight.name ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            Gerar Capa
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* AI Tip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-amber-400">Dica da IA:</strong> Atualize o destaque "Comece Aqui" mensalmente 
              com o seu conteúdo mais recente. Mantenha cada destaque com 5-10 stories para não sobrecarregar.
            </p>
          </div>
        </motion.div>

        {/* Generate All Covers Button */}
        <Button
          className="w-full gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
          onClick={generateAllCovers}
          disabled={generatingCovers}
        >
          {generatingCovers ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando Capas...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar Todas as Capas com IA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
