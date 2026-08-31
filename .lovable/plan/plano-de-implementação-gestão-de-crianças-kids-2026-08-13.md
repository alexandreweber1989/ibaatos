# Plano de Implementação: Gestão de Crianças (Kids)

Implementação completa das funcionalidades de gerenciamento infantil, incluindo avisos de emergência, histórico de presença e pré-cadastro de visitantes.

## Alterações de Banco de Dados

### Tabelas Existentes (Verificadas)

- `kids_children`: Cadastro central das crianças.
- `kids_guardians`: Responsáveis pelas crianças.
- `kids_sessions`: Sessões de culto/eventos.
- `kids_checkins`: Registro de entrada/saída.
- `kids_visitor_requests`: Pré-cadastro de visitantes.

### Novas Funcionalidades de Dados

- Adicionar suporte a notificações na tabela `kids_checkins` ou criar uma tabela `kids_notifications` para rastrear avisos de emergência.
- Garantir que as policies RLS permitam que pais vejam apenas suas crianças (via `kids_guardians` -> `profiles`).

## Funcionalidades Principais

### 1. Aviso de Emergência

- Criar um componente de notificação rápida no `CheckinBoard` para líderes do Kids.
- Implementar uma Server Function para disparar notificações (Push via Supabase, E-mail e SMS simulados ou integrados).
- Adicionar um widget no Dashboard do Responsável para "Resposta Rápida" (Confirmar Recebimento).

### 2. Histórico de Presença & Relatórios

- Criar uma nova rota/página `src/routes/_authenticated/kids.relatorios.tsx`.
- Implementar filtros por data, criança e líder.
- Adicionar funcionalidade de exportação para CSV (nativo do navegador) e PDF (usando uma biblioteca leve ou print-friendly CSS).

### 3. Sala de Visitantes (Melhorias)

- Atualizar o formulário em `src/routes/kids.visitante.tsx` para incluir upload de documentos (armazenamento no bucket `kids-photos`).
- Adicionar confirmação visual e por e-mail/SMS após o pré-cadastro.
- Melhorar a integração na `VisitorQueue` para que a aprovação vincule automaticamente o histórico.

## Componentes UI

- **EmergencyDialog**: Modal de confirmação e disparo de alerta.
- **AttendanceReport**: Tabela rica com filtros e exportação.
- **VisitorForm**: Refatoração do formulário atual com suporte a arquivos.

## Considerações Técnicas

- **Segurança**: RLS estrito em todas as tabelas Kids.
- **Escalabilidade**: Uso de índices em `child_id` e `session_id`.
- **Responsividade**: Garantir que o painel de check-in funcione perfeitamente em tablets (Kiosk mode).

## Próximos Passos

1. Executar migration para suporte a notificações.
2. Implementar a lógica de disparo de emergência.
3. Criar a página de relatórios e exportação.
4. Refinar o fluxo de visitantes com upload de documentos.
