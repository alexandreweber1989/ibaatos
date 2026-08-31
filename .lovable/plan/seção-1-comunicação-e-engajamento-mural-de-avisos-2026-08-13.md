# Seção 1 — Comunicação e engajamento (Mural de Avisos)

Entrego a Seção 1 inteira. As próximas seções virão uma a uma, cada uma com seu plano para você aprovar.

## O que será feito

### 1. Mural de Avisos

- Nova página **Avisos** no menu lateral, visível para todos os membros.
- Cada aviso tem: título, texto, categoria (Aviso, Comunicado, Urgente, Louvor/Ação), data de publicação e data de expiração opcional.
- **Alcance do aviso**: Igreja inteira, uma Igreja específica, um Ministério, uma Rede ou uma Mesa. O membro só vê os avisos que valem para ele.
- Avisos fixados aparecem no topo com destaque.
- Avisos expirados somem automaticamente da lista dos membros.

### 2. Quem pode publicar

- **Admin geral**: publica para qualquer alcance.
- **Admin de ministério**: publica para o seu ministério.
- **Líder de mesa**: publica para a sua mesa.
- Membro comum apenas lê.
- Editor com pré-visualização, botão de rascunho e publicação.

### 3. Marcação de leitura

- Cada aviso mostra se já foi lido pela pessoa.
- Contador de "não lidos" no sino de notificações, junto com as pendências que já existem hoje.
- Quem publicou vê quantas pessoas já leram.

### 4. Destaque no Painel

- Bloco "Avisos recentes" no painel inicial, mostrando os 3 avisos mais relevantes (fixados primeiro), com link para a página completa.

## Fora desta seção

- **Push no celular** depende do app instalável (PWA) — fica para a Seção 11, e aí os avisos já disparam notificação.
- **Newsletter semanal por e-mail** — pode entrar depois como complemento, se você quiser.

## Detalhes técnicos

- Tabelas novas: `announcements` (título, corpo, categoria, alcance, ids de igreja/ministério/rede/mesa, fixado, publicado_em, expira_em, autor) e `announcement_reads` (aviso, usuário, lido_em).
- RLS: leitura liberada só para quem pertence ao alcance do aviso (funções `has_ministry_role`, `has_mesa_role` e vínculo do perfil com a igreja); escrita restrita a admin geral, admin do ministério e líder da mesa correspondente.
- Front: rota `/avisos` sob `_authenticated`, componentes em `src/components/avisos/`, integração no `app-shell`, no `notifications-bell` e no painel.
