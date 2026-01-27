import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Camera, X, Loader2, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoAnalysisResult {
  photo_score: number;
  verdict: "Transmite Autoridade" | "Requer Melhoria";
  breakdown: {
    framing: { score: number; feedback: string };
    background: { score: number; feedback: string };
    lighting: { score: number; feedback: string };
    expression: { score: number; feedback: string };
  };
  improvements: string[];
  is_professional: boolean;
}

interface ProfileImageUploadProps {
  onImageAnalyzed: (result: PhotoAnalysisResult, imageBase64: string) => void;
  niche?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProfileImageUpload({ 
  onImageAnalyzed, 
  niche,
  isOpen: controlledIsOpen,
  onOpenChange
}: ProfileImageUploadProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter menos de 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-profile-photo", {
        body: { 
          imageUrl: selectedImage,
          niche: niche || "Marketing Digital"
        }
      });

      if (error) throw error;

      toast.success(`Análise concluída! Score: ${data.photo_score}/100`);
      onImageAnalyzed(data, selectedImage);
      setIsOpen(false);
      setSelectedImage(null);
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast.error("Erro ao analisar imagem. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-cyan-700/50 hover:bg-cyan-950/30"
        >
          <Camera className="h-4 w-4" />
          Analisar Foto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-cyan-400" />
            Análise de Foto de Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${dragActive 
                ? 'border-cyan-400 bg-cyan-950/20' 
                : 'border-cyan-800/50 hover:border-cyan-700/70 hover:bg-cyan-950/10'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {selectedImage ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative"
                >
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-full mx-auto border-2 border-cyan-500/50"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-0 right-1/2 translate-x-16 -translate-y-2 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
                    <Upload className="h-8 w-8 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Arraste a imagem ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG até 10MB
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analysis Criteria */}
          <Card className="bg-cyan-950/20 border-cyan-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-cyan-300">O que analisamos:</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                Enquadramento
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                Fundo/Contraste
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                Iluminação
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Expressão
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsOpen(false);
                clearImage();
              }}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              onClick={handleAnalyze}
              disabled={!selectedImage || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analisando...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Analisar Foto
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
