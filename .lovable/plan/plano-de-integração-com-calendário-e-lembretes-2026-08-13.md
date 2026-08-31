# Plano de Integração com Calendário e Lembretes

Implementar um sistema completo de calendário que permite salvar eventos nas principais agendas (Google, Outlook, Apple) e configurar lembretes personalizados.

## Alterações Técnicas

### Frontend

- **Utilitários de Calendário**: Criado `src/lib/calendar-utils.ts` com geradores de URL para Google e Outlook, e exportação .ics para iCal/Apple.
- **Componente AddToCalendar**: Criado `src/components/agenda/add-to-calendar.tsx` com menu dropdown para seleção de agenda.
- **Integração no EventCard**: Botão adicionado aos cards de evento para facilitar o acesso.
- **Configuração de Lembretes**: Atualização do formulário de eventos para permitir que administradores definam lembretes padrão (tempo de antecedência e canal).

### Banco de Dados

- **Schema**: Adição da coluna `reminder_settings` na tabela `events`.
- **Nova Tabela**: Criada `event_reminders` para rastrear inscrições individuais de usuários em lembretes, com RLS configurado.

### Backend/Infra

- **Compatibilidade**: Garantido suporte universal (iOS/Android) via deep-links de calendário e arquivos .ics.

## Próximos Passos

1. Integrar com o sistema de notificações push existente para disparar os lembretes.
2. Criar uma Edge Function/Cron Job para verificar lembretes pendentes e enviá-los no horário correto.
