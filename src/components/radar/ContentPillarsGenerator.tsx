import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, MessageCircle, DollarSign, Copy, Check, Wand2, FileDown, ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoldenSpinner } from "@/components/ui/GoldenSpinner";
import jsPDF from "jspdf";

interface ContentPillar {
  type: "autoridade" | "conexao" | "conversao";
  title: string;
  caption: string;
  postType: string;
  icon: string;
  description: string;
}

interface ContentPillarsGeneratorProps {
  bio?: string;
  niche?: string;
  onGenerate?: (pillars: ContentPillar[]) => void;
}

const pillarConfig = {
  autoridade: {
    label: "AUTORIDADE",
    description: "Conteúdo técnico que prova expertise",
    icon: BookOpen,
    color: "cyan",
    emoji: "📚",
  },
  conexao: {
    label: "CONEXÃO",
    description: "Histórias pessoais para gerar confiança",
    icon: MessageCircle,
    color: "purple",
    emoji: "💬",
  },
  conversao: {
    label: "CONVERSÃO",
    description: "Chamada direta para ação/venda",
    icon: DollarSign,
    color: "green",
    emoji: "💰",
  },
};

export function ContentPillarsGenerator({ bio, niche, onGenerate }: ContentPillarsGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content-pillars", {
        body: { bio, niche }
      });

      if (error) throw error;

      if (data?.pillars) {
        setPillars(data.pillars);
        onGenerate?.(data.pillars);
        toast.success("Método de 3 Pilares gerado com sucesso!");
      }
    } catch (error) {
      console.error("Error generating pillars:", error);
      toast.error("Erro ao gerar pilares. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (pillar: ContentPillar, index: number) => {
    const text = `${pillar.title}\n\n${pillar.caption}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (pillars.length === 0) return;
    
    const allText = pillars.map((pillar, index) => {
      const config = pillarConfig[pillar.type];
      return `📌 PILAR ${index + 1}: ${config.label}\n${config.emoji} Tipo: ${pillar.postType}\n\n📝 Título:\n${pillar.title}\n\n✍️ Legenda:\n${pillar.caption}`;
    }).join('\n\n' + '═'.repeat(50) + '\n\n');
    
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    toast.success("Todos os 3 pilares copiados!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportPDF = () => {
    if (pillars.length === 0) return;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Title
    pdf.setFontSize(22);
    pdf.setTextColor(245, 158, 11); // Amber color
    pdf.text("Método de 3 Pilares de Conteúdo", pageWidth / 2, 25, { align: "center" });
    
    // Subtitle with niche
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Nicho: ${niche || "Marketing Digital"}`, pageWidth / 2, 35, { align: "center" });
    
    let yPosition = 50;
    
    pillars.forEach((pillar, index) => {
      const config = pillarConfig[pillar.type];
      
      // Check if we need a new page
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 25;
      }
      
      // Pillar header
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${config.emoji} PILAR ${index + 1}: ${config.label}`, 15, yPosition);
      yPosition += 8;
      
      // Post type
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Tipo de post: ${pillar.postType}`, 15, yPosition);
      yPosition += 10;
      
      // Title
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Título:", 15, yPosition);
      yPosition += 6;
      
      pdf.setFontSize(11);
      const titleLines = pdf.splitTextToSize(pillar.title, pageWidth - 30);
      pdf.text(titleLines, 15, yPosition);
      yPosition += titleLines.length * 6 + 5;
      
      // Caption
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Legenda:", 15, yPosition);
      yPosition += 6;
      
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const captionLines = pdf.splitTextToSize(pillar.caption, pageWidth - 30);
      pdf.text(captionLines, 15, yPosition);
      yPosition += captionLines.length * 5 + 15;
      
      // Separator line
      if (index < pillars.length - 1) {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition - 5, pageWidth - 15, yPosition - 5);
        yPosition += 5;
      }
    });
    
    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} | Radar de Nicho IA`, pageWidth / 2, 285, { align: "center" });
    
    pdf.save(`metodo-3-pilares-${niche?.replace(/\s+/g, '-') || 'conteudo'}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  const PillarIcon = ({ type }: { type: keyof typeof pillarConfig }) => {
    const Icon = pillarConfig[type].icon;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Wand2 className="h-5 w-5 text-amber-400" />
            Método de 3 Pilares IA
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
          >
            {isLoading ? (
              <GoldenSpinner size="sm" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                GERAR MÉTODO AGORA
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <GoldenSpinner size="lg" message="A IA está a criar o seu método personalizado..." />
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Badge variant="outline" className="border-amber-500/30 text-amber-300">
                  Analisando bio...
                </Badge>
                <Badge variant="outline" className="border-amber-500/30 text-amber-300">
                  Detectando nicho...
                </Badge>
              </motion.div>
            </motion.div>
          ) : pillars.length > 0 ? (
            <motion.div
              key="pillars"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Com base no seu nicho <Badge variant="outline" className="ml-1">{niche || "Marketing Digital"}</Badge>, sugerimos:
                </p>
                
                {/* Export buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-cyan-500/30 hover:bg-cyan-500/10"
                    onClick={handleCopyAll}
                  >
                    {copiedAll ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <ClipboardCopy className="h-3.5 w-3.5" />
                    )}
                    Copiar Tudo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-amber-500/30 hover:bg-amber-500/10"
                    onClick={handleExportPDF}
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Exportar PDF
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {pillars.map((pillar, index) => {
                  const config = pillarConfig[pillar.type];
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="group relative"
                    >
                      <div className={`p-4 rounded-lg border transition-all
                        ${pillar.type === 'autoridade' ? 'bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-500/50' : ''}
                        ${pillar.type === 'conexao' ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/50' : ''}
                        ${pillar.type === 'conversao' ? 'bg-green-950/20 border-green-500/30 hover:border-green-500/50' : ''}
                      `}>
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                            ${pillar.type === 'autoridade' ? 'bg-cyan-500/20 text-cyan-400' : ''}
                            ${pillar.type === 'conexao' ? 'bg-purple-500/20 text-purple-400' : ''}
                            ${pillar.type === 'conversao' ? 'bg-green-500/20 text-green-400' : ''}
                          `}>
                            <span className="text-2xl">{config.emoji}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs
                                ${pillar.type === 'autoridade' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : ''}
                                ${pillar.type === 'conexao' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : ''}
                                ${pillar.type === 'conversao' ? 'bg-green-500/20 text-green-300 border-green-500/30' : ''}
                              `}>
                                PILAR {index + 1}: {config.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                {pillar.postType}
                              </Badge>
                            </div>

                            <p className="font-semibold text-white text-sm">
                              {pillar.title}
                            </p>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {pillar.caption}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                            onClick={() => handleCopy(pillar, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Wand2 className="h-12 w-12 mx-auto mb-4 text-amber-500/50" />
              <p className="text-sm">
                Clique em "GERAR MÉTODO AGORA" para criar seu plano de conteúdo baseado nos 3 pilares:
              </p>
              <div className="flex justify-center gap-4 mt-4">
                {Object.entries(pillarConfig).map(([key, config]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {config.emoji} {config.label}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
