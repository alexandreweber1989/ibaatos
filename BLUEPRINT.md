# Blueprint Mestre da Plataforma Igreja Batista Atos (V3.0 - Guia de Excelência e Inovação)

Este documento é a especificação técnica e funcional definitiva para a replicação total da plataforma. Ele cobre desde a infraestrutura de dados até a lógica de componentes, menus, fluxos de botões e o **Planejamento de Expansão (Inovações)**.

---

## 1. Arquitetura do Sistema

A plataforma é uma aplicação **TanStack Start v1** (Full-Stack React 19) operando em um ambiente **Serverless/Edge**.

### 1.1 Tecnologias Core

- **Frontend:** React 19 (Hooks, Suspense, Concurrent Mode).
- **Roteamento:** TanStack Router (Tipagem estrita, carregamento paralelo).
- **Gerenciamento de Estado:** TanStack Query v5 (Cache global e sincronização).
- **Backend-as-a-Service:** Lovable Cloud (Baseado em Supabase/PostgreSQL).
- **Estilização:** Tailwind CSS v4 (Lightning CSS build, OKLCH colors).
- **Componentes:** Radix UI (Base para acessibilidade).
- **Validação:** Zod (Schema validation para API e formulários).

---

## 2. Criação de Menus Personalizados por Tipo de Membro

**Objetivo:** Desenvolver menus de navegação distintos e relevantes para cada tipo de usuário na plataforma, garantindo que cada grupo tenha acesso às funcionalidades adequadas às suas funções e permissões.

### 2.1 Tipos de Membros e Requisitos de Menu

- **Membro:**
  - Acesso a funcionalidades básicas de interação e visualização.
  - Exemplos: Perfil pessoal, feed de notícias, eventos, grupos, mensagens diretas.
- **Pastores:**
  - Acesso a funcionalidades de gestão pastoral e acompanhamento.
  - Exemplos: Gerenciamento de membros (visualização de perfis, status), agendamento de reuniões, relatórios de atividades, acesso a materiais de estudo.
- **Apascentadores:**
  - Acesso a funcionalidades de liderança de grupos e discipulado.
  - Exemplos: Gerenciamento de grupos (criação, edição, visualização de membros), acompanhamento de progresso de discipulado, agendamento de atividades de grupo, comunicação com membros do grupo.
- **Líderes:**
  - Acesso a funcionalidades de gestão de equipes e coordenação.
  - Exemplos: Gerenciamento de sub-líderes, coordenação de eventos, acesso a recursos de treinamento, relatórios de desempenho da equipe.
- **Admin:**
  - Acesso irrestrito a todas as funcionalidades e configurações da plataforma.
  - Inclui gerenciamento de usuários, configurações gerais, acesso a todos os relatórios, controle de permissões.

### 2.2 Requisitos Técnicos

1.  Implementar um sistema de controle de acesso baseado em roles (papéis).
2.  Desenvolver uma lógica para renderizar menus dinamicamente com base no tipo de usuário logado.
3.  Garantir que os itens de menu exibidos correspondam às permissões de cada role.
4.  Considerar a possibilidade de submenus e hierarquias dentro de cada menu principal.

### 2.3 Passos Necessários

1.  **Definir a estrutura de dados para roles e permissões:** Mapear quais permissões cada role possui.
2.  **Desenvolver a interface do usuário para os menus:** Criar os componentes visuais dos menus.
3.  **Implementar a lógica de backend para autenticação e autorização:** Verificar o tipo de usuário e suas permissões.
4.  **Integrar a lógica de renderização do menu com o estado de autenticação do usuário:** Exibir o menu correto para cada usuário.
5.  **Testar exaustivamente:** Verificar se cada role tem acesso apenas às funcionalidades permitidas.

---

## 3. Mapa de Navegação e Menus (UX)

O sistema utiliza um **App Shell** (layout compartilhado) com uma barra lateral ou menu de navegação que varia conforme o papel do usuário.

### 3.1 Detalhamento por Página

- **Painel (Dashboard):**
  - **Finalidade:** Centro operacional e visão 360º da igreja.
  - **O que faz:** Exibe avisos, escalas pendentes (Louvor), solicitações de membros para aprovação, métricas de crescimento e atalhos rápidos. É a primeira tela após o login.
- **Agenda:**
  - **Finalidade:** Gestão do calendário e presença.
  - **O que faz:** Centraliza cultos, ensaios e encontros. Permite aos membros confirmar presença (RSVP), visualizar por lista ou calendário e aos líderes gerenciar detalhes dos eventos.
- **Ministérios:**
  - **Finalidade:** Gestão das frentes de trabalho.
  - **O que faz:** Lista os ministérios (Louvor, Kids, etc.). Cada item leva a uma página específica com a missão do ministério, líderes e membros vinculados.
- **Redes:**
  - **Finalidade:** Organização por afinidade (Jovens, Mulheres, etc.).
  - **O que faz:** Exibe a hierarquia de liderança da rede e as "Mesas" (células) que pertencem a cada rede. Permite gerenciar membros em massa por rede.
- **Mesas:**
  - **Finalidade:** Gestão de grupos pequenos/células.
  - **O que faz:** Foca na comunhão semanal. Detalha dia, hora e local (endereço) das reuniões, além da liderança (geralmente casais) e participantes de cada mesa.
- **Membros:**
  - **Finalidade:** Diretório central da membresia.
  - **O que faz:** Ferramenta poderosa de busca e filtros. Permite visualizar fichas completas, exportar CSV, gerenciar o status ministerial (Batizado, Novo Convertido) e conceder permissões de sistema.
- **Kids:**
  - **Finalidade:** Operação de domingo e segurança infantil.
  - **O que faz:** Interface de check-in em tempo real. Separa crianças por salas, gerencia fila de visitantes e o processo de retirada segura via QR Code ou foto.
- **Louvor:**
  - **Finalidade:** Gestão técnica e musical.
  - **O que faz:** Centraliza o elenco (quem toca o quê), repertório (cifras/letras) e escalas por instrumento. Inclui o "Modo Palco" para facilitar a leitura durante o culto.
- **Livraria:**
  - **Finalidade:** E-commerce interno.
  - **O que faz:** Catálogo de produtos oficiais. Membros compram e pagam via PIX integrado, e o sistema gerencia a fila de retirada e o estoque.
- **Cantina:**
  - **Finalidade:** Gestão de alimentação em eventos.
  - **O que faz:** Cardápio digital para reservas. O membro reserva o lanche, e a equipe da cozinha visualiza a demanda em tempo real em um painel específico.
- **Meu Perfil:**
  - **Finalidade:** Autoatendimento do membro.
  - **O que faz:** Permite atualizar dados pessoais (endereço, telefone) e visualizar suas próprias escalas, dons e cursos realizados. É onde o primeiro admin pode "reivindicar" o controle do sistema.

---

## 4. Guia de Botões e Funcionalidades

### 4.1 Gestão de Membros (`src/components/membros/`)

- **Botão "Novo Membro":** Abre o `MemberWizardDialog`. Funciona em 3 passos:
  1. Dados Pessoais (Nome, Nasc, Sexo).
  2. Contatos (WhatsApp, Endereço).
  3. Eclesiástico (Status Ministerial, Igreja, Foto).
- **Botão "Solicitar Acesso":** (Na Landing Page) Cria um registro na `membership_requests` para aprovação posterior do Admin.
- **Botão "Aprovar":** No painel de solicitações, converte o pedido em um perfil ativo.
- **Botão "Editar Funções":** Permite ao Admin atribuir roles como "Pastor" ou "Líder" a um membro.

### 4.2 Módulo Kids (`src/components/kids/`)

- **Botão "Realizar Check-in":** Abre o `SessionDialog`. Associa uma criança a uma sala e gera um código de segurança.
- **Botão "QR Code":** Gera um QR Code único para o pai. O voluntário pode escanear esse código para abrir a página de checkout.
- **Botão "Capturar Foto":** Aciona a webcam ou câmera do celular via `PhotoInput` para registrar a criança e o responsável.
- **Botão "WhatsApp (Checkout)":** Abre o link `wa.me` com o número do pai para avisar que a criança está pronta para retirada.
- **Botão "Visualizar Fotos":** Exibe imagens armazenadas no Storage privado via `KidsPhoto` (com URLs assinadas temporárias).

### 4.3 Louvor & Palco (`src/components/louvor/`)

- **Botão "Modo Palco":** Ativa a interface `StageMode`. Inverte cores (fundo escuro), aumenta a fonte e remove distrações para uso em tablets.
- **Botão "Adicionar Música":** Abre o `SongDialog` para inserir letras, cifras e links do YouTube/Spotify.
- **Botão "Gerar Escala":** Vincula músicos a datas e instrumentos específicos.

---

## 5. O PRÓXIMO NÍVEL: Planejamento de Expansão (Inovações)

Para tornar a plataforma "Incrível", as seguintes implementações são recomendadas como próximos passos:

### 5.1 Módulo Mídia (Engajamento Digital)

- **Central de Ativos:** Biblioteca de fotos de cultos, logos e templates para as redes sociais das Mesas.
- **Solicitações de Arte:** Formulário para líderes solicitarem artes ao time de design da igreja.

### 5.2 Atos de Amor (Ação Social)

- **Dashboard de Doações:** Acompanhamento de metas de arrecadação de alimentos ou vestuário.
- **Ficha de Assistidos:** Cadastro de famílias atendidas para evitar duplicação e garantir a entrega periódica.

### 5.3 Gamificação & Discipulado (Crescimento)

- **Jornada do Membro:** Barra de progresso visual no perfil ("Novo Membro" -> "Batismo" -> "Cursos" -> "Liderança").
- **Badges/Conquistas:** Medalhas digitais para voluntários com base em horas servidas ou presenças em cursos.

### 5.4 Automação & Notificações

- **Bot no WhatsApp (Integração Gateway):** Envio automático de lembretes de escala e avisos de aniversário sem intervenção humana.
- **Check-in de Culto por Geolocalização:** Confirmar presença apenas ao estar fisicamente na igreja (opcional).

---

## 6. Estrutura de Pastas e Responsabilidades

### 6.1 `/src/components` (UI/UX)

- **`admin/`**: Diálogos para a estrutura organizacional (Igrejas, Redes, Mesas).
- **`kids/`**: Segurança infantil. Inclui `checkin-board` e `visitor-queue`.
- **`louvor/`**: Gestão de músicos e repertório.
- **`ui/`**: Componentes atômicos customizados (Button, Input, Card).

### 6.2 `/src/lib` (Lógica e Integração)

- **`auth-context.tsx`**: O coração do RBAC (Role-Based Access Control).
- **`*.functions.ts`**: RPCs (Server Functions) para operações pesadas ou seguras.
- **`*.server.ts`**: Helpers puramente backend (nunca vazam para o browser).

---

## 7. Design System (Identidade Visual)

### 7.1 Tipografia

- **Títulos:** `Syne` (Impacto e modernidade).
- **Corpo:** `Plus Jakarta Sans` (Legibilidade).
- **Estilo:** Minimalista, inspirado na Apple, com uso generoso de espaços em branco e bordas arredondadas suaves.

### 7.2 Cores (Tokens semânticos)

- **Primary:** Azul institucional.
- **Surface:** Tons de cinza ultra-leves no modo claro, grafite profundo no modo escuro.

---

## 8. Banco de Dados (Schema PostgreSQL)

### 8.1 Tabelas Críticas

- **`profiles`**: Dados centrais do membro.
- **`kids_children` / `kids_guardians`**: Cadastro de menores e seus responsáveis.
- **`worship_songs` / `worship_schedules`**: Base de dados do ministério de louvor.
- **`user_roles`**: Mapeamento de permissões (Admin, Líder, Voluntário).

### 8.2 Segurança (RLS)

- **Políticas Restritivas:** Ninguém vê dados de outros a menos que seja um `admin_geral` ou tenha relação direta (ex: líder de mesa vê seus liderados).
- **Bucket Storage:** O bucket `kids-photos` é privado. O acesso é feito via `getSignedUrl` no servidor.

---

## 9. Checklist de Replicação

1. **Infra:** Configurar projeto no Supabase com Storage (`kids-photos` privado).
2. **Schema:** Aplicar migrations de Enums (`app_role`, `ministerial_status`) e tabelas.
3. **Frontend:** Instalar TanStack Start, Tailwind v4 e Radix UI.
4. **Auth:** Configurar Google Auth (URI de redirecionamento: `/auth/callback`).
5. **Storage:** Criar buckets e definir políticas RLS para upload e leitura.

---

Este documento serve como a "Bússola Técnica" da plataforma Igreja Batista Atos. Replicar este sistema exige seguir a ordem das migrations e garantir que os componentes de UI respeitem os tokens definidos em `styles.css`.
