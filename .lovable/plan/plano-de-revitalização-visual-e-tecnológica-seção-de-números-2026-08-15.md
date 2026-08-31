# Plano de Revitalização Visual e Tecnológica: Seção de Números e Cadastro

O objetivo é transformar as seções "Números" e "Cadastro" em experiências visuais de alto impacto, utilizando animações avançadas e uma estética moderna ("Neo-Tech Radical"), mantendo a identidade visual da Igreja Batista Atos.

## Mudanças Propostas

### 1. Seção de Números (Scrolltelling Imersivo)

- **Narrativa Vertical:** Transformar a grade estática em um fluxo sequencial onde cada dado (12+ anos, 9 ministérios, 4 redes) aparece individualmente durante a rolagem.
- **Tipografia Gigante:** Utilizar a fonte `Syne` em escala massiva (até `14rem`) para criar um impacto tipográfico.
- **Animações 3D:** Implementar rotações em `rotateX` e escalas que respondem dinamicamente ao progresso do scroll.
- **Efeito Glassmorphism:** Adicionar brilhos radiais (`radial-gradient`) que seguem o cursor e efeitos de desfoque de fundo.
- **Linha de Escaneamento:** Adicionar uma linha animada que "escaneia" os números conforme entram na tela.

### 2. Seção de Cadastro (Experiência de Onboarding)

- **Layout Modernizado:** Substituir o formulário padrão por um design de "passos" mais fluido e visualmente leve.
- **Efeito de Profundidade:** Aplicar `backdrop-blur` e bordas semitransparentes para uma estética de vidro.
- **Micro-interações:** Adicionar animações de entrada para cada campo de formulário e feedback visual imediato.
- **Responsividade Radical:** Ajustar o grid e o padding para uma experiência impecável em mobile e desktop.

## Detalhes Técnicos

### UI Architect

- Uso de `framer-motion` para `useTransform` e `useScroll`.
- Implementação de `AnimatePresence` para transições suaves entre estados de formulário.
- Aplicação de tokens semânticos (`bg-primary`, `text-foreground`) em conformidade com o design system.

### Performance & Segurança

- Garantir que as animações não causem travamentos no motor de renderização (evitar erros de offsets não-monotônicos).
- Manter a validação rigorosa dos leads via Supabase.

---

### Relatório de Execução (Prévia)

**Padrão utilizado:** Neo-Tech Radical Design & Immersive Scrolltelling

**Sub-agentes envolvidos:**

- **UI Architect** — Design e animações avançadas.
- **Supabase Engineer** — Manutenção da integridade dos dados de cadastro.
- **Code Auditor** — Verificação de performance e estabilidade das animações.
