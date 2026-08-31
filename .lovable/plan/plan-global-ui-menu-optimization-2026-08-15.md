# Plan - Global UI & Menu Optimization

This plan focuses on enhancing the user experience and visual identity of the church platform, specifically the main navigation (Menu) and structural responsiveness.

## Proposed Changes

### 1. Navigation & Sidebar (Menu) Refinement

- **Visual Enhancement**: Standardize the sidebar in `AppShell` to use semantic tokens and modern effects (glassmorphism, subtle shadows).
- **Organization**: Group navigation items into logical categories (General, Ministry, Administration) to reduce cognitive load.
- **Micro-interactions**: Add hover states and active indicators that reflect the "Syne + Lora" premium identity.
- **Responsiveness**: Ensure the mobile sidebar provides a high-end experience, matching the desktop quality.

### 2. Manual Operacional (Interactive Improvements)

- **Navigation Integration**: Link modules in the manual directly to their corresponding app routes for better guidance.
- **Search & Filter**: Add a search bar to the manual to allow leaders to find specific operational details quickly.
- **Quick Access**: Add a "Need help?" floating button or a dedicated link in the sidebar to access the manual easily.

### 3. Global Structural Polish

- **Responsive Grids**: Audit all `PageBody` usages to ensure grid layouts (1/2/3 columns) are fluid and mobile-first.
- **Typography Consistency**: Ensure the 4-font scheme (Syne, Lora, DM Sans, Inter) is applied consistently across all new sections.

## Technical Details

- **Architecture**: Enhancements will be made within `src/components/app-shell.tsx` and `src/routes/_authenticated/manual.tsx`.
- **Styling**: Using Tailwind CSS v4 variables and semantic tokens.
- **Animations**: `framer-motion` for layout transitions and menu interactions.
- **Security**: RBAC roles will remain enforced; manual content will remain restricted to `admin_geral`.

## Verification Plan

- **Desktop/Mobile Inspection**: Verify sidebar behavior on various viewports.
- **Role Verification**: Ensure navigation items correctly hide/show based on user roles.
- **Manual Navigation**: Confirm that "Ver detalhes" and route links in the manual function correctly.
