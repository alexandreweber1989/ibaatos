# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Membros da congregação** são a maioria absoluta dos acessos, quase sempre pelo **celular**, em janelas curtas: antes e depois do culto, no caminho, ou durante a semana na mesa.

Uma **parcela relevante da membresia é mais velha e tem dificuldade com aplicativos**. Isso é fato confirmado sobre este público, não suposição: texto pequeno, fluxos de muitas etapas, alvos de toque apertados e jargão de software são barreiras reais que tiram pessoas de dentro da plataforma.

Outros públicos, cada um com recorte próprio de permissão:

- **Líderes de mesa** — acompanham quem está sob seu cuidado na célula
- **Apascentadores e pastores** — cuidado pastoral e visão da igreja
- **Administração** — membresia, permissões e estrutura organizacional
- **Equipes de ministério** — louvor (escalas e repertório), kids (check-in e retirada), mídia, faxina, livraria, cantina, ação social
- **Visitantes** — primeiro contato pela home pública e pelo check-in Kids de visitante

## Product Purpose

O sistema operacional da **Igreja Batista Atos** (Ponta Grossa/PR): membresia, células, escalas, ministério infantil, comunicação e cuidado pastoral num lugar só. Não é um site institucional.

Sucesso é **ninguém da igreja ficar sem ser visto**: alguém percebe que uma pessoa sumiu, a criança é entregue com segurança ao responsável certo, a escala de domingo está de pé, o aviso chega a quem precisa. A plataforma existe para que o cuidado aconteça — não para produzir relatórios sobre ele.

**Está em produção, em uso por toda a igreja.** Toda mudança alcança pessoas reais no domingo seguinte.

## Positioning

Ferramentas de acompanhamento servem para **cuidar de pessoas, não para controlá-las**. É decisão deliberada da liderança, não preferência de estilo.

A consequência é concreta e não negociável: **não existe controle de presença ou frequência, e não deve ser proposto**. O painel do líder registra "com quem eu já conversei esta semana" (touchpoints de cuidado), nunca chamada. Um concorrente que trate a igreja como base de dados a ser monitorada não consegue copiar essa postura sem deixar de ser o que é.

## Operating Context

Estrutura organizacional:

```
Igreja → Redes → Mesas → Membros        (Ministérios são transversais)
```

- **Redes** — agrupamentos por público (mulheres, homens, jovens, adolescentes)
- **Mesas** — as células. Reúnem-se em casas. É onde a vida da igreja acontece de fato.
- **Ministérios** — áreas de serviço (louvor, mídia, kids, dança, ação social), atravessando as redes

**Papel de acesso ≠ função eclesiástica.** São dimensões distintas e não devem ser fundidas:

| `app_role` (permissão no sistema)                                                                          | `church_function` (posição na igreja)                             |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `admin_geral`, `admin_ministerio`, `lider_mesa`, `membro`, `admin_livraria`, `admin_cantina`, `admin_kids` | `pastor`, `apascentador`, `lider`, `diacono`, `obreiro`, `membro` |

Ritmos reais de uso:

- **Domingo** — culto, check-in e retirada do Kids, escala de louvor, cantina e livraria em operação simultânea
- **Durante a semana** — mesas nas casas, cuidado pastoral, avisos e agenda

## Capabilities and Constraints

24 módulos autenticados em produção: `dashboard`, `perfil`, `membros`, `redes`, `mesas`, `ministerios`, `mapa`, `manual`, `avisos`, `noticias`, `pregacoes`, `midia`, `agenda`, `cuidado`, `cuidado-semana`, `visitantes`, `onboarding`, `louvor`, `faxina`, `igrejas` (ação social), `kids`, `kids.relatorios`, `livraria`, `cantina`.

Superfícies públicas: home (`/`), autenticação, `boas-vindas`, check-in Kids de visitante.

**A plataforma é grande — verifique se algo já existe antes de criar.**

Restrições técnicas duráveis:

- **PWA instalável** (`display: standalone`, orientação retrato, `start_url: /dashboard`). No iPhone, a Apple só entrega notificação push para app **instalado na tela de início**.
- Notificações push são **auto-hospedadas**, sem serviço de terceiros. Trocar o método de derivação das chaves **invalida todas as assinaturas** e obriga todo mundo a reativar.
- Banco Postgres com **~80 tabelas e RLS ativo em todas**. Leitura de dados pessoais respeita hierarquia (a própria pessoa, a liderança, ou quem compartilha mesa/rede/ministério).
- Fotos de crianças ficam em bucket **privado**, acessível só por URL assinada.
- Publicação pela **Vercel a partir de `main`**; o editor visual do **Lovable commita direto na `main`**, sem PR e sem preview.
- Idioma **pt-BR** em toda a interface.

## Brand Commitments

**Nome:** Igreja Batista Atos (forma curta: _IB Atos_).

**Voz:** acolhedora e pastoral. Nunca corporativa, nunca de vigilância. Termos como "monitorar", "controle de frequência" e "performance do membro" são estranhos a esta casa.

⚠️ **Existe identidade visual oficial da igreja e ela é restrição obrigatória — mas os arquivos ainda não estão no repositório.**

Isso cria uma distinção que trabalho futuro precisa respeitar: a aparência atual do código (tokens praticamente monocromáticos em `src/styles.css`, com `--primary` preto no tema claro; tipografia Syne / Plus Jakarta Sans, com Fredoka reservada ao Kids) foi escolhida ao longo do caminho e **não está confirmada como sendo a identidade oficial**. Antes de qualquer trabalho visual que assuma a marca, **peça os arquivos oficiais** — não trate o visual atual como se fosse o manual da igreja.

## Evidence on Hand

Reais, no repositório:

- Ícones e manifest PWA (`public/icons/`, `public/manifest.webmanifest`), favicon
- Documentação de domínio: `BLUEPRINT.md`, `docs/KNOWLEDGE-PROJETO.md`, `docs/KNOWLEDGE-WORKSPACE.md`
- Processo de entrega: `AGENTS.md`, `BACKLOG.md`, templates de Issue e PR

Ausências que **não devem ser preenchidas com invenção**:

- Identidade visual oficial da igreja — existe, mas ainda não foi entregue ao projeto
- Números de membresia, depoimentos, dados de crescimento
- **Dados de mesas na home pública são fictícios hoje** (`MESAS_EXEMPLO`, em `src/components/home/cadastro-lead.tsx`): líderes e WhatsApp inventados. Não são evidência real e precisam ser ligados à tabela `mesas`.

## Product Principles

1. **Cuidar, nunca vigiar.** Se um recurso só faz sentido para fiscalizar alguém, ele não pertence a esta plataforma.
2. **Mobile primeiro — e para quem tem dificuldade.** O padrão de referência não é o membro jovem com iPhone novo; é a pessoa mais velha, com celular simples, tentando resolver algo em pé no corredor da igreja.
3. **A mesa é o centro.** A vida acontece nas células, não no painel administrativo. O que serve à mesa tem prioridade.
4. **Produção é sagrada.** A igreja inteira depende disto no domingo. Nada quebrado vai ao ar.
5. **Verdade acima de aparência.** Melhor uma tela honesta e vazia do que uma bonita com dado inventado — especialmente diante de um visitante.

## Accessibility & Inclusion

Requisito confirmado do público, não item opcional: **parte relevante da membresia é mais velha e tem dificuldade com aplicativos.**

Implicações duráveis para qualquer trabalho futuro:

- Tamanho de texto e alvos de toque generosos; nada de tipografia decorativa minúscula em informação essencial
- Menos etapas por tarefa; caminhos curtos e reversíveis
- Linguagem sem jargão de software, no vocabulário da igreja
- Contraste real, testado nos dois temas
- `prefers-reduced-motion` respeitado (já é prática no código)
- Interface inteiramente em pt-BR (`<html lang="pt-BR">`)
