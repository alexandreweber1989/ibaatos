# Plano de Implementação - Módulo de Cuidado e Oração (Parte 9)

Este plano descreve a implementação do sistema de Solicitação de Oração/Aconselhamento e Integração com Assistência Social (Atos de Amor).

## 1. Banco de Dados (Supabase)

### Tabelas

- `prayer_requests`:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK profiles) - Quem solicitou
  - `mesa_id` (UUID, FK mesas) - Mesa do usuário no momento do pedido
  - `category` (TEXT: 'prayer', 'counseling')
  - `content` (TEXT)
  - `is_private` (BOOLEAN, default true)
  - `status` (TEXT: 'pending', 'replied')
  - `response` (TEXT)
  - `responded_at` (TIMESTAMPTZ)
  - RLS:
    - Usuário pode ver seus pedidos.
    - Líder da Mesa (pastor/apascentador/líder) pode ver pedidos da sua mesa.
- `social_assistance_requests`:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK profiles)
  - `needs_food` (BOOLEAN)
  - `description` (TEXT)
  - `status` (TEXT: 'pending', 'in_review', 'completed')
  - RLS:
    - Usuário pode ver seus pedidos.
    - Admins e membros com papel 'social_worker' (ou responsável Atos de Amor) podem ver/editar.

### Funções e Triggers

- Notificações automáticas via Push/Aviso quando um novo pedido de oração ou assistência social for criado.

## 2. Frontend (React/TanStack)

### Novas Páginas/Componentes

- `src/routes/_authenticated/cuidado.tsx`: Página central para solicitações.
- `src/components/cuidado/prayer-request-form.tsx`: Formulário com a especificação de privacidade (somente o líder da mesa verá).
- `src/components/cuidado/social-assistance-form.tsx`: Formulário para pedido de ajuda (Atos de Amor).
- `src/components/cuidado/prayer-management.tsx`: Interface para o líder visualizar e responder aos pedidos.
- `src/components/cuidado/social-management.tsx`: Interface para o pessoal do Atos de Amor gerenciar as solicitações.

### Integração no Dashboard

- Adição de widgets rápidos para solicitar oração ou comida.
- Contador de pedidos pendentes para líderes.

## 3. Segurança e Regras de Negócio

- **Privacidade de Oração:** O texto da UI deixará claro que apenas o responsável direto pela Mesa terá acesso ao conteúdo.
- **Hierarquia:** A consulta de pedidos de oração filtrará por `mesa_id` e verificará se o `auth.uid()` é o líder daquela mesa no perfil.

## 4. Comunicação

- Notificação push para o líder quando receber um pedido.
- Notificação push para o solicitante quando o líder responder que "irá colocar em suas orações".
