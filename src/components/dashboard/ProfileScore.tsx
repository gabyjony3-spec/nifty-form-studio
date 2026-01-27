import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Award, User, Image, Calendar, MessageCircle, Palette, TrendingUp, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileScoreProps {
  score: number | null;
  breakdown?: {
    bio: number;
    photo: number;
    frequency: number;
    engagement: number;
    visual: number;
  } | null;
  isLoading?: boolean;
  analysisId?: string;
}
export function ProfileScore({
  score,
  breakdown,
  isLoading,
  analysisId
}: ProfileScoreProps) {
  const navigate = useNavigate();
  
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-yellow-500";
    return "text-red-500";
  };
  const categories = [{
    key: "bio",
    label: "Bio Completa",
    icon: User
  }, {
    key: "photo",
    label: "Foto Profissional",
    icon: Image
  }, {
    key: "frequency",
    label: "Frequência de Posts",
    icon: Calendar
  }, {
    key: "engagement",
    label: "Engajamento",
    icon: MessageCircle
  }, {
    key: "visual",
    label: "Consistência Visual",
    icon: Palette
  }];

  // Loading state
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Profile Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Skeleton className="w-40 h-40 rounded-full" />
          </div>
          <div className="space-y-4">
            {Array.from({
            length: 5
          }).map((_, i) => <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>)}
          </div>
        </CardContent>
      </Card>;
  }

  // Empty state - no data
  if (score === null || !breakdown) {
    return <Card className="glass-card">
        
        
      </Card>;
  }

  // Calculate what's losing points and improvements
  const issues: string[] = [];
  const improvements: string[] = [];
  if (breakdown.bio < 70) {
    issues.push("Bio incompleta ou sem CTA");
    improvements.push("Adicione um link e chamada para ação na bio");
  }
  if (breakdown.photo < 70) {
    issues.push("Foto de perfil pode melhorar");
    improvements.push("Use uma foto profissional com boa iluminação");
  }
  if (breakdown.frequency < 70) {
    issues.push("Frequência de posts baixa");
    improvements.push("Poste pelo menos 3-4 vezes por semana");
  }
  if (breakdown.engagement < 70) {
    issues.push("Engajamento abaixo da média");
    improvements.push("Responda comentários e faça mais perguntas");
  }
  if (breakdown.visual < 70) {
    issues.push("Falta consistência visual");
    improvements.push("Defina uma paleta de cores para seus posts");
  }
  return <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Award className="h-5 w-5" />
          Profile Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score Circle */}
        <div className="flex justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/20" />
              {/* Progress circle */}
              <circle cx="50" cy="50" r="45" stroke="url(#scoreGradient)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${score * 2.83} 283`} className="transition-all duration-1000 ease-out" />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className={`${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'}`} stopColor="currentColor" />
                  <stop offset="100%" className={`${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-orange-400'}`} stopColor="currentColor" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>
        </div>

        {/* Score Status */}
        <div className="text-center">
          <p className={`text-lg font-semibold ${getScoreColor(score)}`}>
            {score >= 80 ? "Excelente!" : score >= 60 ? "Bom, pode melhorar" : "Precisa de atenção"}
          </p>
          <p className="text-sm text-muted-foreground">
            {score >= 80 ? "Seu perfil está otimizado para crescimento" : score >= 60 ? "Algumas melhorias podem aumentar seu alcance" : "Siga as sugestões da IA para melhorar"}
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4 pt-4 border-t">
          {categories.map(category => {
          const Icon = category.icon;
          const value = breakdown[category.key as keyof typeof breakdown] || 0;
          return <div key={category.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                    {value}%
                  </span>
                </div>
                <Progress value={value} className="h-2" />
              </div>;
        })}
        </div>

        {/* Issues and Improvements */}
        {(issues.length > 0 || improvements.length > 0) && <div className="space-y-3 pt-4 border-t">
            {issues.length > 0 && <div>
                <p className="text-xs font-semibold text-red-500 mb-1">O que te tirou pontos:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {issues.slice(0, 2).map((issue, i) => <li key={i} className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500" />
                      {issue}
                    </li>)}
                </ul>
              </div>}
            {improvements.length > 0 && <div>
                <p className="text-xs font-semibold text-green-500 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Como subir pontos:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {improvements.slice(0, 2).map((imp, i) => <li key={i} className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-green-500" />
                      {imp}
                    </li>)}
                </ul>
              </div>}
          </div>}

        {/* View Full Profile Button */}
        {analysisId && (
          <div className="pt-4 border-t">
            <Button 
              onClick={() => navigate(`/dashboard/profile-result/${analysisId}`)}
              className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              <Eye className="h-4 w-4" />
              Ver Perfil Completo Analisado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>;
}