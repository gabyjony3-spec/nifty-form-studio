import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const AdminSettingsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Configurações Globais</h1>

      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Configurações do Sistema</CardTitle>
          <CardDescription className="text-muted-foreground">
            Gerencie as configurações globais da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-mode" className="text-foreground">
              Modo de Manutenção
            </Label>
            <Switch id="maintenance-mode" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="new-registrations" className="text-foreground">
              Permitir Novos Registros
            </Label>
            <Switch id="new-registrations" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="text-foreground">
              Notificações por Email
            </Label>
            <Switch id="email-notifications" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Integrações</CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure as chaves de API para integrações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stripe-key">Stripe API Key</Label>
            <Input
              id="stripe-key"
              type="password"
              placeholder="sk_..."
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paypal-key">PayPal API Key</Label>
            <Input
              id="paypal-key"
              type="password"
              placeholder="..."
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram-token">Instagram Access Token</Label>
            <Input
              id="instagram-token"
              type="password"
              placeholder="..."
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook-token">Facebook Access Token</Label>
            <Input
              id="facebook-token"
              type="password"
              placeholder="..."
              className="bg-input border-border text-foreground"
            />
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-neon">
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
