import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  User, 
  Image, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Sparkles,
  Camera,
  FileText,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface PhotoAnalysis {
  // Legacy format
  photo_score?: number;
  verdict?: "Transmite Autoridade" | "Requer Melhoria" | string;
  breakdown?: {
    framing: { score: number; feedback: string };
    background: { score: number; feedback: string };
    lighting: { score: number; feedback: string };
    expression: { score: number; feedback: string };
  };
  improvements?: string[];
  // New format from AI
  overall_score?: number;
  framing?: number;
  background?: number;
  lighting?: number;
  expression?: number;
  suggestions?: string[];
}

interface BioAnalysis {
  has_cta: boolean;
  has_niche_keywords: boolean;
  suggested_bio: string;
  current_issues: string[];
}

interface BrandingDiagnosisProps {
  photoAnalysis?: PhotoAnalysis | null;
  bioAnalysis?: BioAnalysis | null;
  currentBio?: string;
  niche?: string;
  isLoading?: boolean;
}

export function BrandingDiagnosis({
  photoAnalysis,
  bioAnalysis,
  currentBio,
  niche,
  isLoading,
}: BrandingDiagnosisProps) {
  const handleCopyBio = () => {
    if (bioAnalysis?.suggested_bio) {
      navigator.clipboard.writeText(bioAnalysis.suggested_bio);
      toast.success("Bio copiada para a área de transferência!");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 20) return "text-green-500";
    if (score >= 15) return "text-yellow-500";
    return "text-red-500";
  };

  const getPhotoScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
            Diagnóstico de Branding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted/20 rounded-lg" />
            <div className="h-24 bg-muted/20 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Sparkles className="h-5 w-5" />
          Diagnóstico de Branding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Analysis Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border bg-card/50"
        >
          <div className="flex items-start gap-4">
            {(() => {
              // Calculate score from new format or use legacy
              const score =
                photoAnalysis?.overall_score ??
                photoAnalysis?.photo_score ??
                (typeof photoAnalysis?.framing === "number" &&
                typeof photoAnalysis?.background === "number" &&
                typeof photoAnalysis?.lighting === "number" &&
                typeof photoAnalysis?.expression === "number"
                  ? Math.round(
                      ((photoAnalysis.framing +
                        photoAnalysis.background +
                        photoAnalysis.lighting +
                        photoAnalysis.expression) /
                        80) *
                        100
                    )
                  : photoAnalysis?.breakdown
                    ? Math.round(
                        ((photoAnalysis.breakdown.framing.score +
                          photoAnalysis.breakdown.background.score +
                          photoAnalysis.breakdown.lighting.score +
                          photoAnalysis.breakdown.expression.score) /
                          80) *
                          100
                      )
                    : 0);
              const verdict = score >= 60 ? "Transmite Autoridade" : "Requer Melhoria";
              
              return (
                <>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    verdict === "Transmite Autoridade" 
                      ? "bg-green-500/10 border border-green-500/30" 
                      : "bg-red-500/10 border border-red-500/30"
                  }`}>
                    <Camera className={`w-7 h-7 ${
                      verdict === "Transmite Autoridade" 
                        ? "text-green-400" 
                        : "text-red-400"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">Foto de Perfil</h4>
                      <Badge variant={verdict === "Transmite Autoridade" ? "default" : "destructive"}>
                        {score}/100
                      </Badge>
                    </div>
                    
                    <div className={`flex items-center gap-2 mb-3 ${
                      verdict === "Transmite Autoridade" 
                        ? "text-green-400" 
                        : "text-red-400"
                    }`}>
                      {verdict === "Transmite Autoridade" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">{verdict}</span>
                    </div>

                    {/* Photo Breakdown - New Format */}
                    {(photoAnalysis?.framing !== undefined || photoAnalysis?.breakdown) && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {photoAnalysis?.framing !== undefined ? (
                          <>
                            <div className="flex items-center justify-between p-2 rounded bg-muted/10">
                              <span className="text-muted-foreground">📐 Enquadramento</span>
                              <span className={`font-bold ${getScoreColor(photoAnalysis.framing)}`}>
                                {photoAnalysis.framing}/20
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-muted/10">
                              <span className="text-muted-foreground">🎨 Fundo</span>
                              <span className={`font-bold ${getScoreColor(photoAnalysis.background || 0)}`}>
                                {photoAnalysis.background || 0}/20
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-muted/10">
                              <span className="text-muted-foreground">💡 Iluminação</span>
                              <span className={`font-bold ${getScoreColor(photoAnalysis.lighting || 0)}`}>
                                {photoAnalysis.lighting || 0}/20
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-muted/10">
                              <span className="text-muted-foreground">😊 Expressão</span>
                              <span className={`font-bold ${getScoreColor(photoAnalysis.expression || 0)}`}>
                                {photoAnalysis.expression || 0}/20
                              </span>
                            </div>
                          </>
                        ) : photoAnalysis?.breakdown && Object.entries(photoAnalysis.breakdown).map(([key, data]) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded bg-muted/10">
                            <span className="text-muted-foreground capitalize">
                              {key === "framing" ? "Enquadramento" :
                               key === "background" ? "Fundo" :
                               key === "lighting" ? "Iluminação" : "Expressão"}
                            </span>
                            <span className={`font-bold ${getScoreColor(data.score)}`}>
                              {data.score}/20
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {(photoAnalysis?.suggestions || photoAnalysis?.improvements) && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Sugestões:</p>
                        {(photoAnalysis.suggestions || photoAnalysis.improvements || []).slice(0, 2).map((imp, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-cyan-400">→</span> {imp}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </motion.div>

        {/* Bio Analysis Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border bg-card/50"
        >
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              bioAnalysis?.has_cta && bioAnalysis?.has_niche_keywords
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-yellow-500/10 border border-yellow-500/30"
            }`}>
              <FileText className={`w-7 h-7 ${
                bioAnalysis?.has_cta && bioAnalysis?.has_niche_keywords
                  ? "text-green-400"
                  : "text-yellow-400"
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">Bio & Nome</h4>
              </div>

              {/* Bio Checks */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  {bioAnalysis?.has_cta ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    CTA (Call to Action) {bioAnalysis?.has_cta ? "presente" : "ausente"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {bioAnalysis?.has_niche_keywords ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    Palavras-chave do nicho {bioAnalysis?.has_niche_keywords ? "incluídas" : "faltando"}
                  </span>
                </div>
              </div>

              {/* Current Issues */}
              {bioAnalysis?.current_issues && bioAnalysis.current_issues.length > 0 && (
                <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span className="text-xs font-medium text-red-400">Problemas detectados:</span>
                  </div>
                  {bioAnalysis.current_issues.slice(0, 2).map((issue, i) => (
                    <p key={i} className="text-xs text-muted-foreground ml-5">• {issue}</p>
                  ))}
                </div>
              )}

              {/* Suggested Bio */}
              {bioAnalysis?.suggested_bio && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-green-400">Bio Otimizada para {niche}:</p>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-muted-foreground italic">
                      "{bioAnalysis.suggested_bio}"
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCopyBio}
                    className="w-full mt-2 border-green-500/30 hover:bg-green-500/10"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Bio Otimizada
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}