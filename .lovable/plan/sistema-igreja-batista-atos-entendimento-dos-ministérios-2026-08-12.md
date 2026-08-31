# Sistema Igreja Batista Atos — Entendimento dos Ministérios

Antes de codar, aqui está o que entendi de cada ministério e como proponho estruturar. Confirma / corrige o que estiver errado e a gente parte para a Fase 1.

---

## Adendo — Livraria e Cantina (novos módulos)

Dois módulos independentes (não são ministérios), acessíveis pelo menu principal, com admins próprios via novos papéis `admin_livraria` e `admin_cantina`.

### Livraria

Venda interna de livros, camisetas, garrafas, insumos etc. Pagamento **somente via PIX** (CNPJ da igreja). Retirada presencial.

Fluxo de compra:

1. Membro navega catálogo público (foto, nome, descrição, preço, estoque).
2. Adiciona ao carrinho e finaliza pedido.
3. Sistema gera **código de retirada** (ex.: `LIV-8FK2`) + mostra dados PIX (chave CNPJ, valor, copia-e-cola).
4. Membro anexa comprovante no pedido.
5. Admin da Livraria confirma pagamento manualmente → status "Pronto para retirada".
6. No balcão, admin busca pelo código, marca "Entregue", estoque decrementa.

Painel admin: CRUD de produtos, fila de pedidos por status, relatório simples (total do mês, mais vendido).

Tabelas novas: `products`, `orders`, `order_items`.

### Cantina

Por hora, foco em **divulgação + reserva** (sem pagamento na plataforma).

Fluxo:

1. Admin publica o **cardápio do culto** (itens do dia com arte/foto, descrição, preço). Cardápio tem data/evento associado.
2. Membro reserva pedido antes do culto ("2 brigadeiros + 1 café") — sem cobrança antecipada.
3. Sistema gera código de retirada.
4. Admin vê lista de reservas do culto com totais agregados (ex.: "18 brigadeiros no total") — ajuda produção por demanda.
5. No balcão, admin marca como retirado/pago.
6. Ao final, cardápio é arquivado.

Painel admin: CRUD de itens reutilizáveis, criação de cardápio do culto, lista de reservas com agregados.

Tabelas novas: `canteen_items`, `canteen_menus`, `canteen_menu_items`, `canteen_reservations`, `canteen_reservation_items`.

Futuro: pagamento antecipado via PIX na plataforma, mesma lógica de código de retirada.

---

## 1. Louvor

**Entendi:** Instrumentos = violão, guitarra, baixo, bateria, teclado + vocais. Cada ministro que é escalado no domingo (ou evento) monta sua própria equipe, escolhe local e horário do ensaio, e define o repertório.

**No sistema:**

- **Escala flexível por evento:** ao ser escalado, o ministro cria o "chamado" daquele culto — define data/local/horário do ensaio, escolhe os integrantes por instrumento, e envia notificação para o grupo.
- **Confirmação de presença** por cada integrante (aceitar / recusar / sugerir troca).
- **Repertório do culto:** o ministro monta um setlist arrastando músicas do banco.
- **Banco de músicas (cifrateca):** título, artista, tom, andamento (BPM), letra, cifra (texto/PDF), link de referência (YouTube/Spotify), áudio. Fica acumulando com o tempo — próxima escala já reaproveita.
- **Histórico:** o que foi tocado em cada culto, quem tocou o quê.

---

## 2. Mídia

**Entendi:** Centraliza fotos/vídeos da igreja, integra com armazenamento externo (Google Drive), tem equipe escalada por culto/evento, e recebe **solicitações de outros ministérios** (artes, acessórios, cobertura de evento).

**No sistema:**

- **Escala por culto/evento** (funções: câmera, projeção, transmissão, foto, edição).
- **Biblioteca de mídia:** upload direto no sistema + link para pastas do Google Drive (integração com Google Drive para não duplicar arquivos pesados). Organizado por data/evento/tags.
- **Central de solicitações:** qualquer líder de ministério, rede ou membro autorizado abre um chamado (ex.: "preciso de arte para evento das Mulheres dia 20", "preciso de projeção com letra grande no culto de oração"). Campos: tipo (arte/foto/vídeo/projeção/transmissão), prazo, descrição, referências anexas. A Mídia recebe, atribui responsável, muda status (pendente → em produção → entregue).
- **Roteiro do culto** (avisos para telão, ordem de vídeos).

---

## 3. Dança

**Entendi:** Grupo pequeno, escala basicamente dominical, forte componente de comunidade — troca de referências, marcar ensaios.

**No sistema:**

- **Escala dominical simples.**
- **Marcação de ensaios avulsos** (data/local/quem vai).
- **Mural do grupo:** chat/feed interno com anexo de vídeos (YouTube/Instagram), coreografias salvas, ideias.
- **Presença nos ensaios.**

---

## 4. Mulheres — Rede Sabaoth

**Entendi:** Sem líder fixo, mas alguém organiza. Estrutura em **Mesas** (cada mulher pertence a uma Mesa). Eventos podem ser:

- por Mesa específica (só as mulheres daquela Mesa),
- da Rede inteira (todas as mulheres).

**No sistema:**

- **Rede Sabaoth** como ministério guarda-chuva.
- **Mesas** cadastradas dentro da Rede, cada uma com suas participantes.
- **Eventos com escopo:** ao criar um evento, escolhe "Mesa X" ou "Toda a Rede". Só quem tem escopo vê e é convidado.
- **Organizador do evento** (não precisa ser "líder" fixo — qualquer autorizada abre o evento).
- Confirmação de presença, lembretes.

---

## 5. Homens — Rede Zadoque

**Entendi:** Mesma estrutura da Rede Sabaoth (Mesas + eventos por Mesa ou da Rede toda).

**No sistema:** idêntico ao item 4, adaptado para Zadoque.

---

## 6. Jovens — Rede Social interna

**Entendi:** Encontros regulares com o líder + uma **mini rede social** própria: chat, emojis, figurinhas, anexos. Precisa de **moderação prévia** — mensagens passam por filtro antes de aparecer, para bloquear conteúdo impróprio (erótico, ofensivo).

**No sistema:**

- **Feed jovem** (posts curtos com foto, reações com emoji, comentários).
- **Chat em grupo** com figurinhas/emojis/anexos.
- **Filtro automático** (dicionário de palavras proibidas + IA leve para conteúdo sexual/violento). Mensagem suspeita fica **pendente de aprovação do líder** antes de aparecer para o grupo.
- **Alertas para o líder** quando algo é bloqueado.
- **Eventos e escalas** dos Jovens.

---

## 7. Adolescentes — Rede de Adolescentes (7–15 anos)

**Entendi:** Mesma pegada dos Jovens, público mais novo. Filtro precisa ser mais rígido.

**No sistema:** igual ao 6, com moderação mais estrita + consentimento dos pais no cadastro do adolescente.

---

## 8. Kids — Check-in seguro (prioridade alta)

**Entendi:** Ministério infantil, controle de entrada/saída da sala durante o culto. Cada criança tem responsáveis autorizados. Para retirar a criança, o responsável apresenta QR code que identifica **quem é ele** e **qual criança está retirando**. Professor confere foto do responsável + foto da criança.

**No sistema:**

- **Cadastro da criança:** nome, idade, turma, foto, alergias, observações médicas, restrições alimentares.
- **Responsáveis autorizados:** lista de pessoas (pai, mãe, avós, tios) com **foto e nome**. Cada responsável tem um **QR code único** no app/perfil.
- **Check-in:** ao chegar, professor escaneia QR do responsável → sistema mostra qual(is) criança(s) ele está deixando → confirma → criança entra "presente na sala".
- **Check-out:** responsável apresenta QR → sistema mostra foto do responsável, foto da criança, e confirma que aquele responsável está autorizado → professor libera. Se responsável não autorizado, sistema **bloqueia e alerta**.
- **Painel do professor:** quem está na sala agora, quem já saiu, com quem saiu, horário.
- **Histórico completo** (auditoria).
- **Alerta de alergia/emergência** destacado no card da criança.

---

## 9. Atos de Amor — Projeto Social

**Entendi:** Cada Rede junta alimentos/cestas ao longo do mês. No **primeiro domingo do mês (ceia)** tudo é reunido, cestas são montadas e entregues a famílias necessitadas da igreja.

**No sistema:**

- **Campanha mensal:** aberta automaticamente, fecha na ceia.
- **Registro de doações por Rede/Mesa:** cada Mesa lança o que arrecadou (X kg de arroz, Y latas...). Placar por Rede.
- **Estoque em tempo real** do que já foi arrecadado.
- **Cadastro de famílias assistidas** (privado, só líderes de Atos de Amor veem): nome, composição familiar, endereço, necessidades específicas, histórico de entregas.
- **Montagem das cestas:** define quantas cestas e o que vai em cada uma.
- **Registro de entrega** (data, quem entregou, foto opcional).
- **Relatório mensal:** quanto foi arrecadado, quantas famílias atendidas.

---

## Elementos comuns a todos os ministérios

- Página pública do ministério (só para membros logados) com: sobre, líderes, próximos eventos, mural.
- Escala + confirmação + lembrete.
- Mural de avisos.
- Chat/grupo interno.
- Biblioteca de arquivos.

---

## Como o sistema se organiza (alto nível)

```text
Igreja Batista Atos
├── Membros (perfil único do membro, participa de N ministérios)
├── Ministérios (Louvor, Mídia, Dança, Kids, Atos de Amor...)
├── Redes (Sabaoth, Zadoque, Jovens, Adolescentes)
│   └── Mesas (subgrupos dentro da rede)
├── Eventos & Cultos (escopo: geral / ministério / rede / mesa)
├── Escalas (por evento, por função)
├── Portal de Notícias (fase 3 — depois)
└── Financeiro (fase posterior)
```

## Papéis

- **Admin geral (pastor/secretaria)** — acesso total ao sistema.
- **Admin de ministério** — um ou mais por ministério. Só ele pode editar o ministério, criar/editar escalas, publicar avisos, enviar mensagens "como admin" no grupo, aprovar solicitações (ex.: Mídia), moderar chat (Jovens/Ados). Um membro pode ser admin de vários ministérios ao mesmo tempo.
- **Líder de Mesa** — admin da sua Mesa (edita a mesa, adiciona/remove membros, marca encontros, publica no mural da Mesa). Uma Mesa pode ter mais de um líder.
- **Membro** — vê o que é seu, confirma escalas, participa dos grupos e da Mesa.
- **Responsável Kids** — perfil especial só com QR de check-in/out dos filhos.

Regra técnica: papéis ficam em tabela separada (`user_roles`) com escopo (`ministry_id` ou `mesa_id` quando aplicável), nunca no perfil — evita escalonamento de privilégio. Verificação via função `has_role(user, role, scope)` com `SECURITY DEFINER`.

## Mesas (grupos de comunhão semanal)

**Entendi:** Mesas são pequenos grupos que se reúnem durante a semana para comunhão. Cada Mesa tem líder(es) e membros. Todo membro da igreja idealmente pertence a uma Mesa. Além disso, Mesas existem **dentro das Redes** (Sabaoth para mulheres, Zadoque para homens) para eventos segmentados.

**No sistema — cadastro completo de Mesa:**

- Nome da Mesa, foto/identidade, descrição.
- **Líder(es)** — recebem papel `mesa_leader` com escopo daquela Mesa.
- **Membros da Mesa** — lista, com data de entrada.
- **Encontros regulares:** dia da semana, horário e local padrão (ex.: "quarta 20h, casa do João").
- **Encontros pontuais / avisos** publicados pelo líder.
- **Mural interno da Mesa** (posts, fotos do encontro, pedidos de oração da Mesa).
- **Presença nos encontros** (opcional — líder marca quem veio).
- **Relatório semanal** curto que o líder envia (quantos presentes, visitantes, destaques).
- **Vínculo com Rede:** ao criar a Mesa, opcionalmente vincula a uma Rede (Sabaoth / Zadoque / mista) — habilita os eventos por escopo descritos nas seções 4 e 5.
- **Visibilidade:** membros da Mesa veem o interno; admin geral e líder da Rede vinculada também.

Isso substitui e detalha o que estava só como "Mesas" no diagrama.

## Stack

TanStack Start + React + Tailwind v4 · Lovable Cloud (Postgres + Auth + Storage) · RLS em tudo · integração Google Drive para Mídia · moderação de conteúdo com IA leve nos chats de Jovens/Adolescentes.

---

## Fases de construção (proposta)

1. **Fase 1 — Fundação:** auth, perfis, papéis, cadastro de ministérios, redes e mesas, cadastro de membros, dashboard.
2. **Fase 2 — Escalas & Eventos** (base para todos os ministérios).
3. **Fase 3 — Louvor** (cifrateca + setlists).
4. **Fase 4 — Kids** (check-in/out com QR — é o mais crítico, merece uma fase própria).
5. **Fase 5 — Mídia** (biblioteca + integração Drive + central de solicitações).
6. **Fase 6 — Redes Sabaoth/Zadoque + Mesas + eventos por escopo.**
7. **Fase 7 — Jovens & Adolescentes** (feed + chat moderado).
8. **Fase 8 — Dança** (mural + ensaios).
9. **Fase 9 — Atos de Amor** (campanhas + famílias + entregas).
10. **Fase 10 — Portal de Notícias** (feed geral da igreja, avisos fixados, lembretes, aniversariantes).
11. **Fase 11 — Financeiro** (dízimos, ofertas, despesas).

---

## Para eu começar preciso confirmar

1. **Entendi corretamente cada ministério acima?** Algo para corrigir?
2. **Ordem das fases faz sentido**, ou você quer começar por outra (ex.: Kids primeiro por ser crítico)?
3. **Nome oficial da igreja no sistema:** "Igreja Batista Atos" — cor/logo você quer subir depois?
4. **Cadastro inicial:** eu crio ministérios/redes vazios e você cadastra membros, ou você quer que eu já popule uns dados de exemplo para você testar?
