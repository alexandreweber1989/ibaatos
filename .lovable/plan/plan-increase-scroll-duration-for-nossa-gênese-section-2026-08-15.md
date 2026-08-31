# Plan: Increase Scroll Duration for "Nossa Gênese" Section

The user wants to increase the scroll distance required to transition between chapters in the "Nossa Gênese" (History) section to prevent skipping past Chapter 02 too quickly.

## Technical Details

- **File:** `src/routes/index.tsx`
- **Component:** `Historia`
- **Logic:** The section height is currently defined as `${capitulos.length * 100}vh`. With 3 chapters, this means 300vh total.
- **Adjustment:** I will increase the multiplier to `150vh` or `200vh` per chapter to provide more "scroll breathing room" between active states.

## Proposed Changes

### 1. Increase Section Height

Modify the height of the `<section>` in the `Historia` component to increase the total scrollable area.

- Old height: `${capitulos.length * 100}vh` (approx. 300vh)
- New height: `${capitulos.length * 150}vh` (approx. 450vh) or more if needed.

### 2. Refine State Transition Logic (Optional but recommended)

The current logic uses a simple `Math.floor(progress * capitulos.length)`. By increasing the height, each chapter stays active for a longer scroll distance.

## Verification Plan

- Manually scroll through the "Nossa Gênese" section in the preview.
- Verify that it requires more effort to move from Cap 01 to Cap 02, and from Cap 02 to Cap 03.
- Ensure the sticky positioning remains correct throughout the extended scroll area.
