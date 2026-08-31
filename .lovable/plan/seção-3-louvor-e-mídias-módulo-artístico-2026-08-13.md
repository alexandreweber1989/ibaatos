# Seção 3 — Louvor e Mídias (Módulo Artístico)

Este módulo foca na experiência do time de Louvor e na gestão de ativos de comunicação da igreja.

## 3.1 Louvor: Cifrateca e Repertório (Melhoria)

- **Gestão de Músicas**: Cadastro de músicas com tom, BPM, link do YouTube, Spotify e letra.
- **Integração com Cifras**: Upload de PDF ou link externo para cifras.
- **Setlists**: Criação de listas de músicas para cultos específicos, vinculadas à escala.
- **Histórico de Execução**: Ver quando uma música foi tocada pela última vez para evitar repetição excessiva.

## 3.2 Escalas e Elenco (Melhoria)

- **Escalador Inteligente**: Sugestão de músicos baseada na disponibilidade e instrumentos.
- **Confirmação de Escala**: O músico recebe notificação (via mural/avisos) e confirma presença.
- **Funções Específicas**: Divisão por instrumento (Voz, Violão, Guitarra, Baixo, Bateria, Teclado, etc.).

## 3.3 Central de Mídia (Melhoria)

- **Solicitações de Arte**: Fluxo de pedido de artes para eventos (título, descrição, formato, prazo).
- **Status da Solicitação**: Fila de trabalho para o time de design (Pendente, Em Produção, Revisão, Concluído).
- **Biblioteca de Ativos**: Organização por pastas/categorias de logos, fotos oficiais e templates.

## 3.4 Notícias e Mural (Novo)

- **Portal de Notícias**: Feed de notícias da igreja com fotos e textos formatados.
- **Integração com Avisos**: Transformar um aviso importante em uma notícia de destaque.

## Detalhes técnicos

- **Tabelas**: `songs` (músicas), `setlists` (listas de músicas), `setlist_songs` (relação), `media_requests` (pedidos de arte - _já existe, mas precisa de fluxo_), `news` (notícias).
- **RLS**: Membros do Louvor leem repertório e escalas; Admins do Louvor editam. Mídia é aberto para pedidos, mas gestão é restrita.
- **Componentes**: Upgrade nos componentes em `src/components/louvor/` e `src/components/midia/`.

Ordem de entrega: 3.1 (Repertório) → 3.2 (Setlists/Escalas) → 3.3 (Fluxo de Mídia) → 3.4 (Notícias).
