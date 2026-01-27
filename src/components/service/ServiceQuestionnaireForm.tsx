import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, Rocket, Target, DollarSign } from "lucide-react";

export function ServiceQuestionnaireForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    whatsapp: "",
    objetivo: "",
    investimento: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.whatsapp || !formData.objetivo || !formData.investimento) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("service_leads")
        .insert({
          nome: formData.nome,
          whatsapp: formData.whatsapp.replace(/\D/g, ""),
          objetivo: formData.objetivo,
          investimento: formData.investimento,
          status: "Novo",
          aula_atual: 1,
        });

      if (error) throw error;

      toast.success("Inscrição realizada com sucesso!");
      navigate("/service-thank-you");
    } catch (error) {
      console.error("Erro ao enviar:", error);
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Questionário de Entrada</CardTitle>
        <CardDescription>
          Preencha os dados abaixo para começar a sua jornada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              placeholder="O seu nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              placeholder="+351 XXX XXX XXX"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Qual é o seu objetivo?
            </Label>
            <RadioGroup
              value={formData.objetivo}
              onValueChange={(value) => setFormData({ ...formData, objetivo: value })}
              className="grid gap-2"
            >
              {["Parceria", "Afiliação", "Curiosidade"].map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={option} id={`objetivo-${option}`} />
                  <Label htmlFor={`objetivo-${option}`} className="cursor-pointer flex-1">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Quanto pretende investir?
            </Label>
            <RadioGroup
              value={formData.investimento}
              onValueChange={(value) => setFormData({ ...formData, investimento: value })}
              className="grid gap-2"
            >
              {["$5-$10", "$20+", "Nenhum"].map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={option} id={`investimento-${option}`} />
                  <Label htmlFor={`investimento-${option}`} className="cursor-pointer flex-1">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A enviar...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Começar Jornada
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
