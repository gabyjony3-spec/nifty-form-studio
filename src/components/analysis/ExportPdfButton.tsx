import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportPdfButtonProps {
  elementId: string;
  websiteUrl: string;
  overallScore: number;
}

const ExportPdfButton = ({ elementId, websiteUrl, overallScore }: ExportPdfButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Elemento não encontrado");
      }

      toast.info("Gerando PDF...", { duration: 2000 });

      // Capture the dashboard as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFillColor(30, 30, 30);
      pdf.rect(0, 0, pdfWidth, 35, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Relatório de Auditoria Digital", 15, 18);
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Website: ${websiteUrl}`, 15, 26);
      pdf.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 15, 31);
      
      // Score badge
      const scoreColor = overallScore >= 80 ? [16, 185, 129] : overallScore >= 50 ? [245, 158, 11] : [239, 68, 68];
      pdf.setFillColor(...scoreColor as [number, number, number]);
      pdf.roundedRect(pdfWidth - 35, 10, 25, 20, 3, 3, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${overallScore}`, pdfWidth - 22.5, 23, { align: "center" });
      
      // Calculate image dimensions to fit page
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add dashboard image
      let yPosition = 40;
      const maxHeight = pdfHeight - yPosition - 15;
      
      if (imgHeight <= maxHeight) {
        pdf.addImage(imgData, "PNG", 10, yPosition, imgWidth, imgHeight);
      } else {
        // Scale down if too tall
        const scaledHeight = maxHeight;
        const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
        pdf.addImage(imgData, "PNG", (pdfWidth - scaledWidth) / 2, yPosition, scaledWidth, scaledHeight);
      }
      
      // Footer
      pdf.setTextColor(128, 128, 128);
      pdf.setFontSize(8);
      pdf.text("Gerado automaticamente por IA • Auditoria Estratégica Digital", pdfWidth / 2, pdfHeight - 8, { align: "center" });
      
      // Extract domain for filename
      const domain = new URL(websiteUrl).hostname.replace("www.", "");
      const date = new Date().toISOString().split("T")[0];
      
      pdf.save(`auditoria-${domain}-${date}.pdf`);
      
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Erro ao exportar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className="shadow-lg"
      size="lg"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Relatório PDF
        </>
      )}
    </Button>
  );
};

export default ExportPdfButton;
