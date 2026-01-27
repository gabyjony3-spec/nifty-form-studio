import { ServiceQuestionnaireForm } from "@/components/service/ServiceQuestionnaireForm";
import { Sparkles } from "lucide-react";

export default function ServiceQuestionnairePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo à Jornada</h1>
          <p className="text-muted-foreground">
            Preencha o questionário para começar
          </p>
        </div>
        <ServiceQuestionnaireForm />
      </div>
    </div>
  );
}
