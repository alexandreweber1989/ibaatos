# Plano de Expansão: Experiência do Visitante (IBA)

Este plano detalha a implementação de uma experiência interativa e acolhedora para novos visitantes na plataforma da Igreja Batista Atos, focando em transformar o primeiro contato em uma jornada de pertencimento.

## Objetivos

- Facilitar o primeiro passo do visitante de forma lúdica e tecnológica.
- Proporcionar uma recepção personalizada e ágil.
- Criar um senso imediato de comunidade e cuidado pastoral.

## Ações de Implementação

### 1. Portal do Visitante (QR Code Acolhedor)

Criar uma rota pública `/boas-vindas` otimizada para mobile, acessível via QR Code impresso nos bancos ou telão da igreja.

- **Interatividade:** Um vídeo curto de boas-vindas do Pastor Geraldo e um formulário "Express" (apenas Nome e WhatsApp).
- **Gamificação:** Ao preencher, o visitante ganha um "Presente de Boas-Vindas" (ex: um devocional digital ou um café gratuito na cantina).

### 2. Dashboard do Visitante (Primeiros Passos)

Ao realizar o cadastro inicial, o visitante terá acesso a um dashboard simplificado (antes da aprovação total de membro) contendo:

- **Trilha "Minha Primeira Semana":** Dicas de como se conectar, onde ficam os banheiros/kids e o convite para a Mesa mais próxima.
- **Radar de Mesas:** Um mapa interativo mostrando as Mesas que acontecem naquela semana perto de onde ele mora.

### 3. Integração em Tempo Real (WhatsApp & Boas-Vindas)

- **Automação de Boas-Vindas:** Disparo imediato de uma mensagem personalizada via WhatsApp assim que o visitante preenche o QR Code.
- **Alerta de Anfitrião:** Notificação em tempo real para o "Ministério de Recepção" no painel administrativo, permitindo que alguém vá falar pessoalmente com o visitante ainda durante o culto.

### 4. Mural de Conexões

- Uma seção onde o visitante pode ver fotos e depoimentos curtos de pessoas que eram visitantes há pouco tempo e hoje fazem parte de uma Mesa, gerando prova social e empatia.

## Detalhes Técnicos

- **Frontend:** Nova rota pública `src/routes/boas-vindas.tsx`.
- **Backend:** Nova tabela `visitor_checkins` para rastrear o fluxo de visitantes dominicais separadamente dos leads de marketing.
- **Integração:** Webhook para disparo de WhatsApp via API Gateway.
- **Storage:** Bucket para entrega do "Devocional de Boas-Vindas" (PDF).

## Verificação

- Testar o fluxo completo mobile-first (escaneamento de QR Code -> preenchimento -> recebimento de devocional).
- Validar se o alerta de anfitrião chega em menos de 10 segundos no painel admin.
