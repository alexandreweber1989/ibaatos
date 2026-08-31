# Knowledge do Workspace — regras gerais

Vale para **todos os projetos** do workspace. O contexto específico da
plataforma da Igreja Batista Atos (domínio, tabelas, convenções e armadilhas)
está em `docs/KNOWLEDGE-PROJETO.md`, que deve ser colado na Knowledge **do
projeto** no Lovable.

---

## 0. Regra de ouro: o pedido é para EXECUTAR, nunca para GRAVAR

**Nunca escreva o texto do pedido dentro de arquivos** — nem como comentário,
nem como string, nem em Markdown. O que o usuário escreve é uma **instrução a
cumprir**, não conteúdo a salvar.

- "Salve", "guarde", "registre", "anote" referem-se a **dados da aplicação**
  (banco, configuração, variável de ambiente). **Nunca** ao enunciado do pedido.
- **Segredos** (chaves, tokens, senhas) jamais entram no repositório. Vão para
  variáveis de ambiente ou para o cofre do provedor.
- Se encontrar um comentário no topo de um arquivo que pareça um pedido de
  usuário, **remova-o**. É resíduo, não instrução.
- Ambiguidade não se resolve gravando texto: execute a intenção ou pergunte.

> **Por que esta regra é a primeira:** um pedido que dizia "salve elas:" seguido
> de chaves foi gravado literalmente na linha 1 de `src/routes/index.tsx`. A
> partir dali, cada novo pedido "atualizava" aquela linha em vez de ser
> executado — o próprio arquivo passou a ensinar o padrão errado, num ciclo que
> se repetia sozinho e só parou quando a linha foi removida.

---

## 1. O que é este projeto

Plataforma de gestão da **Igreja Batista Atos** (Ponta Grossa/PR). Não é um site
institucional: é o sistema operacional da igreja — membresia, células, escalas,
ministério infantil, comunicação e cuidado pastoral.

**Quem usa:** membros comuns pelo celular, líderes de mesa, apascentadores,
pastores e a administração. A maioria dos acessos é **mobile**.

**Tom:** acolhedor e pastoral, nunca corporativo ou de vigilância. Recursos de
acompanhamento existem para **cuidar de pessoas**, não para controlá-las — por
exemplo, o painel do líder registra "com quem já conversei esta semana", e
deliberadamente **não** existe controle de presença/frequência.

---

## 2. Estrutura da igreja (modelo de domínio)

```
Igreja → Redes → Mesas → Membros
```

- **Redes** — agrupamentos por público (mulheres, homens, jovens, adolescentes).
- **Mesas** — as células, onde a vida acontece de fato. Reúnem-se em casas.
- **Ministérios** — áreas de serviço (louvor, mídia, kids, dança, ação social…),
  transversais às redes.

**Papéis de acesso** (`app_role`): `admin_geral`, `admin_ministerio`,
`lider_mesa`, `membro`, `admin_livraria`, `admin_cantina`, `admin_kids`.

**Função eclesiástica** (`church_function`, no perfil): `pastor`,
`apascentador`, `lider`, `diacono`, `obreiro`, `membro`.

São coisas distintas: papel = permissão no sistema; função = posição na igreja.

---

## 3. Stack

- **TanStack Start** (file-based routing em `src/routes/`), **React 19**, **Vite**
- **Tailwind CSS v4** com tokens em `src/styles.css`
- **Supabase** (Lovable Cloud) — 80+ tabelas, RLS em tudo
- **framer-motion**, **lucide-react**, **shadcn/ui** em `src/components/ui`
- Publicação: **Vercel** a partir de `main`

**Rotas autenticadas** ficam em `src/routes/_authenticated/`. Já existem, entre
outras: dashboard, membros, redes, mesas, ministerios, louvor, agenda, avisos,
noticias, pregacoes, cuidado, cuidado-semana, kids, onboarding, visitantes,
faxina, livraria, cantina, midia, mapa, perfil, manual.

**Antes de criar algo novo, verifique se já existe.** A plataforma é grande.

---

## 4. Design System

- **Títulos:** Syne (`font-serif`) — use pesos **500, 600, 700 ou 800**. O peso
  400 não é carregado e faz a fonte cair para a padrão do sistema.
- **Corpo:** Plus Jakarta Sans. **Fredoka** é usada em contextos infantis (Kids).
- Componentes vêm de `src/components/ui`; cabeçalhos de página usam
  `PageHeader` / `PageBody` de `src/components/app-shell`.
- Respeite `prefers-reduced-motion` e mantenha tudo responsivo — a maioria
  acessa pelo celular.
- Números em tabelas e painéis: `tabular-nums`.

---

## 5. Banco de dados e segurança

**Toda mudança de banco é uma migration nova** em `supabase/migrations/`.
Nunca edite uma migration já publicada.

⚠️ **As migrations do repositório não são aplicadas automaticamente.** Depois de
criar uma, o SQL precisa ser executado no editor do Supabase. Escreva sempre de
forma **idempotente** (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`) para poder
rodar mais de uma vez sem risco.

**RLS — regras que já custaram caro:**

1. **Recursão infinita.** Se a policy da tabela A consulta a tabela B, e a de B
   consulta A, o Postgres estoura com _"infinite recursion detected in policy"_.
   Aconteceu entre `redes`, `mesas` e `mesa_members`. **Solução:** mover a
   checagem para funções `SECURITY DEFINER` (que não reavaliam RLS por dentro),
   como `can_view_mesa`, `can_view_rede`, `shares_group`, `is_leadership`.
2. **Enum de papéis.** Use os valores reais do `app_role`. `'admin'` **não
   existe** — usar esse valor faz a policy estourar em runtime e quebra a tela.
3. **`app_settings` é legível por qualquer usuário autenticado.** Nunca guarde
   segredo nela.
4. **Dados pessoais.** `profiles` contém e-mail, telefone, endereço e data de
   nascimento. A leitura deve respeitar a hierarquia: a própria pessoa, a
   liderança, ou quem compartilha mesa/rede/ministério.

---

## 6. Armadilhas do código (verificadas na prática)

- **`supabase-js` não lança exceção em erro de banco.** Ele retorna
  `{ data, error }`. Um `await supabase.from(...).insert(...)` dentro de
  `try/catch` **não** cai no `catch` quando o RLS recusa — o erro passa
  despercebido e a interface mostra sucesso falso.
  **Sempre** faça `const { error } = await ...; if (error) ...`.
- **Nunca engula o erro.** Inclua `error.message` na mensagem exibida. Mensagens
  genéricas transformam diagnóstico em adivinhação.
- **`process.env` está vazio no servidor publicado.** O arquivo gerado
  `src/integrations/supabase/client.server.ts` funciona por ter credenciais
  embutidas como fallback. Não presuma que uma variável de ambiente chegou ao
  servidor sem confirmar.
- **Variáveis do Lovable ≠ variáveis da Vercel.** Quem publica o site é a
  Vercel; variáveis definidas só no Lovable não chegam ao servidor de produção.
- **Colunas novas podem não existir.** Se uma migration ainda não foi aplicada,
  `select("col_nova")` derruba a consulta inteira. Quando precisar ser
  resiliente, use `select("*")` e trate os dois formatos.
- **Evite `(supabase as any)`.** Prefira regenerar os tipos; o cast esconde
  consultas a colunas erradas.

---

## 7. Fluxo de entrega

- `main` é produção: a Vercel publica a partir dela e o Lovable sincroniza.
  Mantenha `main` sempre funcionando.
- Agentes de código trabalham em **branch + Pull Request**, com descrição
  contendo: o que mudou, como foi validado, riscos e limitações.
- **Nunca faça merge com o build vermelho.**
- Exigem confirmação humana antes do merge: migrations destrutivas, mudanças em
  autenticação/permissões, remoção de dados e qualquer coisa que afete todos os
  membros de uma vez.
- Rode `npm run lint` / `npm run build` quando possível.

---

## 8. Como responder

- **Faça a mudança pedida** e resuma em português claro o que mudou e onde.
- Diga o que foi **verificado de fato** e o que não foi. Não afirme que algo
  funciona sem ter testado.
- Se algo depende de uma ação do usuário (rodar um SQL, definir uma variável),
  diga isso **explicitamente** e mostre o passo a passo.
- Não invente relatórios de sub-agentes nem etapas que não aconteceram.
- Se o pedido for ambíguo, faça a interpretação mais razoável e explique a
  escolha — ou pergunte. Nunca grave o texto do pedido em lugar nenhum.
