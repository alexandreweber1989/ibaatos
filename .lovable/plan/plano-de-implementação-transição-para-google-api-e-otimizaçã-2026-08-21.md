# Plano de Implementação: Transição para Google API e Otimização de Custos

O objetivo é substituir as automações que dependem da OpenAI por serviços gratuitos utilizando a Google API (YouTube Data API e Gemini API) para garantir a funcionalidade sem custos de tokens, mantendo a experiência do usuário.

## Alterações Propostas

### Backend e Automações

- **Youtube Data API**: Substituir a extração baseada em IA por chamadas diretas à API do YouTube para obter metadados reais, datas de publicação e buscar vídeos históricos.
- **Google Gemini API**: Utilizar o modelo `gemini-1.5-flash` (que possui tier gratuito generoso) para substituir a `gpt-4o-mini` nos resumos de pregações e análise de metadados.
- **Normalização de Gateway**: Criar um novo utilitário `src/lib/google-gateway.server.ts` para centralizar as chamadas ao Gemini.

### Segurança e Configuração

- Adicionar suporte a `GOOGLE_API_KEY` nos segredos da plataforma.
- Atualizar `ai-gateway.server.ts` para atuar como fallback ou migrar totalmente para a solução gratuita.

### UI e UX

- Manter a interface atual, mas garantir que as mensagens de erro de "Chave Ausente" apontem agora para a necessidade da chave do Google caso o usuário prefira a via gratuita.

## Detalhes Técnicos

- **Nova Dependência**: Nenhuma necessária (usaremos `fetch` para as APIs REST da Google).
- **Limites**: O Google Gemini permite até 15 RPM (requisições por minuto) no tier gratuito, o que é suficiente para o uso da igreja.
- **YouTube API**: A cota diária gratuita de 10.000 unidades permite centenas de buscas de vídeos e metadados por dia.

## Plano de Ação

1. Criar `src/lib/google-gateway.server.ts`.
2. Modificar `src/lib/youtube.server.ts` para usar YouTube Data API.
3. Modificar `src/lib/sermon-ai.server.ts` para usar Gemini.
4. Atualizar as rotas de API para utilizar os novos provedores.
