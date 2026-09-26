-- Reconciles objects missing from a partially initialized Supabase project.
-- This migration is additive: it intentionally preserves all existing data.

DO $$
DECLARE
  missing_dependencies text[] := ARRAY[]::text[];
BEGIN
  IF to_regclass('public.events') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.events');
  END IF;

  IF to_regclass('public.event_rsvps') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.event_rsvps');
  END IF;

  IF to_regclass('public.profiles') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.profiles');
  END IF;

  IF to_regclass('public.mesas') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.mesas');
  END IF;

  IF to_regclass('public.churches') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.churches');
  END IF;

  IF to_regclass('public.news') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.news');
  END IF;

  IF to_regclass('public.user_push_tokens') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.user_push_tokens');
  END IF;

  IF to_regclass('public.notifications_history') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.notifications_history');
  END IF;

  IF to_regprocedure('public.is_pastoral(uuid)') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.is_pastoral(uuid)');
  ELSIF NOT has_function_privilege(
    'authenticated',
    'public.is_pastoral(uuid)',
    'EXECUTE'
  ) THEN
    missing_dependencies := array_append(missing_dependencies, 'EXECUTE on public.is_pastoral(uuid) for authenticated');
  END IF;

  IF to_regprocedure('public.has_role(uuid,public.app_role)') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.has_role(uuid,public.app_role)');
  ELSIF NOT has_function_privilege(
    'authenticated',
    'public.has_role(uuid,public.app_role)',
    'EXECUTE'
  ) THEN
    missing_dependencies := array_append(missing_dependencies, 'EXECUTE on public.has_role(uuid,public.app_role) for authenticated');
  END IF;

  IF to_regprocedure('public.has_mesa_role(uuid,uuid)') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.has_mesa_role(uuid,uuid)');
  ELSIF NOT has_function_privilege(
    'authenticated',
    'public.has_mesa_role(uuid,uuid)',
    'EXECUTE'
  ) THEN
    missing_dependencies := array_append(missing_dependencies, 'EXECUTE on public.has_mesa_role(uuid,uuid) for authenticated');
  END IF;

  IF to_regprocedure('public.is_mesa_member(uuid,uuid)') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.is_mesa_member(uuid,uuid)');
  ELSIF NOT has_function_privilege(
    'authenticated',
    'public.is_mesa_member(uuid,uuid)',
    'EXECUTE'
  ) THEN
    missing_dependencies := array_append(missing_dependencies, 'EXECUTE on public.is_mesa_member(uuid,uuid) for authenticated');
  END IF;

  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'public.set_updated_at()');
  END IF;

  IF to_regclass('public.events') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM unnest(ARRAY['id', 'starts_at']) AS expected(column_name)
       WHERE NOT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'events'
           AND column_name = expected.column_name
       )
     ) THEN
    missing_dependencies := array_append(missing_dependencies, 'columns public.events(id, starts_at)');
  END IF;

  IF to_regclass('public.event_rsvps') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM unnest(ARRAY['event_id', 'user_id', 'status']) AS expected(column_name)
       WHERE NOT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'event_rsvps'
           AND column_name = expected.column_name
       )
     ) THEN
    missing_dependencies := array_append(missing_dependencies, 'columns public.event_rsvps(event_id, user_id, status)');
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
     ) THEN
    missing_dependencies := array_append(missing_dependencies, 'column public.profiles.id');
  END IF;

  IF to_regclass('public.mesas') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'mesas' AND column_name = 'id'
     ) THEN
    missing_dependencies := array_append(missing_dependencies, 'column public.mesas.id');
  END IF;

  IF to_regclass('public.churches') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'churches' AND column_name = 'id'
     ) THEN
    missing_dependencies := array_append(missing_dependencies, 'column public.churches.id');
  END IF;

  IF to_regclass('public.news') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'news' AND column_name = 'id'
     ) THEN
    missing_dependencies := array_append(missing_dependencies, 'column public.news.id');
  END IF;

  IF to_regclass('storage.buckets') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'storage.buckets');
  ELSIF EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'sermon-arts' AND NOT public
  ) THEN
    missing_dependencies := array_append(missing_dependencies, 'existing storage bucket sermon-arts is private');
  END IF;

  IF to_regclass('storage.objects') IS NULL THEN
    missing_dependencies := array_append(missing_dependencies, 'storage.objects');
  END IF;

  IF array_length(missing_dependencies, 1) IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot reconcile schema because required dependencies are missing: %',
      array_to_string(missing_dependencies, ', ');
  END IF;
END;
$$;

-- Event reminders
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS reminder_settings jsonb
  DEFAULT '{"enabled": false, "lead_time": 30, "type": "push"}'::jsonb;

CREATE TABLE IF NOT EXISTS public.event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  reminded_at timestamptz,
  settings jsonb DEFAULT '{"type": "push"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_reminders TO authenticated;
GRANT ALL ON public.event_reminders TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_reminders'
      AND policyname = 'Usuários podem gerenciar seus próprios lembretes'
  ) THEN
    CREATE POLICY "Usuários podem gerenciar seus próprios lembretes"
      ON public.event_reminders
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_event_rsvp_reminder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_starts_at timestamptz;
  v_reminder_settings jsonb;
BEGIN
  IF NEW.status = 'vou' THEN
    SELECT starts_at, reminder_settings
      INTO v_starts_at, v_reminder_settings
      FROM public.events
      WHERE id = NEW.event_id;

    IF v_reminder_settings->>'enabled' = 'true' THEN
      INSERT INTO public.event_reminders (event_id, user_id, remind_at, settings)
      VALUES (
        NEW.event_id,
        NEW.user_id,
        v_starts_at - (COALESCE((v_reminder_settings->>'lead_time')::integer, 30) * interval '1 minute'),
        v_reminder_settings
      )
      ON CONFLICT (event_id, user_id) DO UPDATE
        SET remind_at = EXCLUDED.remind_at,
            settings = EXCLUDED.settings,
            reminded_at = NULL;
    ELSE
      DELETE FROM public.event_reminders
        WHERE event_id = NEW.event_id
          AND user_id = NEW.user_id;
    END IF;
  ELSE
    DELETE FROM public.event_reminders
      WHERE event_id = NEW.event_id
        AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_event_rsvp_reminder'
      AND tgrelid = 'public.event_rsvps'::regclass
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER on_event_rsvp_reminder
      AFTER INSERT OR UPDATE ON public.event_rsvps
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_event_rsvp_reminder();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_event_reminders_for_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reminder_settings jsonb := COALESCE(NEW.reminder_settings, '{}'::jsonb);
BEGIN
  IF v_reminder_settings->>'enabled' = 'true' THEN
    INSERT INTO public.event_reminders (event_id, user_id, remind_at, settings)
    SELECT
      NEW.id,
      rsvp.user_id,
      NEW.starts_at - (
        COALESCE((v_reminder_settings->>'lead_time')::integer, 30) * interval '1 minute'
      ),
      v_reminder_settings
    FROM public.event_rsvps AS rsvp
    WHERE rsvp.event_id = NEW.id
      AND rsvp.status = 'vou'
    ON CONFLICT (event_id, user_id) DO UPDATE
      SET remind_at = EXCLUDED.remind_at,
          settings = EXCLUDED.settings,
          reminded_at = NULL;
  ELSE
    DELETE FROM public.event_reminders
      WHERE event_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_event_reminder_settings_change'
      AND tgrelid = 'public.events'::regclass
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER on_event_reminder_settings_change
      AFTER UPDATE OF reminder_settings, starts_at ON public.events
      FOR EACH ROW
      WHEN (
        OLD.reminder_settings IS DISTINCT FROM NEW.reminder_settings
        OR OLD.starts_at IS DISTINCT FROM NEW.starts_at
      )
      EXECUTE FUNCTION public.sync_event_reminders_for_event();
  END IF;
END;
$$;

-- Weekly pastoral touchpoints
CREATE TABLE IF NOT EXISTS public.leader_touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mesa_id uuid NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  channel text NOT NULL DEFAULT 'presencial'
    CHECK (channel IN ('presencial', 'ligacao', 'whatsapp', 'mensagem', 'visita', 'oracao')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS leader_touchpoints_unique_week
  ON public.leader_touchpoints (leader_id, member_id, week_start);

CREATE INDEX IF NOT EXISTS leader_touchpoints_leader_week
  ON public.leader_touchpoints (leader_id, week_start);

ALTER TABLE public.leader_touchpoints ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leader_touchpoints TO authenticated;
GRANT ALL ON public.leader_touchpoints TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'leader_touchpoints'
      AND policyname = 'Leaders manage own touchpoints'
  ) THEN
    CREATE POLICY "Leaders manage own touchpoints"
      ON public.leader_touchpoints
      FOR ALL
      TO authenticated
      USING (
        leader_id = auth.uid()
        AND public.has_mesa_role(auth.uid(), mesa_id)
        AND public.is_mesa_member(mesa_id, member_id)
      )
      WITH CHECK (
        leader_id = auth.uid()
        AND public.has_mesa_role(auth.uid(), mesa_id)
        AND public.is_mesa_member(mesa_id, member_id)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'leader_touchpoints'
      AND policyname = 'Leadership can view touchpoints'
  ) THEN
    CREATE POLICY "Leadership can view touchpoints"
      ON public.leader_touchpoints
      FOR SELECT
      TO authenticated
      USING (public.is_pastoral(auth.uid()));
  END IF;
END;
$$;

ALTER POLICY "Leaders manage own touchpoints"
  ON public.leader_touchpoints
  TO authenticated
  USING (
    leader_id = auth.uid()
    AND public.has_mesa_role(auth.uid(), mesa_id)
    AND public.is_mesa_member(mesa_id, member_id)
  )
  WITH CHECK (
    leader_id = auth.uid()
    AND public.has_mesa_role(auth.uid(), mesa_id)
    AND public.is_mesa_member(mesa_id, member_id)
  );

-- Sermons and publishing metadata
CREATE TABLE IF NOT EXISTS public.sermons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  title text NOT NULL,
  theme text,
  preacher text,
  preached_on date,
  base_verse text,
  summary text,
  points jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  template text NOT NULL DEFAULT 'mapa'
    CHECK (template IN ('mapa', 'infografico', 'arte')),
  dark boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sermons
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS news_id uuid REFERENCES public.news(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sermons_preached_on_idx
  ON public.sermons (preached_on DESC);

ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sermons TO authenticated;
GRANT ALL ON public.sermons TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sermons'
      AND policyname = 'Admins manage sermons'
  ) THEN
    CREATE POLICY "Admins manage sermons"
      ON public.sermons
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin_geral'))
      WITH CHECK (public.has_role(auth.uid(), 'admin_geral'));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'sermons_set_updated_at'
      AND tgrelid = 'public.sermons'::regclass
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER sermons_set_updated_at
      BEFORE UPDATE ON public.sermons
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('sermon-arts', 'sermon-arts', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'sermon_arts_read_public'
  ) THEN
    CREATE POLICY "sermon_arts_read_public"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'sermon-arts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'sermon_arts_insert_auth'
  ) THEN
    CREATE POLICY "sermon_arts_insert_auth"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'sermon-arts'
        AND public.has_role(auth.uid(), 'admin_geral')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'sermon_arts_update_auth'
  ) THEN
    CREATE POLICY "sermon_arts_update_auth"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'sermon-arts'
        AND public.has_role(auth.uid(), 'admin_geral')
      )
      WITH CHECK (
        bucket_id = 'sermon-arts'
        AND public.has_role(auth.uid(), 'admin_geral')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'sermon_arts_delete_auth'
  ) THEN
    CREATE POLICY "sermon_arts_delete_auth"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'sermon-arts'
        AND public.has_role(auth.uid(), 'admin_geral')
      );
  END IF;
END;
$$;

ALTER POLICY "sermon_arts_read_public"
  ON storage.objects
  TO public
  USING (bucket_id = 'sermon-arts');

ALTER POLICY "sermon_arts_insert_auth"
  ON storage.objects
  TO authenticated
  WITH CHECK (
    bucket_id = 'sermon-arts'
    AND public.has_role(auth.uid(), 'admin_geral')
  );

ALTER POLICY "sermon_arts_update_auth"
  ON storage.objects
  TO authenticated
  USING (
    bucket_id = 'sermon-arts'
    AND public.has_role(auth.uid(), 'admin_geral')
  )
  WITH CHECK (
    bucket_id = 'sermon-arts'
    AND public.has_role(auth.uid(), 'admin_geral')
  );

ALTER POLICY "sermon_arts_delete_auth"
  ON storage.objects
  TO authenticated
  USING (
    bucket_id = 'sermon-arts'
    AND public.has_role(auth.uid(), 'admin_geral')
  );

-- Server-only Web Push configuration
CREATE TABLE IF NOT EXISTS public.push_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  public_key text NOT NULL,
  private_key text NOT NULL,
  subject text NOT NULL DEFAULT 'mailto:contato@igrejabatistaatos.com.br',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_config FROM anon, authenticated;
GRANT ALL ON public.push_config TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'push_config_set_updated_at'
      AND tgrelid = 'public.push_config'::regclass
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER push_config_set_updated_at
      BEFORE UPDATE ON public.push_config
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

-- Real Web Push subscription fields and notification delivery metadata
ALTER TABLE public.user_push_tokens
  ADD COLUMN IF NOT EXISTS endpoint text,
  ADD COLUMN IF NOT EXISTS p256dh text,
  ADD COLUMN IF NOT EXISTS auth text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS user_push_tokens_endpoint_key
  ON public.user_push_tokens (endpoint)
  WHERE endpoint IS NOT NULL;

ALTER TABLE public.notifications_history
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
