# Plan: Professional Hero & Gênese presentation

Improve the visual presentation of the "Hero" and "Nossa Gênese" (Our Genesis) sections on the homepage to achieve a more professional, enterprise-grade, and modern look.

## User Review Required

> [!IMPORTANT]
>
> - The new design will use high-contrast typography and sophisticated motion patterns.
> - The Hero will transition from a minimal, text-focused aesthetic to a more layered, atmospheric one.

## Proposed Changes

### UI Architect

- **Hero Enhancements**:
  - Add a subtle background texture (noise or grain) to the main container.
  - Introduce a sophisticated grid background pattern.
  - Enhance the `LinhaGlitch` component with smoother transitions and better font weighting.
  - Add a "glassmorphism" effect to the church icon container.
- **Nossa Gênese (Historia) Enhancements**:
  - Replace the single background glow with a more dynamic, multi-layered atmospheric light system.
  - Implement a more professional timeline navigation (dot-indicator with progress filling).
  - Use more generous white space (kerning and leading) in the typography.
  - Add "entrance" animations for each text element within the chapters using more complex easing functions.

### Code Auditor

- Ensure Framer Motion variants are clean and reusable.
- Verify that performance remains optimal despite the added background effects (using `will-change` where appropriate).
- Check contrast ratios for accessibility on the new background patterns.

## Technical Details

- Use `mask-image` for smooth fading of the grid pattern.
- Implement a `NoiseOverlay` component for subtle texture.
- Update `Historia` component to include a visual "progress bar" connecting the timeline dots.
- Refine `AnimatePresence` transitions in `Historia` for a "staggered" reveal of text.
