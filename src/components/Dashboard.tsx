import { Bell, User, LayoutDashboard, Users, BarChart3, FileText, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Users, label: "Leads", active: false },
    { icon: BarChart3, label: "Análise de conteúdo", active: false },
    { icon: FileText, label: "Relatórios", active: false },
    { icon: Settings, label: "Configuração", active: false },
    { icon: User, label: "Perfil", active: false },
  ];

  const leadsData = [
    { name: "Maria", count: 128 },
    { name: "João", count: 43 },
    { name: "Ana", count: 98 },
  ];

  const chartData = [
    { month: "Jan", value: 60 },
    { month: "Fev", value: 75 },
    { month: "Mar", value: 90 },
    { month: "Abr", value: 110 },
    { month: "Mai", value: 140 },
    { month: "Mai", value: 180 },
    { month: "Jun", value: 115 },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-primary">AI IN</h1>
        </div>

        <nav className="space-y-2 px-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                item.active
                  ? "bg-secondary text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-muted rounded-lg transition-smooth">
              <Bell className="h-5 w-5 text-primary" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-smooth">
              <User className="h-5 w-5 text-primary" />
              <span className="text-sm">Arya Stark</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Top Stats Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Resumo Card */}
            <Card className="bg-card border-border panel-shadow">
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-5xl font-bold text-primary">12.4 mil</p>
                  <p className="text-sm text-muted-foreground">Total de vendas</p>
                </div>

                {/* Mini Chart */}
                <div className="mt-6 flex items-end gap-2 h-24">
                  {chartData.map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-primary rounded-t"
                      style={{
                        height: `${(item.value / 180) * 100}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {chartData.map((item, index) => (
                    <span key={index}>{item.month}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Análise Card */}
            <Card className="bg-card border-border panel-shadow">
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <p className="text-5xl font-bold text-primary">11.4k</p>
                  <p className="text-sm text-muted-foreground">Engajamento</p>
                </div>

                {/* Line Chart Visual */}
                <div className="h-20 relative">
                  <svg className="w-full h-full" viewBox="0 0 200 80">
                    <path
                      d="M 0,60 Q 25,40 50,45 T 100,30 T 150,25 T 200,15"
                      fill="none"
                      stroke="hsl(195, 100%, 47%)"
                      strokeWidth="2"
                      className="glow-soft"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Processos Card */}
            <Card className="bg-card border-border panel-shadow">
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Processos automatizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-6xl font-bold">35</p>
                <div className="mt-8">
                  <p className="text-sm text-muted-foreground mb-2">
                    Análise de Conteúdo
                  </p>
                  <p className="text-4xl font-bold">2.3</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Leads Card */}
            <Card className="bg-card border-border panel-shadow">
              <CardHeader>
                <CardTitle>Leads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {leadsData.map((lead, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium">{lead.name}</span>
                    </div>
                    <span className="text-muted-foreground">{lead.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Estatísticas Card */}
            <Card className="bg-card border-border panel-shadow">
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="relative h-40 w-40">
                  <svg className="transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(220, 20%, 12%)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(195, 100%, 47%)"
                      strokeWidth="8"
                      strokeDasharray={`${76 * 2.51} ${100 * 2.51}`}
                      className="glow-neon"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-primary">76%</p>
                    <p className="text-xs text-muted-foreground">ABERTURA</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Atividades Card */}
            <Card className="bg-card border-border panel-shadow">
              <CardHeader>
                <CardTitle>Atividades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="h-2 bg-muted rounded-full flex-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Large Chart */}
          <Card className="bg-card border-border panel-shadow">
            <CardHeader>
              <CardTitle>Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-4">
                {chartData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-primary rounded-t glow-soft transition-smooth hover:bg-glow-blue"
                      style={{
                        height: `${(item.value / 180) * 100}%`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{item.month}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                <div>0</div>
                <div>50</div>
                <div>100</div>
                <div>150</div>
                <div>200</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
