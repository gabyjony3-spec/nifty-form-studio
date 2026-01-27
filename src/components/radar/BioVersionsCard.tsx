import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, FileText, Sparkles, Edit2, X, Save } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BioVersionsCardProps {
  bioVersions: string[];
  currentBio?: string;
  onBioUpdate?: (newBio: string, index: number) => void;
}

const BIO_CHAR_LIMIT = 150;

export function BioVersionsCard({ bioVersions, currentBio, onBioUpdate }: BioVersionsCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedBio, setEditedBio] = useState<string>("");
  const [localBioVersions, setLocalBioVersions] = useState<string[]>(bioVersions);

  const isOverLimit = editedBio.length > BIO_CHAR_LIMIT;

  const handleCopy = (bio: string, index: number) => {
    navigator.clipboard.writeText(bio);
    setCopiedIndex(index);
    toast.success("Bio copiada para a área de transferência!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleStartEdit = (bio: string, index: number) => {
    setEditingIndex(index);
    setEditedBio(bio);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedBio("");
  };

  const handleSaveEdit = (index: number) => {
    if (isOverLimit) return;
    
    const newVersions = [...localBioVersions];
    newVersions[index] = editedBio;
    setLocalBioVersions(newVersions);
    onBioUpdate?.(editedBio, index);
    setEditingIndex(null);
    setEditedBio("");
    toast.success("Bio atualizada com sucesso!");
  };

  const getCharCountColor = () => {
    if (editedBio.length > BIO_CHAR_LIMIT) return "text-red-400";
    if (editedBio.length > BIO_CHAR_LIMIT - 20) return "text-yellow-400";
    return "text-green-400";
  };

  if (!localBioVersions || localBioVersions.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-cyan-400" />
          3 Versões de Bio Otimizada
          <Badge variant="outline" className="ml-auto border-cyan-500/50 text-cyan-300 text-xs">
            Prontas a usar
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Bio */}
        {currentBio && (
          <div className="p-3 rounded-lg bg-muted/10 border border-muted/20">
            <p className="text-xs text-muted-foreground mb-1">Bio Atual:</p>
            <p className="text-sm text-muted-foreground italic">{currentBio || "Não detectada"}</p>
          </div>
        )}

        {/* Suggested Versions */}
        <div className="space-y-3">
          {localBioVersions.map((bio, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <AnimatePresence mode="wait">
                {editingIndex === index ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-lg bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-500/40"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-cyan-400">{index + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-cyan-300">Editando Bio</span>
                    </div>
                    
                    <Textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      className={cn(
                        "min-h-[100px] resize-none bg-background/50",
                        isOverLimit && "border-red-500 focus-visible:ring-red-500"
                      )}
                      placeholder="Digite a nova bio..."
                    />
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className={cn("text-xs font-medium", getCharCountColor())}>
                        {editedBio.length}/{BIO_CHAR_LIMIT} caracteres
                        {isOverLimit && <span className="ml-2 text-red-400">⚠️ Limite excedido!</span>}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-8"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(index)}
                          disabled={isOverLimit}
                          className={cn(
                            "h-8",
                            isOverLimit 
                              ? "bg-muted text-muted-foreground cursor-not-allowed" 
                              : "bg-cyan-600 hover:bg-cyan-700"
                          )}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-lg bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-cyan-400">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white leading-relaxed">{bio}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {bio.length} caracteres
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          onClick={() => handleStartEdit(bio, index)}
                        >
                          <Edit2 className="h-4 w-4 text-amber-400" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          onClick={() => handleCopy(bio, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-cyan-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Tips */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-200/80">
            Clique em <Edit2 className="h-3 w-3 inline mx-1" /> para editar ou <Copy className="h-3 w-3 inline mx-1" /> para copiar. 
            Uma boa bio deve ter CTA clara, keywords do nicho e emojis estratégicos (máx. {BIO_CHAR_LIMIT} caracteres).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
