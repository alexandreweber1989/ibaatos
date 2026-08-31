# Knowledge do Projeto — Plataforma Igreja Batista Atos

Contexto **específico deste projeto**. As regras gerais de conduta (executar em
vez de gravar o pedido, não inventar relatórios, segredos fora do repositório)
estão na Knowledge do **Workspace** e continuam valendo — este documento não as
repete, apenas as complementa.

---

## 1. O que estamos construindo

O sistema operacional da **Igreja Batista Atos** (Ponta Grossa/PR): membresia,
células, escalas, ministério infantil, comunicação e cuidado pastoral.

- **Quem usa:** membros pelo celular, líderes de mesa, apascentadores, pastores
  e a administração. **A maioria dos acessos é mobile** — pense mobile primeiro.
- **Tom:** acolhedor e pastoral, nunca corporativo nem de vigilância.
- **Princípio de produto:** ferramentas de acompanhamento servem para **cuidar
  de pessoas**, não para controlá-las. Por isso o painel do líder registra "com
  quem já conversei esta semana" e **não existe controle de presença** — foi uma
  decisão deliberada da liderança. Não proponha frequência/chamada.

## 2. Estrutura da igreja

```
Igreja → Redes → Mesas → Membros        (Ministérios são transversais)
```

- **Redes** — agrupamentos por público (mulheres, homens, jovens, adolescentes).
- **Mesas** — as células; reúnem-se em casas. É onde a vida acontece.
- **Ministérios** — áreas de serviço (louvor, mídia, kids, dança, ação social).

**Papel de acesso** (`app_role`) e **função eclesiástica** (`church_function`)
são coisas diferentes — papel é permissão no sistema, função é posição na igreja:

| `app_role`                                                                                                 | `church_function`                                                 |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `admin_geral`, `admin_ministerio`, `lider_mesa`, `membro`, `admin_livraria`, `admin_cantina`, `admin_kids` | `pastor`, `apascentador`, `lider`, `diacono`, `obreiro`, `membro` |

## 3. Módulos que JÁ existem

**Verifique antes de criar qualquer coisa.** Rotas em `src/routes/_authenticated/`:

| Área        | Rotas                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| Núcleo      | `dashboard`, `perfil`, `membros`, `redes`, `mesas`, `ministerios`, `mapa`, `manual` |
| Comunicação | `avisos`, `noticias`, `pregacoes`, `midia`, `agenda`                                |
| Cuidado     | `cuidado` (oração e assistência), `cuidado-semana` (painel do líder)                |
| Pessoas     | `visitantes`, `onboarding` (trilha de integração)                                   |
| Ministérios | `louvor` (escalas e setlists), `faxina`, `igrejas` (ação social)                    |
| Kids        | `kids`, `kids.relatorios`, `kids-retirada.$checkinId`                               |
| Operação    | `livraria`, `cantina`                                                               |

Rotas públicas: `/` (home), `auth`, `kids.visitante`, e APIs em
`src/routes/api/public/` e `src/routes/api/push/`.

## 4. Convenções de código deste projeto

- **Páginas** usam `PageHeader` / `PageBody` de `@/components/app-shell`.
- **Componentes de UI** vêm de `src/components/ui` (shadcn). Não recrie botão,
  diálogo, select etc.
- **Server functions** ficam em `src/lib/*.functions.ts` e usam o padrão:
  ```ts
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth]) // dá context.supabase e context.userId
    .handler(async ({ data, context }) => {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin_geral",
      });
      if (!isAdmin) throw new Error("...");
    });
  ```
- **Código que só roda no servidor** fica em `src/lib/*.server.ts` e é importado
  dinamicamente (`await import(...)`) dentro do handler — arquivos `.functions.ts`
  e de rota vão para o bundle do cliente.
- **Tipografia:** Syne (`font-serif`) nos títulos, apenas pesos **500–800**
  (o peso 400 não é carregado e cai para a fonte do sistema). Corpo em Plus
  Jakarta Sans; Fredoka só em contexto infantil (Kids).
- Números em tabelas e painéis: `tabular-nums`. Respeite `prefers-reduced-motion`.

## 5. Banco de dados

~80 tabelas, **RLS ativo em todas**. Principais por área:

- **Pessoas:** `profiles`, `user_roles`, `membership_requests`, `family_links`
- **Estrutura:** `churches`, `redes`, `rede_members`, `mesas`, `mesa_members`,
  `mesa_addresses`, `ministries`, `ministry_members`
- **Comunicação:** `announcements`, `announcement_reads`, `news`, `events`,
  `event_rsvps`, `sermons`, `media_assets`, `notifications_history`,
  `user_push_tokens`
- **Cuidado:** `prayer_requests`, `pastoral_notes`, `social_assistance_requests`,
  `leader_touchpoints`
- **Kids:** `kids_children`, `kids_guardians`, `kids_checkins`, `kids_sessions`,
  `kids_schedules`, `kids_visitor_requests`, `kids_emergency_alerts`
- **Louvor:** `worship_schedules`, `worship_schedule_assignments`,
  `worship_teams`, `worship_songs`, `setlists`
- **Operação:** `products`, `orders`, `canteen_*`, `cleaning_*`

### Funções auxiliares de RLS (use-as, não reinvente)

`has_role`, `has_mesa_role`, `has_ministry_role`, `is_pastoral`, `is_leadership`,
`is_mesa_member`, `is_rede_member`, `can_view_mesa`, `can_view_rede`,
`shares_group`, `is_kids_admin`, `is_guardian_of`, `is_livraria_admin`,
`is_cantina_admin`.

Todas são `SECURITY DEFINER` — é assim que se evita recursão de policy.

### Regras de RLS aprendidas na prática

1. **Recursão infinita.** Se a policy de A consulta B e a de B consulta A, o
   Postgres estoura com _"infinite recursion detected in policy"_. Já aconteceu
   entre `redes`, `mesas` e `mesa_members`. Sempre faça a checagem por função
   `SECURITY DEFINER`.
2. **Use os valores reais do enum.** `'admin'` **não existe** em `app_role` —
   usar esse valor faz a policy estourar em runtime e quebra a tela.
3. **`app_settings` é legível por qualquer autenticado.** Nunca guarde segredo lá.
4. **`profiles` tem dados pessoais** (e-mail, telefone, endereço, nascimento).
   A leitura respeita hierarquia: a própria pessoa, a liderança, ou quem
   compartilha mesa/rede/ministério (`shares_group`).

## 6. Armadilhas técnicas verificadas neste projeto

- **`supabase-js` NÃO lança exceção em erro de banco.** Retorna `{ data, error }`.
  Um `insert` dentro de `try/catch` **não** cai no `catch` quando o RLS recusa —
  a interface mostra sucesso falso e o dado se perde.
  Sempre: `const { error } = await ...; if (error) ...`.
- **Nunca engula o erro:** inclua `error.message` na mensagem exibida.
- **`process.env` está vazio no servidor publicado.** O arquivo gerado
  `src/integrations/supabase/client.server.ts` funciona por ter credenciais
  embutidas como fallback. Não presuma que uma variável chegou ao servidor.
- **Variáveis do Lovable ≠ variáveis da Vercel.** Quem publica é a Vercel;
  variáveis definidas só no Lovable não chegam ao servidor de produção.
- **Migrations do repositório não são aplicadas sozinhas.** Depois de criar uma,
  o SQL precisa ser executado no editor do Supabase. Escreva sempre de forma
  **idempotente** (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
- **Colunas de migrations não aplicadas derrubam a consulta inteira.** Quando
  precisar ser resiliente, use `select("*")` e trate os formatos possíveis.
- **Evite `(supabase as any)`** — prefira regenerar os tipos; o cast esconde
  consultas a colunas erradas.

## 7. Notificações (push)

Web Push gratuito, sem serviço de terceiros. As chaves VAPID são **derivadas
automaticamente** da credencial de servidor (determinístico — as mesmas chaves a
cada requisição, então as assinaturas dos aparelhos seguem válidas).

Ordem de prioridade: variáveis de ambiente → tabela `push_config` → derivação.
**Trocar de método invalida as assinaturas** e todos precisam reativar.

No iPhone, a Apple só entrega push para app **instalado na tela de início** — o
cartão em "Meu perfil" já mostra essa instrução automaticamente.

## 8. Publicação

`main` é produção: a Vercel publica a partir dela e o Lovable sincroniza.
Mantenha `main` sempre funcionando. Edições feitas no Lovable vão direto para
`main`; agentes de código trabalham em branch + Pull Request.
