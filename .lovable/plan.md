
# Plano Completo: Sincronização Admin + Presença Online + Reanálise + Histórico Global + Calendário Real

## Resumo das Funcionalidades Solicitadas

1. **Sincronização Admin-Utilizador**: Dados do painel do utilizador aparecem no admin
2. **Sistema de Presença Online**: Controlar quem está online/offline em tempo real
3. **Botão "Reanalisar Perfil"**: Facilitar análises múltiplas para popular histórico
4. **Página de Histórico Global**: Todas as análises de perfil independente da URL
5. **Correção de Verificações de Acesso**: Usar `useSubscription` em todo o lado
6. **Limpeza de Dados Fictícios**: Remover mockups e ativar dados reais
7. **Calendário de Relatórios Real**: Filtrar análises por data com Date Picker

---

## PARTE 1: Sistema de Presença Online em Tempo Real

### 1.1 Nova Tabela: `user_presence`

```sql
CREATE TABLE public.user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at timestamptz DEFAULT now() NOT NULL,
  current_page text,
  device_info jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX idx_user_presence_status ON public.user_presence(status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- RLS Policies
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update own presence" ON public.user_presence
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all presence" ON public.user_presence
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

### 1.2 Novo Hook: `src/hooks/usePresence.ts`

```typescript
// Registra presença do utilizador e atualiza a cada 30s
// Deteta mudança de página e inatividade (5min = away)
// Limpa presença ao fechar browser (beforeunload)

interface PresenceData {
  status: 'online' | 'away' | 'offline';
  lastSeenAt: Date;
  currentPage: string;
}
```

### 1.3 Integração no `UserLayout.tsx`

Chamar o hook `usePresence` para todos os utilizadores autenticados.

### 1.4 Nova Página Admin: `src/pages/admin/UserPresencePage.tsx`

Mostra:
- Grid de utilizadores com indicador de estado (verde/amarelo/cinza)
- Total online, away e offline
- Lista ordenável por último acesso
- Realtime updates via Supabase channel

---

## PARTE 2: Botão "Reanalisar Perfil"

### 2.1 Modificar `ProfileResultPage.tsx`

Adicionar botão no header após os badges:

```tsx
<Button
  onClick={handleReanalyze}
  disabled={reanalyzing}
  className="bg-gradient-to-r from-cyan-600 to-blue-600"
>
  {reanalyzing ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <RefreshCw className="h-4 w-4 mr-2" />
  )}
  Reanalisar Perfil
</Button>
```

### 2.2 Função de Reanálise

```typescript
const handleReanalyze = async () => {
  setReanalyzing(true);
  try {
    // Chama a edge function apropriada baseada na plataforma
    const { data, error } = await supabase.functions.invoke(`analyze-${platform}`, {
      body: { username: extractUsername(data.target_url), profileUrl: data.target_url }
    });
    
    if (error) throw error;
    
    // Navegar para a nova análise
    navigate(`/dashboard/profile/${data.analysisId}`);
    toast.success("Nova análise iniciada!");
  } catch (error) {
    toast.error("Erro ao reanalisar");
  }
};
```

---

## PARTE 3: Página de Histórico Global de Análises

### 3.1 Nova Página: `src/pages/user/ProfileHistoryPage.tsx`

```typescript
// Lista TODAS as análises do utilizador independente do perfil
// Com filtros por: plataforma, data, score range
// Ordenação por: data, score, nome
// Paginação de 20 em 20
```

### 3.2 Componentes da Página

- **Filtros**: Dropdown de plataforma, Date picker, Slider de score
- **Cards de Análise**: Cada card mostra miniatura, score, data, username
- **Calendário Heatmap**: Dias com análises destacados em cor
- **Estatísticas**: Total de análises, média de score, evolução

### 3.3 Adicionar Rota em `App.tsx`

```tsx
<Route path="history-global" element={<ProfileHistoryPage />} />
```

### 3.4 Adicionar Link no Sidebar

```tsx
<SidebarMenuButton asChild>
  <NavLink to="/dashboard/history-global">
    <History className="h-4 w-4" />
    Histórico Global
  </NavLink>
</SidebarMenuButton>
```

---

## PARTE 4: Calendário de Relatórios Real

### 4.1 Novo Componente: `src/components/reports/ReportCalendar.tsx`

```tsx
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Carrega datas com análises da tabela history_analysis
// Marca dias com "pontos dourados" (heatmap)
// Ao clicar num dia, filtra as análises dessa data
```

### 4.2 Funcionalidades

- **Heatmap por Intensidade**: Mais análises = cor mais forte
- **Filtro por Plataforma**: Botões para Instagram/YouTube/etc
- **Navegação por Mês**: Setas para anterior/próximo mês
- **Lista de Análises do Dia**: Sidebar com análises do dia selecionado

### 4.3 Integração no `ReportsPage.tsx`

Substituir botão de calendário estático por componente funcional:

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <CalendarIcon className="h-4 w-4 mr-2" />
      Calendário
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <ReportCalendar
      onDateSelect={setSelectedDate}
      analysisDates={analysisDates}
    />
  </PopoverContent>
</Popover>
```

---

## PARTE 5: Sincronização Admin com Dados do Utilizador

### 5.1 Atualizar `AdminDashboard.tsx`

Adicionar novos cards com dados reais:

```tsx
// Análises feitas hoje (history_analysis)
// Perfis escaneados no último mês
// Planos vitalícios vendidos (profiles.has_lifetime_access)
// Auditorias recentes (website_analysis)
```

### 5.2 Novo Card: Análises Recentes

```tsx
<Card>
  <CardHeader>
    <CardTitle>Últimas Análises de Perfil</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Lista das últimas 5 análises do history_analysis */}
    {/* Com nome do utilizador, perfil analisado, score, data */}
  </CardContent>
</Card>
```

### 5.3 Realtime para Análises

Adicionar channel para `history_analysis`:

```tsx
.on('postgres_changes', 
  { event: 'INSERT', schema: 'public', table: 'history_analysis' },
  () => fetchLatestAnalyses()
)
```

---

## PARTE 6: Limpeza de Dados Fictícios

### 6.1 Componentes a Atualizar

| Componente | Problema | Solução |
|------------|----------|---------|
| `AdminDashboard.tsx` | Hardcoded fallbacks | Mostrar "0" ou Skeleton se vazio |
| `UserDashboard.tsx` | Dados de demo | Carregar de `history_analysis` |
| `ContentCalendar.tsx` | Vazio OK | Já mostra "Nenhum calendário gerado" |

### 6.2 Padrão de Empty State

```tsx
{data.length === 0 ? (
  <div className="text-center py-12">
    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
    <p className="font-medium">Sem dados disponíveis</p>
    <Button onClick={handleStartScan}>
      <Sparkles className="h-4 w-4 mr-2" />
      Iniciar Primeiro Scan
    </Button>
  </div>
) : (
  // Render data
)}
```

### 6.3 Skeleton durante Loading

```tsx
{loading ? (
  <div className="grid gap-4">
    {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
  </div>
) : (
  // Render content
)}
```

---

## PARTE 7: Correção de Verificações de Acesso

### 7.1 Componentes a Corrigir

| Componente | Problema | Solução |
|------------|----------|---------|
| `TrialCountdown.tsx` | Query direta à DB | Usar `useSubscription` |
| `WhatsAppCreditsCard.tsx` | `checkLifetimeAccess()` local | Usar `useSubscription` |
| `PricingPage.tsx` | `fetchUserData()` + `checkSubscription()` | Usar `useSubscription` |

### 7.2 Exemplo de Refactor (`TrialCountdown.tsx`)

**Antes:**
```tsx
const { data: profile } = await supabase
  .from("profiles")
  .select("trial_ends_at, has_lifetime_access")
  .eq("id", user.id)
  .single();

if (profile?.has_lifetime_access) {
  setIsPro(true);
}
```

**Depois:**
```tsx
const { isPro, isLifetime, isElite, trialEndsAt, isLoading } = useSubscription();

if (isLoading) return null;
if (isPro || isLifetime || isElite) return null;
```

---

## PARTE 8: Adicionar ao Sidebar Admin

### 8.1 Nova Entrada em `AdminSidebar.tsx`

```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild>
    <NavLink to="/admin/presence">
      <Users className="h-4 w-4" />
      <span>Utilizadores Online</span>
    </NavLink>
  </SidebarMenuButton>
</SidebarMenuItem>
```

### 8.2 Nova Rota em `App.tsx`

```tsx
<Route path="presence" element={<UserPresencePage />} />
```

---

## Ficheiros a Criar

| Ficheiro | Descrição |
|----------|-----------|
| `src/hooks/usePresence.ts` | Hook de presença do utilizador |
| `src/pages/admin/UserPresencePage.tsx` | Página admin de presença |
| `src/pages/user/ProfileHistoryPage.tsx` | Histórico global de análises |
| `src/components/reports/ReportCalendar.tsx` | Calendário de relatórios |

## Ficheiros a Modificar

| Ficheiro | Alteração |
|----------|-----------|
| `src/pages/user/ProfileResultPage.tsx` | Adicionar botão Reanalisar |
| `src/components/AdminSidebar.tsx` | Adicionar link Presença |
| `src/components/UserSidebar.tsx` | Adicionar link Histórico Global |
| `src/components/UserLayout.tsx` | Integrar hook usePresence |
| `src/pages/admin/AdminDashboard.tsx` | Adicionar dados reais de análises |
| `src/components/trial/TrialCountdown.tsx` | Usar useSubscription |
| `src/components/automation/WhatsAppCreditsCard.tsx` | Usar useSubscription |
| `src/pages/user/PricingPage.tsx` | Usar useSubscription |
| `src/pages/user/ReportsPage.tsx` | Integrar calendário real |
| `src/App.tsx` | Novas rotas |

## Migração de Base de Dados

Tabela `user_presence` com:
- `user_id`, `status`, `last_seen_at`, `current_page`, `device_info`
- RLS para utilizadores e admins
- Realtime habilitado

---

## Resultado Esperado

1. **Admin vê em tempo real**: Quem está online, away ou offline
2. **Utilizador pode reanalisar**: Botão no resultado facilita múltiplas análises
3. **Histórico completo**: Página mostra todas as análises do utilizador
4. **Calendário funcional**: Filtrar análises por data com heatmap visual
5. **Dados reais**: Nenhum dado fictício, apenas informação da base de dados
6. **Acesso correto**: Plano Vitalício desbloqueia tudo automaticamente
