# Plano de Implementação: Gestão Kids (Fase 2)

Integração de alertas reais, armazenamento de documentos e notificações push.

## Objetivo

Finalizar o módulo Kids com funcionalidades críticas de segurança e comunicação.

## Alterações Técnicas

### 1. Banco de Dados e Storage (Lovable Cloud)

- **Bucket `kids-documents`**: Criação do bucket privado para armazenamento seguro de documentos (RG/CPF) das crianças visitantes.
- **Tabela `user_push_tokens`**: Armazenamento de tokens de dispositivos para notificações push.
- **Tabela `notifications_history`**: Registro de envios para auditoria e exibição no app.
- **RLS**: Políticas restritivas garantindo que apenas líderes Kids e o próprio usuário acessem os tokens e documentos.

### 2. Backend (TanStack Server Routes)

- **`api/public/notifications`**: Endpoint para processar e disparar notificações push (simulado via log, pronto para integração com FCM/OneSignal).
- **`api/public/sms-whatsapp`**: Endpoint para integração com serviços de mensageria (SMS/WhatsApp) para alertas de emergência.
- **`api/public/kids-visitor`**: Atualização para aceitar o link do documento enviado.

### 3. Frontend (React/TanStack Start)

- **`kids.visitante.tsx`**: Implementação do upload real de arquivos para o Supabase Storage antes de finalizar o cadastro.
- **`emergency-alert-button.tsx`**: Integração do botão de emergência com as novas rotas de API para disparo real de mensagens e push.
- **`use-push-notifications.ts`**: Hook para capturar e registrar o token de notificação do usuário ao logar.

## Validação

- Teste de upload de documento no formulário de visitante.
- Teste de disparo de alerta (verificação de logs de servidor).
- Verificação de tipos TypeScript para evitar erros de compilação.
