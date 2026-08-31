# Plan - Sync Mesa Leaders to Redes View

The user reported that leaders assigned to a "Mesa" (Table) are not appearing in the "Rede" (Network) menu. This plan addresses the visibility issue by ensuring that the responsible parties for each Mesa are correctly displayed in the list of Mesas under their respective Rede.

## Proposed Changes

### 1. Investigation & Verification

- Verify if `mesa_members` entries with leader roles (`pastor`, `apascentador`, `lider`) are correctly fetched in the `useGroupStats` hook.
- Confirm how the `Redes` page displays leadership for individual Mesas within the list.

### 2. Frontend Enhancement

- **File:** `src/routes/_authenticated/redes.tsx`
  - Ensure the list of Mesas within a Rede card correctly maps and displays the leaders.
  - The current code already uses `statsOf(stats?.mesas, m.id)` to get `mesaStats`.
  - The logic at line 183-185 checks `mesaStats.leaders.length`. If this is empty, it shows "Sem liderança definida".
  - I will verify if the "magical wand" or "leader picker" in `MesaDialog` correctly populates `mesa_members` with the appropriate `role`.

### 3. Logic Refinement

- **File:** `src/lib/use-grupos.ts`
  - Verify that the `collect` function and `useGroupStats` hook are correctly retrieving the profile information (specifically `full_name` and `gender`) needed for `displayMemberName`.
  - Ensure `mesa_members` query includes all necessary joins to avoid missing leader names.

### 4. Database & RLS Check (Internal)

- Ensure that the current user has permissions to see `mesa_members` and `profiles` for the leaders. Since it's an admin-facing issue, `admin_geral` should already have access.

## Technical Details

- **Database:** `mesa_members` table stores the relationship between a user and a mesa with a specific role.
- **Hook:** `useGroupStats` in `src/lib/use-grupos.ts` fetches this data in bulk to avoid N+1 queries.
- **Display Logic:** `src/lib/igreja.ts`'s `displayMemberName` is used to format the name with titles (e.g., "Líder João").

## Validation Plan

- Add a leader to a Mesa via the "Mesa" menu.
- Navigate to the "Rede" menu and check if the leader's name appears under the corresponding Mesa in the Rede card.
- Verify that the title (e.g., "Líder") is correctly applied.
