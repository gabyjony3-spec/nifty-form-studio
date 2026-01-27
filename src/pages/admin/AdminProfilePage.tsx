import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, User, Mail, Phone, Building, DollarSign } from "lucide-react";

export default function AdminProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    id: "",
    full_name: "",
    email: "",
    whatsapp: "",
    company_name: "",
    business_area: "",
    avatar_url: "",
    budget_to_invest: "",
    amount_invested: "",
    revenue_earned: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Se não existe perfil, criar um novo
      if (!data) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.email?.split("@")[0] || "Administrador",
            role: "admin",
          });

        if (insertError) throw insertError;

        setProfile({
          id: user.id,
          full_name: user.email?.split("@")[0] || "Administrador",
          email: user.email || "",
          whatsapp: "",
          company_name: "",
          business_area: "",
          avatar_url: "",
          budget_to_invest: "",
          amount_invested: "",
          revenue_earned: "",
        });
        return;
      }

      setProfile({
        id: data.id,
        full_name: data.full_name || "",
        email: data.email || "",
        whatsapp: data.whatsapp || "",
        company_name: data.company_name || "",
        business_area: data.business_area || "",
        avatar_url: data.avatar_url || "",
        budget_to_invest: data.budget_to_invest?.toString() || "",
        amount_invested: data.amount_invested?.toString() || "",
        revenue_earned: data.revenue_earned?.toString() || "",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perfil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload para Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Atualizar perfil com nova URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setPreviewUrl(null);

      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          whatsapp: profile.whatsapp,
          company_name: profile.company_name,
          business_area: profile.business_area,
          budget_to_invest: profile.budget_to_invest ? parseFloat(profile.budget_to_invest) : null,
          amount_invested: profile.amount_invested ? parseFloat(profile.amount_invested) : null,
          revenue_earned: profile.revenue_earned ? parseFloat(profile.revenue_earned) : null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-red-400">Perfil do Administrador</h1>
        <p className="text-red-300/70">Gerencie suas informações pessoais e avatar</p>
      </div>

      {/* Avatar Card */}
      <Card className="bg-gradient-to-br from-red-950/50 to-gray-900/50 border-red-800/30">
        <CardHeader>
          <CardTitle className="text-red-400">Foto de Perfil</CardTitle>
          <CardDescription className="text-red-300/70">
            Atualize sua foto de perfil (máx. 2MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <Avatar className="h-32 w-32 border-4 border-red-500/30 shadow-lg shadow-red-500/20">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            <AvatarFallback className="bg-red-900 text-red-100 text-3xl">
              {profile.full_name?.charAt(0)?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>

          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={uploading}
              className="relative border-red-600 text-red-400 hover:bg-red-950/50"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Carregando..." : "Escolher Foto"}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info Card */}
      <Card className="bg-gradient-to-br from-red-950/50 to-gray-900/50 border-red-800/30">
        <CardHeader>
          <CardTitle className="text-red-400">Informações Pessoais</CardTitle>
          <CardDescription className="text-red-300/70">
            Atualize seus dados pessoais e de contato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-red-300">
                  <User className="inline-block mr-2 h-4 w-4" />
                  Nome Completo
                </Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  className="bg-red-950/30 border-red-800/50 text-red-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-red-300">
                  <Mail className="inline-block mr-2 h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-red-950/30 border-red-800/50 text-red-100 opacity-70"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-red-300">
                  <Phone className="inline-block mr-2 h-4 w-4" />
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  value={profile.whatsapp}
                  onChange={(e) =>
                    setProfile({ ...profile, whatsapp: e.target.value })
                  }
                  className="bg-red-950/30 border-red-800/50 text-red-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-red-300">
                  <Building className="inline-block mr-2 h-4 w-4" />
                  Nome da Empresa
                </Label>
                <Input
                  id="company_name"
                  value={profile.company_name}
                  onChange={(e) =>
                    setProfile({ ...profile, company_name: e.target.value })
                  }
                  className="bg-red-950/30 border-red-800/50 text-red-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_area" className="text-red-300">
                  Área de Negócio
                </Label>
                <Input
                  id="business_area"
                  value={profile.business_area}
                  onChange={(e) =>
                    setProfile({ ...profile, business_area: e.target.value })
                  }
                  className="bg-red-950/30 border-red-800/50 text-red-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_to_invest" className="text-red-300">
                  <DollarSign className="inline-block mr-2 h-4 w-4" />
                  Orçamento para Investir (€)
                </Label>
                <Input
                  id="budget_to_invest"
                  type="number"
                  value={profile.budget_to_invest}
                  onChange={(e) =>
                    setProfile({ ...profile, budget_to_invest: e.target.value })
                  }
                  className="bg-red-950/30 border-red-800/50 text-red-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount_invested" className="text-red-300">
                  Valor Investido (€)
                </Label>
                <Input
                  id="amount_invested"
                  type="number"
                  value={profile.amount_invested}
                  onChange={(e) =>
                    setProfile({ ...profile, amount_invested: e.target.value })
                  }
                  className="bg-red-950/30 border-red-800/50 text-red-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue_earned" className="text-red-300">
                  Receita Gerada (€)
                </Label>
                <Input
                  id="revenue_earned"
                  type="number"
                  value={profile.revenue_earned}
                  onChange={(e) =>
                    setProfile({ ...profile, revenue_earned: e.target.value })
                  }
                  className="bg-red-950/30 border-red-800/50 text-red-100"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
