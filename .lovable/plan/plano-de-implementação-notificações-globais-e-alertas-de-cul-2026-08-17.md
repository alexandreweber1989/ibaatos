# Plano de Implementação: Notificações Globais e Alertas de Culto

Este plano descreve como implementar um sistema de notificações em massa para todos os membros, permitindo que a liderança informe sobre o início, término de cultos ou eventos importantes, garantindo que todos estejam sincronizados.

## 1. Infraestrutura de Notificações

- **Criação de Função de Servidor:** Desenvolver uma nova `serverFn` em `src/lib/notifications.functions.ts` chamada `notifyAllMembers`.
- **Targeting:** A função buscará todos os usuários ativos na tabela `profiles` que possuem permissão de recebimento.
- **Integração Push:** Chamará o endpoint `/api/public/notifications` para registrar as notificações no histórico do app e disparar o log de push.
- **Histórico:** Garantir que as notificações fiquem salvas para consulta posterior no sino de notificações.

## 2. Interface de Disparo (Admin)

- **Painel de Controle:** Adicionar uma nova seção no "Painel Operacional" ou no "Manual" (acesso Admin) para disparos rápidos.
- **Templates Rápidos:** Botões de "Culto Iniciado", "Culto Encerrado" e "Aviso Geral" para agilizar o processo.
- **Feedback em Tempo Real:** Mostrar o progresso do disparo e o número de membros alcançados.

## 3. Experiência do Usuário (Membro)

- **Alerta Visual:** Notificação push no celular (simulada via API) e destaque no sino de notificações do app.
- **Sincronização:** O alerta incluirá o horário exato da ação (início/fim) para evitar confusões.

## Detalhes Técnicos

- **TanStack Start:** Uso de `createServerFn` com middleware de autenticação (apenas `admin_geral`).
- **Supabase Admin:** Uso de `supabaseAdmin` no servidor para buscar a lista global de e-mails/IDs sem restrições de RLS de leitura.
- **Escalabilidade:** Implementação de processamento em lote (batch) caso a igreja possua milhares de membros.
