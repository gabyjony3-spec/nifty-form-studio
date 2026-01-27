import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Megaphone, Target, Users, Euro, Sparkles, Send, Save, Instagram, Facebook, RefreshCw, ImageIcon, Loader2, Lock, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdPreview from "./AdPreview";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/trial/UpgradeModal";

interface AdCampaign {
  id: string;
  name: string;
  website_url: string;
  ai_headline: string;
  ai_copy: string;
  ai_description: string;
  ad_variations: any[];
  target_audience: any;
  daily_budget: number;
  objective: string;
  status: string;
  creative_url?: string;
}

interface MetaAdsConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: AdCampaign | null;
  onSuccess?: () => void;
}

const MetaAdsConfigModal = ({ open, onOpenChange, campaign, onSuccess }: MetaAdsConfigModalProps) => {
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creativeUrl, setCreativeUrl] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { isPro, isTrial } = useSubscription();
  const canPublishReal = isPro || isTrial;
  
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    copy: "",
    daily_budget: 15,
    objective: "TRAFFIC",
    age_min: 25,
    age_max: 55,
    interests: [] as string[],
    cta_type: "LEARN_MORE"
  });

  const [selectedVariation, setSelectedVariation] = useState(0);
  const [platform, setPlatform] = useState<"instagram" | "facebook">("instagram");

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || "",
        headline: campaign.ai_headline || "",
        copy: campaign.ai_copy || "",
        daily_budget: campaign.daily_budget || 15,
        objective: campaign.objective || "TRAFFIC",
        age_min: campaign.target_audience?.age_min || 25,
        age_max: campaign.target_audience?.age_max || 55,
        interests: campaign.target_audience?.interests || [],
        cta_type: "LEARN_MORE"
      });
      setCreativeUrl(campaign.creative_url || null);
      
      // Auto-generate image if none exists
      if (!campaign.creative_url) {
        generateImage();
      }
    }
  }, [campaign]);

  const generateImage = async () => {
    if (!campaign) return;
    
    setImageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-image', {
        body: {
          websiteUrl: campaign.website_url,
          keywords: campaign.target_audience?.interests || [],
          headline: campaign.ai_headline,
          industry: campaign.ai_description?.split(' ')[0] || 'business',
          campaignId: campaign.id
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setCreativeUrl(data.imageUrl);
        toast({
          title: "Imagem gerada!",
          description: "A imagem do anúncio foi criada com IA.",
        });
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast({
        title: "Erro ao gerar imagem",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setImageLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!campaign) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("ad_campaigns")
        .update({
          name: formData.name,
          ai_headline: formData.headline,
          ai_copy: formData.copy,
          daily_budget: formData.daily_budget,
          objective: formData.objective,
          target_audience: {
            age_min: formData.age_min,
            age_max: formData.age_max,
            interests: formData.interests
          },
          creative_url: creativeUrl,
          status: "draft"
        })
        .eq("id", campaign.id);

      if (error) throw error;

      toast({
        title: "Rascunho guardado",
        description: "A campanha foi guardada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!campaign) return;

    // Check if user can publish for real
    if (!sandboxMode && !canPublishReal) {
      setShowUpgradeModal(true);
      return;
    }

    setPublishLoading(true);
    try {
      // Simulate API call to Meta
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (sandboxMode) {
        // Sandbox mode - just simulate success
        toast({
          title: "🧪 Modo Teste",
          description: "Campanha simulada com sucesso! Nenhuma cobrança foi feita.",
        });
        setShowSuccessModal(true);
        onOpenChange(false);
        onSuccess?.();
      } else {
        // Real publish mode
        const { error } = await supabase
          .from("ad_campaigns")
          .update({
            name: formData.name,
            ai_headline: formData.headline,
            ai_copy: formData.copy,
            daily_budget: formData.daily_budget,
            objective: formData.objective,
            target_audience: {
              age_min: formData.age_min,
              age_max: formData.age_max,
              interests: formData.interests
            },
            creative_url: creativeUrl,
            status: "pending"
          })
          .eq("id", campaign.id);

        if (error) throw error;

        setShowSuccessModal(true);
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPublishLoading(false);
    }
  };

  const objectiveOptions = [
    { value: "REACH", label: "Alcance", description: "Mostrar a mais pessoas" },
    { value: "TRAFFIC", label: "Tráfego", description: "Enviar para o site" },
    { value: "CONVERSIONS", label: "Conversões", description: "Gerar leads ou vendas" }
  ];

  const ctaOptions = [
    { value: "LEARN_MORE", label: "Saber Mais" },
    { value: "SHOP_NOW", label: "Comprar Agora" },
    { value: "SIGN_UP", label: "Inscrever-se" },
    { value: "CONTACT_US", label: "Contactar" },
    { value: "BOOK_NOW", label: "Reservar Agora" }
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Megaphone className="h-5 w-5 text-primary" />
              Configurar Campanha Meta Ads
              <Badge variant="outline" className="ml-2 text-primary border-primary">Beta</Badge>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure os detalhes da sua campanha gerada por IA
            </DialogDescription>
          </DialogHeader>

          <div className="grid lg:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh] py-4">
            {/* Form Side */}
            <div className="space-y-6">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted">
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                  <TabsTrigger value="audience">Audiência</TabsTrigger>
                  <TabsTrigger value="budget">Orçamento</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Campanha</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Campanha Black Friday"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headline">
                      Headline
                      <span className="text-muted-foreground text-xs ml-2">
                        ({formData.headline.length}/40)
                      </span>
                    </Label>
                    <Input
                      id="headline"
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      maxLength={40}
                      placeholder="Headline persuasivo"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="copy">
                      Copy do Anúncio
                      <span className="text-muted-foreground text-xs ml-2">
                        ({formData.copy.length}/500)
                      </span>
                    </Label>
                    <Textarea
                      id="copy"
                      value={formData.copy}
                      onChange={(e) => setFormData({ ...formData, copy: e.target.value })}
                      maxLength={500}
                      rows={5}
                      placeholder="Copy AIDA persuasiva..."
                      className="bg-background border-border resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Call to Action</Label>
                    <Select
                      value={formData.cta_type}
                      onValueChange={(value) => setFormData({ ...formData, cta_type: value })}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ctaOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image Generation Section */}
                  <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      Imagem do Anúncio (IA)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Imagem gerada automaticamente com base no seu website
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateImage}
                      disabled={imageLoading}
                      className="w-full mt-2"
                    >
                      {imageLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          A gerar imagem...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {creativeUrl ? "Regerar Imagem" : "Gerar Imagem IA"}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* AI Variations */}
                  {campaign?.ad_variations && campaign.ad_variations.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Variações IA
                      </Label>
                      <div className="grid gap-2">
                        {campaign.ad_variations.map((variation: any, index: number) => (
                          <Card
                            key={index}
                            className={`cursor-pointer transition-all ${
                              selectedVariation === index
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => {
                              setSelectedVariation(index);
                              setFormData({
                                ...formData,
                                headline: variation.headline,
                                copy: variation.copy
                              });
                            }}
                          >
                            <CardContent className="p-3">
                              <p className="font-medium text-sm text-foreground">
                                {variation.headline}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {variation.copy}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="audience" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age_min">Idade Mínima</Label>
                      <Input
                        id="age_min"
                        type="number"
                        value={formData.age_min}
                        onChange={(e) => setFormData({ ...formData, age_min: parseInt(e.target.value) })}
                        min={18}
                        max={65}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age_max">Idade Máxima</Label>
                      <Input
                        id="age_max"
                        type="number"
                        value={formData.age_max}
                        onChange={(e) => setFormData({ ...formData, age_max: parseInt(e.target.value) })}
                        min={18}
                        max={65}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Interesses Sugeridos pela IA
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                          {interest}
                        </Badge>
                      ))}
                      {formData.interests.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Nenhum interesse definido
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Plataformas</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={platform === "instagram" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatform("instagram")}
                        className="flex items-center gap-2"
                      >
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </Button>
                      <Button
                        type="button"
                        variant={platform === "facebook" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatform("facebook")}
                        className="flex items-center gap-2"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="budget" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Orçamento Diário
                    </Label>
                    <div className="relative">
                      <Input
                        id="budget"
                        type="number"
                        value={formData.daily_budget}
                        onChange={(e) => setFormData({ ...formData, daily_budget: parseFloat(e.target.value) })}
                        min={1}
                        className="bg-background border-border pl-8"
                      />
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Estimativa: {(formData.daily_budget * 30).toFixed(2)}€/mês
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Objetivo da Campanha
                    </Label>
                    <div className="grid gap-2">
                      {objectiveOptions.map((option) => (
                        <Card
                          key={option.value}
                          className={`cursor-pointer transition-all ${
                            formData.objective === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setFormData({ ...formData, objective: option.value })}
                        >
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-foreground">
                                {option.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                            {formData.objective === option.value && (
                              <div className="h-3 w-3 rounded-full bg-primary" />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Sandbox Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Modo Sandbox</p>
                    <p className="text-xs text-muted-foreground">
                      {sandboxMode ? "Simular sem cobrança" : "Publicar para real"}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={sandboxMode} 
                  onCheckedChange={setSandboxMode}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Rascunho
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={publishLoading}
                  className={`flex-1 ${
                    !sandboxMode && !canPublishReal 
                      ? "bg-muted text-muted-foreground cursor-not-allowed" 
                      : sandboxMode 
                        ? "bg-amber-500 hover:bg-amber-600" 
                        : "bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 glow-neon"
                  }`}
                >
                  {publishLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A publicar...
                    </>
                  ) : !sandboxMode && !canPublishReal ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Pro Necessário
                    </>
                  ) : sandboxMode ? (
                    <>
                      <FlaskConical className="h-4 w-4 mr-2" />
                      Testar Campanha
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publicar no Meta
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Preview Side */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-muted/30 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Pré-visualização {platform === "instagram" ? "Instagram" : "Facebook"}
              </p>
              <AdPreview
                headline={formData.headline}
                copy={formData.copy}
                imageUrl={creativeUrl || undefined}
                ctaText={ctaOptions.find(c => c.value === formData.cta_type)?.label}
                platform={platform}
                isLoadingImage={imageLoading}
                onRegenerateImage={generateImage}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-card border-border text-center max-w-md">
          <div className="py-8 space-y-4">
            <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Megaphone className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              🎉 Campanha Enviada!
            </h3>
            <p className="text-muted-foreground">
              A sua campanha foi enviada para análise no Meta Ads com sucesso!
            </p>
            <p className="text-sm text-muted-foreground">
              Receberá uma notificação quando for aprovada.
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSuccessModal(false)}
                className="flex-1"
              >
                Ver Campanhas
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  onOpenChange(true);
                }}
                className="flex-1"
              >
                Criar Outra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
        featureName="Publicar Campanhas no Meta Ads" 
      />
    </>
  );
};

export default MetaAdsConfigModal;
