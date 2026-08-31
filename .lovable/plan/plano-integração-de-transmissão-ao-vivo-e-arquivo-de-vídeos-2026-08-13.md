# Plano: Integração de Transmissão ao Vivo e Arquivo de Vídeos (YouTube)

Implementar uma integração robusta com o canal do YouTube da igreja, permitindo que os membros assistam aos cultos ao vivo e acessem o arquivo de vídeos diretamente na plataforma.

## Ações Realizadas

### 1. Backend e API

- **Nova Rota de API (`/api/public/live-status`)**: Criada para verificar o status da transmissão ao vivo. Atualmente configurada com um mock que pode ser estendido para consultar a API do YouTube Data V3 no futuro.
- **Memória do Projeto**: Registrada a nova funcionalidade em `mem://features/worship-live-stream.md` para persistência de contexto.

### 2. Componentes de UI

- **`LiveStreamCard`**: Um novo componente premium com glassmorphism que detecta se há uma live ativa.
  - Se ativo: Mostra o player do YouTube embutido com badge de "AO VIVO".
  - Se inativo: Mostra um convite para o canal com o horário dos cultos (Domingos às 19:00).
- **Aperfeiçoamento da Central de Mídia**: Adicionada uma nova aba "Transmissão" na rota `/midia`, permitindo acesso organizado ao player e playlists temáticas.

### 3. Integração com o Dashboard

- **Destaque no Painel Principal**: O `LiveStreamCard` foi posicionado estrategicamente no dashboard dos membros para que, ao entrar na plataforma no domingo, o culto seja a primeira coisa visível.

## Detalhes Técnicos

- **Tecnologias**: TanStack Query para fetching de status, Lucide React para iconografia, Tailwind v4 para estilização.
- **Responsividade**: O player se ajusta automaticamente (aspect-ratio video) em dispositivos móveis e desktop.
- **Configuração**: O ID do canal utilizado para teste é o da Igreja Batista Atos.

---

### Relatório de Execução

**Padrão utilizado:** Feature Extension & Media Integration

**Sub-agentes ativados:**

- **UI Architect** — [X] Executado
- **Supabase Engineer** — [X] Executado
- **Code Auditor** — [X] Executado
- **Testing Agent** — [-] Não necessário
- **SEO Optimizer** — [-] Não necessário
- **Deploy Ops** — [-] Não necessário
- **API Integrator** — [X] Executado

**Resumo:** Implementada a integração com YouTube para transmissões ao vivo e arquivo de vídeos, com presença no Dashboard e na Central de Mídia.

**Arquivos modificados:** 5

**Próximos passos sugeridos:**

- Configurar uma API Key do YouTube no backend para detecção 100% automática de lives.
- Adicionar suporte a chat em tempo real ao lado do player de vídeo.
