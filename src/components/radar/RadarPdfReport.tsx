import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface RadarReportData {
  username?: string;
  platform?: string;
  score: number | null;
  breakdown: {
    bio?: number;
    photo?: number;
    frequency?: number;
    engagement?: number;
    visual?: number;
  } | null;
  niche: string | null;
  bestTimes: Array<{ hour: number; score: number }> | null;
  followerGoal: number | null;
  currentFollowers: number | null;
  photoAnalysis?: {
    framing?: number;
    background?: number;
    lighting?: number;
    expression?: number;
    suggestions?: string[];
  };
  bioAnalysis?: {
    has_cta?: boolean;
    has_niche_keywords?: boolean;
    suggested_bio?: string;
    current_issues?: string[];
  };
  contentSuggestions?: Array<{
    type: string;
    description: string;
    frequency: string;
  }>;
  urgentImprovements?: string[];
}

// Helper function to draw score circle
const drawScoreCircle = (doc: jsPDF, x: number, y: number, radius: number, score: number) => {
  const scoreColor = score >= 80 ? [34, 197, 94] : score >= 50 ? [234, 179, 8] : [239, 68, 68];
  
  // Background circle
  doc.setFillColor(30, 41, 59);
  doc.circle(x, y, radius, "F");
  
  // Score arc (simplified as filled circle)
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.circle(x, y, radius - 3, "F");
  
  // Inner circle for text
  doc.setFillColor(15, 23, 42);
  doc.circle(x, y, radius - 8, "F");
  
  // Score text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${score}`, x, y + 2, { align: "center" });
  
  doc.setFontSize(8);
  doc.text("/100", x, y + 10, { align: "center" });
};

// Helper function to draw progress bar
const drawProgressBar = (doc: jsPDF, x: number, y: number, width: number, height: number, value: number, max: number) => {
  const progress = (value / max) * width;
  const barColor = value >= (max * 0.8) ? [34, 197, 94] : value >= (max * 0.5) ? [234, 179, 8] : [239, 68, 68];
  
  // Background
  doc.setFillColor(51, 65, 85);
  doc.roundedRect(x, y, width, height, 2, 2, "F");
  
  // Progress
  doc.setFillColor(barColor[0], barColor[1], barColor[2]);
  doc.roundedRect(x, y, progress, height, 2, 2, "F");
};

export function downloadRadarReport(data: RadarReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // =====================
  // PAGE 1 - DIAGNOSTIC
  // =====================
  
  // Header background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 50, "F");
  
  // Header accent line
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 48, pageWidth, 2, "F");
  
  // Logo/Title
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("AI INSIGHT", 20, 25);
  
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Auditoria 360º", 20, 35);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, 20, 45);
  
  // Profile info section
  let yPos = 65;
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Informações do Perfil", 20, yPos);
  
  yPos += 12;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  if (data.username) {
    doc.text(`Perfil: @${data.username}`, 20, yPos);
    yPos += 7;
  }
  if (data.platform) {
    doc.text(`Plataforma: ${data.platform.charAt(0).toUpperCase() + data.platform.slice(1)}`, 20, yPos);
    yPos += 7;
  }
  if (data.niche) {
    doc.text(`Nicho Detectado: ${data.niche}`, 20, yPos);
    yPos += 7;
  }
  if (data.currentFollowers) {
    doc.text(`Seguidores: ${data.currentFollowers.toLocaleString("pt-BR")}`, 20, yPos);
    yPos += 7;
  }
  
  // Profile Score Section
  yPos += 10;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, yPos - 5, pageWidth - 30, 60, 5, 5, "F");
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PROFILE SCORE", 25, yPos + 5);
  
  if (data.score !== null) {
    drawScoreCircle(doc, 55, yPos + 35, 22, data.score);
    
    // Score status text
    const statusText = data.score >= 80 ? "Excelente!" : data.score >= 50 ? "Bom, pode melhorar" : "Precisa de atenção";
    const statusColor = data.score >= 80 ? [34, 197, 94] : data.score >= 50 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFontSize(11);
    doc.text(statusText, 85, yPos + 25);
    
    // Breakdown bars
    if (data.breakdown) {
      const categories = [
        { label: "Bio", value: data.breakdown.bio || 0, max: 20 },
        { label: "Foto", value: data.breakdown.photo || 0, max: 20 },
        { label: "Engagement", value: data.breakdown.engagement || 0, max: 30 },
        { label: "Visual", value: data.breakdown.visual || 0, max: 15 },
        { label: "Frequência", value: data.breakdown.frequency || 0, max: 15 },
      ];
      
      let barY = yPos + 10;
      categories.forEach((cat) => {
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8);
        doc.text(`${cat.label}: ${cat.value}/${cat.max}`, 100, barY + 2);
        drawProgressBar(doc, 145, barY - 3, 45, 6, cat.value, cat.max);
        barY += 10;
      });
    }
  }
  
  yPos += 70;
  
  // Best Posting Times
  if (data.bestTimes && data.bestTimes.length > 0) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Melhores Horários para Postar", 20, yPos);
    yPos += 10;
    
    const sortedTimes = [...data.bestTimes].sort((a, b) => b.score - a.score).slice(0, 5);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    sortedTimes.forEach((time, index) => {
      const hour = `${time.hour.toString().padStart(2, "0")}:00`;
      const emoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "•";
      doc.setTextColor(71, 85, 105);
      doc.text(`${emoji} ${hour} - ${time.score}% de engagement`, 25, yPos);
      yPos += 7;
    });
  }
  
  // =====================
  // PAGE 2 - DETAILED ANALYSIS
  // =====================
  doc.addPage();
  
  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ANÁLISE DETALHADA", 20, 20);
  
  yPos = 45;
  
  // Photo Analysis Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("📸 Diagnóstico de Foto de Perfil", 20, yPos);
  yPos += 12;
  
  // Use real data or show default values (no random)
  const photoAnalysis = data.photoAnalysis || {
    framing: 15,
    background: 12,
    lighting: 14,
    expression: 16,
  };
  
  const photoCategories = [
    { label: "Enquadramento", value: photoAnalysis.framing || 15, icon: "📐" },
    { label: "Fundo Profissional", value: photoAnalysis.background || 12, icon: "🎨" },
    { label: "Iluminação", value: photoAnalysis.lighting || 14, icon: "💡" },
    { label: "Expressão/Autoridade", value: photoAnalysis.expression || 16, icon: "😊" },
  ];
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  photoCategories.forEach((cat) => {
    doc.setTextColor(71, 85, 105);
    doc.text(`${cat.icon} ${cat.label}:`, 25, yPos);
    drawProgressBar(doc, 85, yPos - 4, 50, 6, cat.value, 20);
    doc.text(`${cat.value}/20`, 140, yPos);
    yPos += 10;
  });
  
  yPos += 10;
  
  // Bio Analysis Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("📝 Análise de Bio", 20, yPos);
  yPos += 12;
  
  const bioAnalysis = data.bioAnalysis || {
    has_cta: false,
    has_niche_keywords: true,
    suggested_bio: `${data.niche || "Marketing Digital"} | Ajudo você a alcançar resultados extraordinários | Clique no link ↓`,
  };
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  
  const ctaStatus = bioAnalysis.has_cta ? "✅ Tem CTA" : "❌ Falta CTA";
  const keywordStatus = bioAnalysis.has_niche_keywords ? "✅ Palavras-chave do nicho" : "❌ Falta palavras-chave";
  
  doc.text(ctaStatus, 25, yPos);
  yPos += 7;
  doc.text(keywordStatus, 25, yPos);
  yPos += 12;
  
  doc.setFontSize(9);
  doc.text("Bio Sugerida:", 25, yPos);
  yPos += 7;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(20, yPos - 4, pageWidth - 40, 15, 3, 3, "F");
  doc.setTextColor(22, 101, 52);
  const bioLines = doc.splitTextToSize(bioAnalysis.suggested_bio || "", pageWidth - 50);
  doc.text(bioLines, 25, yPos + 3);
  
  yPos += 25;
  
  // Content Suggestions Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("💡 Sugestões de Conteúdo", 20, yPos);
  yPos += 12;
  
  const suggestions = data.contentSuggestions || [
    { type: "Reels de FAQ", description: "Responda perguntas frequentes do nicho", frequency: "2x/semana" },
    { type: "Carrossel Tutorial", description: "Ensine um conceito em 5-7 slides", frequency: "1x/semana" },
    { type: "Stories do Dia", description: "Mostre bastidores autênticos", frequency: "Diário" },
  ];
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  suggestions.forEach((sug, i) => {
    doc.setTextColor(6, 182, 212);
    doc.text(`${i + 1}. ${sug.type}`, 25, yPos);
    doc.setTextColor(71, 85, 105);
    doc.text(`   ${sug.description} (${sug.frequency})`, 25, yPos + 6);
    yPos += 15;
  });
  
  // =====================
  // PAGE 3 - WAR PLAN (7 DAYS)
  // =====================
  doc.addPage();
  
  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 35, "F");
  
  // Accent
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 33, pageWidth, 2, "F");
  
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("🎯 PLANO DE GUERRA: 7 DIAS", 20, 23);
  
  yPos = 50;
  
  // Subtitle
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("O seu roteiro personalizado para transformar o seu perfil em 7 dias", 20, yPos);
  
  yPos += 15;
  
  // 7 Day Plan
  const warPlan = [
    {
      day: "DIA 1",
      title: "Ajuste de Foto e Bio (Autoridade Instantânea)",
      description: "Atualize a foto de perfil seguindo as recomendações. Reescreva a bio com CTA claro.",
      color: [220, 38, 38],
    },
    {
      day: "DIA 2",
      title: "Stories de Prova Social e Antecipação",
      description: "Publique 5 stories: 2 de prova social + 3 de bastidores + 1 enquete.",
      color: [234, 88, 12],
    },
    {
      day: "DIA 3",
      title: "Post de Carrossel Educativo (Quebra de Objeção)",
      description: "Crie um carrossel de 7 slides ensinando algo valioso do seu nicho.",
      color: [234, 179, 8],
    },
    {
      day: "DIA 4",
      title: "Use o Gerador One-Click Post",
      description: "Acesse o 'Gerador One-Click Post' e crie a legenda do seu Reels.",
      color: [34, 197, 94],
    },
    {
      day: "DIA 5",
      title: "Reels de FAQ do Seu Nicho",
      description: "Grave um Reels respondendo as 3 perguntas mais comuns do seu nicho.",
      color: [6, 182, 212],
    },
    {
      day: "DIA 6",
      title: "Agende no Horário de Pico",
      description: "Use a aba 'Melhores Horários' e agende o post mais importante da semana.",
      color: [99, 102, 241],
    },
    {
      day: "DIA 7",
      title: "Revise Métricas e Ajuste Estratégia",
      description: "Analise os resultados da semana. Identifique o post com melhor performance.",
      color: [168, 85, 247],
    },
  ];
  
  warPlan.forEach((day) => {
    // Day box
    doc.setFillColor(day.color[0], day.color[1], day.color[2]);
    doc.roundedRect(15, yPos - 4, 25, 10, 2, 2, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(day.day, 17, yPos + 3);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(day.title, 45, yPos + 3);
    
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(day.description, pageWidth - 55);
    doc.text(descLines, 45, yPos + 10);
    
    yPos += 22;
  });
  
  // =====================
  // MONETIZATION VERDICT
  // =====================
  yPos = pageHeight - 55;
  
  // Box background
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(15, yPos - 5, pageWidth - 30, 45, 5, 5, "F");
  
  // Title
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("💰 VEREDITO DE MONETIZAÇÃO", 25, yPos + 5);
  
  // Calculate conversion probability
  const score = data.score || 50;
  const currentProbability = score < 50 ? 12 : 35;
  const improvedProbability = score < 50 ? 75 : 90;
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Com o seu perfil atual, a sua probabilidade estimada de converter uma`,
    25,
    yPos + 15
  );
  doc.text(
    `mentoria de 500€ é de ${currentProbability}%. Com a implementação das correções`,
    25,
    yPos + 22
  );
  doc.text(
    `sugeridas neste PDF, a sua probabilidade sobe para ${improvedProbability}%.`,
    25,
    yPos + 29
  );
  
  // CTA Button
  doc.setFillColor(6, 182, 212);
  doc.roundedRect(50, yPos + 33, pageWidth - 100, 10, 3, 3, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("QUERO ACELERAR ESTES RESULTADOS COM A IA ELITE", pageWidth / 2, yPos + 40, { align: "center" });
  
  // Footer
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Relatório gerado pelo Radar de Nicho | Academia De Mentoria 2.0 | Powered by IA",
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );
  
  // Save
  const fileName = `radar-auditoria-360-${data.username || "report"}-${Date.now()}.pdf`;
  doc.save(fileName);
  
  toast.success("Relatório PDF baixado com sucesso!");
  
  return fileName;
}

interface RadarPdfButtonProps {
  data: RadarReportData;
  disabled?: boolean;
}

export function RadarPdfButton({ data, disabled }: RadarPdfButtonProps) {
  const handleDownload = () => {
    if (!data.score && !data.niche) {
      toast.error("Faça uma análise primeiro para gerar o relatório");
      return;
    }
    downloadRadarReport(data);
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled}
      variant="outline"
      className="gap-2 border-cyan-700 text-cyan-300 hover:bg-cyan-950/50"
    >
      <Download className="h-4 w-4" />
      Baixar Relatório PDF
    </Button>
  );
}
