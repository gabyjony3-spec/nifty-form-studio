import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface SocialAnalysis {
  id: string;
  platform: string;
  score: number;
  engagement_rate: number;
  followers: number;
  post_frequency: string;
  strengths: string;
  weaknesses: string;
  suggestions: string;
  analyzed_at: string;
}

interface WebsiteAnalysis {
  id: string;
  url: string;
  overall_score: number;
  seo_score: number;
  speed_score: number;
  structure_score: number;
  copywriting_score: number;
  conversion_score: number;
  recommendations: string;
  analyzed_at: string;
}

const FullReportPdfExport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [socialAnalyses, setSocialAnalyses] = useState<SocialAnalysis[]>([]);
  const [websiteAnalyses, setWebsiteAnalyses] = useState<WebsiteAnalysis[]>([]);

  useEffect(() => {
    const fetchAnalyses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch social media analyses
      const { data: social } = await supabase
        .from("social_media_analysis")
        .select("*")
        .eq("user_id", user.id)
        .order("analyzed_at", { ascending: false });

      if (social) {
        setSocialAnalyses(social);
      }

      // Fetch website analyses
      const { data: website } = await supabase
        .from("website_analysis")
        .select("*")
        .eq("user_id", user.id)
        .order("analyzed_at", { ascending: false });

      if (website) {
        setWebsiteAnalyses(website);
      }
    };

    fetchAnalyses();
  }, []);

  const generatePDF = async () => {
    if (socialAnalyses.length === 0 && websiteAnalyses.length === 0) {
      toast({
        title: "Sem Dados",
        description: "Não há análises disponíveis para exportar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Helper function to add new page if needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > 280) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Helper to wrap text
      const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number = 10) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          checkNewPage(6);
          doc.text(line, x, yPos);
          yPos += 5;
        });
      };

      // Title
      doc.setFontSize(24);
      doc.setTextColor(0, 188, 212); // Cyan
      doc.text("Relatório Completo de Análise", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, yPos, { align: "center" });
      yPos += 20;

      // Social Media Section
      if (socialAnalyses.length > 0) {
        doc.setFontSize(18);
        doc.setTextColor(0, 150, 200);
        doc.text("Análise de Redes Sociais", 14, yPos);
        yPos += 10;

        socialAnalyses.forEach((analysis, index) => {
          checkNewPage(60);

          // Platform Header
          doc.setFillColor(0, 50, 70);
          doc.rect(14, yPos - 5, pageWidth - 28, 10, "F");
          doc.setFontSize(14);
          doc.setTextColor(0, 200, 230);
          doc.text(`${analysis.platform.toUpperCase()}`, 18, yPos + 2);
          yPos += 12;

          // Metrics
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          
          doc.text(`Pontuação: ${analysis.score || 0}/100`, 18, yPos);
          yPos += 6;
          
          doc.text(`Taxa de Engajamento: ${analysis.engagement_rate || 0}%`, 18, yPos);
          yPos += 6;
          
          doc.text(`Seguidores: ${(analysis.followers || 0).toLocaleString("pt-BR")}`, 18, yPos);
          yPos += 6;
          
          doc.text(`Frequência de Posts: ${analysis.post_frequency || "N/A"}`, 18, yPos);
          yPos += 10;

          // Strengths
          if (analysis.strengths) {
            doc.setTextColor(0, 150, 100);
            doc.text("Pontos Fortes:", 18, yPos);
            yPos += 5;
            doc.setTextColor(60, 60, 60);
            addWrappedText(analysis.strengths, 22, pageWidth - 50);
            yPos += 5;
          }

          // Weaknesses
          if (analysis.weaknesses) {
            checkNewPage(20);
            doc.setTextColor(200, 100, 0);
            doc.text("Pontos a Melhorar:", 18, yPos);
            yPos += 5;
            doc.setTextColor(60, 60, 60);
            addWrappedText(analysis.weaknesses, 22, pageWidth - 50);
            yPos += 5;
          }

          // Suggestions
          if (analysis.suggestions) {
            checkNewPage(20);
            doc.setTextColor(0, 100, 200);
            doc.text("Sugestões:", 18, yPos);
            yPos += 5;
            doc.setTextColor(60, 60, 60);
            addWrappedText(analysis.suggestions, 22, pageWidth - 50);
            yPos += 5;
          }

          yPos += 10;

          // Separator
          if (index < socialAnalyses.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPos, pageWidth - 14, yPos);
            yPos += 10;
          }
        });
      }

      // Website Section
      if (websiteAnalyses.length > 0) {
        checkNewPage(40);
        yPos += 10;

        doc.setFontSize(18);
        doc.setTextColor(0, 150, 200);
        doc.text("Análise de Website", 14, yPos);
        yPos += 15;

        websiteAnalyses.forEach((analysis, index) => {
          checkNewPage(80);

          // Website Header
          doc.setFillColor(0, 50, 70);
          doc.rect(14, yPos - 5, pageWidth - 28, 10, "F");
          doc.setFontSize(12);
          doc.setTextColor(0, 200, 230);
          doc.text(analysis.url, 18, yPos + 2);
          yPos += 15;

          // Scores Grid
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);

          const scores = [
            { label: "Pontuação Geral", value: analysis.overall_score },
            { label: "SEO", value: analysis.seo_score },
            { label: "Velocidade", value: analysis.speed_score },
            { label: "Estrutura", value: analysis.structure_score },
            { label: "Copywriting", value: analysis.copywriting_score },
            { label: "Conversão", value: analysis.conversion_score },
          ];

          scores.forEach((score, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const xPos = 18 + col * 60;
            
            if (col === 0 && row > 0) {
              yPos += 12;
            }
            
            const scoreColor = (score.value || 0) >= 70 ? [0, 150, 100] : 
                             (score.value || 0) >= 40 ? [200, 150, 0] : [200, 50, 50];
            doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
            doc.text(`${score.label}: ${score.value || 0}`, xPos, yPos);
          });

          yPos += 15;

          // Recommendations
          if (analysis.recommendations) {
            doc.setTextColor(0, 100, 200);
            doc.text("Recomendações:", 18, yPos);
            yPos += 5;
            doc.setTextColor(60, 60, 60);
            addWrappedText(analysis.recommendations, 22, pageWidth - 50);
          }

          yPos += 15;

          // Separator
          if (index < websiteAnalyses.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPos, pageWidth - 14, yPos);
            yPos += 10;
          }
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `AI INsight • Página ${i} de ${pageCount}`,
          pageWidth / 2,
          290,
          { align: "center" }
        );
      }

      // Save PDF
      doc.save(`relatorio-completo-${new Date().toISOString().split("T")[0]}.pdf`);

      toast({
        title: "PDF Gerado!",
        description: "O relatório completo foi baixado com sucesso.",
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erro ao Gerar PDF",
        description: "Ocorreu um erro ao gerar o relatório.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAnalyses = socialAnalyses.length + websiteAnalyses.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar Relatório Completo
          </h3>
          <p className="text-sm text-cyan-300/70 mt-1">
            {totalAnalyses} análise(s) disponível(is) para exportar
          </p>
        </div>

        <Button
          onClick={generatePDF}
          disabled={loading || totalAnalyses === 0}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </>
          )}
        </Button>
      </div>

      {totalAnalyses === 0 && (
        <p className="text-center text-cyan-500/50 py-4">
          Faça análises de redes sociais ou website para gerar um relatório.
        </p>
      )}
    </div>
  );
};

export default FullReportPdfExport;
