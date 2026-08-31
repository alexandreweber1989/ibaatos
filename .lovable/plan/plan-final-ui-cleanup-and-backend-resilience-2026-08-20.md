# Plan - Final UI Cleanup and Backend Resilience

The goal is to remove the instructional text accidentally included in the homepage and fix the persistent "Missing Supabase environment variable(s)" error during YouTube synchronization. Although the environment variables are present in the shell, the application might be failing to access them in certain execution contexts or due to a race condition in the Supabase client initialization.

## Proposed Changes

### UI & Aesthetics

- **Homepage (`src/routes/index.tsx`)**: Completely remove the "Prompt Anti-Alucinação" text block that is appearing at the top of the file.
- **Media Center (`src/routes/_authenticated/midia.tsx`)**: Ensure the ghost button is hidden when on the YouTube tab.

### Backend & Resilience

- **Supabase Client (`src/integrations/supabase/client.ts`)**: Update the initialization logic to be more resilient to environment variable loading states.
- **YouTube Sync (`src/lib/youtube.functions.ts`)**: Add explicit checks for environment variables before calling the server function to provide better feedback if they are indeed missing.
- **Auth Middleware (`src/integrations/supabase/auth-middleware.ts`)**: Ensure it correctly reads from `process.env` in the serverless environment.

## Technical Details

- Use `import.meta.env` for client-side and `process.env` for server-side.
- The `requireSupabaseAuth` middleware currently throws if `SUPABASE_URL` is missing from `process.env`. I will verify why this is failing even when variables are set in the environment.
- The homepage fix will be a clean overwrite of the top of the file to remove the leaked instructions.

---

### Execution Report

**Pattern used:** Hotfix / Architecture Polish

**Activated Sub-agents:**

- **UI Architect** — [X] Executing
- **Supabase Engineer** — [X] Executing
- **Code Auditor** — [X] Executing

**Summary:** Cleaning instructional leaks and hardening the backend connection for the YouTube sync feature.

**Modified Files:** 4

**Suggested Next Steps:**

- Test YouTube synchronization after the fix.
- Verify the homepage appearance.
