# Notificações no celular (Web Push)

Sistema **gratuito**: usa o push do próprio navegador (Google/Mozilla/Apple),
autenticado por chaves VAPID da igreja. Não há serviço pago nem custo por
mensagem enviada.

## Configuração

**Não é preciso configurar nada.** As chaves VAPID são derivadas
automaticamente, de forma determinística, a partir da credencial de servidor do
Supabase — a mesma que o cliente admin usa, venha ela de variável de ambiente ou
do valor embutido no arquivo gerado `client.server.ts`. Resultado: as mesmas
chaves a cada requisição, e as assinaturas dos celulares seguem válidas entre
deploys.

Ordem de prioridade, se você quiser assumir o controle:

1. **Variáveis de ambiente** (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `VAPID_SUBJECT`) — definidas **no serviço que publica o site** (a Vercel;
   variáveis do Lovable não chegam até lá).
2. **Tabela `push_config`** — se existir uma linha gravada.
3. **Derivação automática** — o padrão, sem configuração.

> Atenção ao trocar de método: chaves diferentes invalidam as assinaturas já
> feitas, e cada pessoa precisa tocar em **Ativar** de novo.

## Como o membro ativa

1. Abre **Meu perfil** e toca em **Ativar** no cartão de notificações.
2. Aceita a permissão do navegador.

**iPhone:** a Apple só entrega push para apps instalados. O membro precisa tocar
em _Compartilhar → Adicionar à Tela de Início_ e abrir o app por ali. O próprio
cartão exibe essa instrução automaticamente quando detecta iPhone.

## Como a igreja envia

Botão **Notificar** no topo do painel (somente admin geral):

- escolhe o público: toda a igreja, liderança, uma rede, uma mesa ou um ministério;
- escreve título e mensagem (há modelos rápidos);
- vê a **prévia** de como aparece no celular antes de enviar.

Cada envio fica registrado em `notifications_history`, inclusive para quem ainda
não ativou as notificações (com status `sem_aparelho`).

## Manutenção

Assinaturas expiradas (app desinstalado, navegador limpo) retornam 404/410 e são
**removidas automaticamente** a cada envio — a base se mantém limpa sozinha.
