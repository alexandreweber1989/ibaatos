-- Run this file in the Supabase SQL Editor before and after the reconciliation
-- migration. It raises an error while a required object is missing.
-- The behavioral reminder check below is rolled back and leaves no test data.
BEGIN;

DO $$
DECLARE
  missing_objects text[] := ARRAY[]::text[];
BEGIN
  IF to_regclass('public.event_reminders') IS NULL THEN
    missing_objects := array_append(missing_objects, 'table public.event_reminders');
  END IF;

  IF to_regclass('public.leader_touchpoints') IS NULL THEN
    missing_objects := array_append(missing_objects, 'table public.leader_touchpoints');
  END IF;

  IF to_regclass('public.sermons') IS NULL THEN
    missing_objects := array_append(missing_objects, 'table public.sermons');
  END IF;

  IF to_regclass('public.push_config') IS NULL THEN
    missing_objects := array_append(missing_objects, 'table public.push_config');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'reminder_settings'
  ) THEN
    missing_objects := array_append(missing_objects, 'column public.events.reminder_settings');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY['youtube_url', 'cover_image_url', 'is_published', 'published_at', 'news_id']) AS expected(column_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'sermons'
        AND column_name = expected.column_name
    )
  ) THEN
    missing_objects := array_append(missing_objects, 'YouTube publishing columns on public.sermons');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY['endpoint', 'p256dh', 'auth', 'user_agent', 'last_used_at']) AS expected(column_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_push_tokens'
        AND column_name = expected.column_name
    )
  ) THEN
    missing_objects := array_append(missing_objects, 'Web Push columns on public.user_push_tokens');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY['url', 'audience', 'sent_by']) AS expected(column_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'notifications_history'
        AND column_name = expected.column_name
    )
  ) THEN
    missing_objects := array_append(missing_objects, 'delivery columns on public.notifications_history');
  END IF;

  IF to_regprocedure('public.handle_event_rsvp_reminder()') IS NULL THEN
    missing_objects := array_append(missing_objects, 'function public.handle_event_rsvp_reminder()');
  END IF;

  IF to_regprocedure('public.sync_event_reminders_for_event()') IS NULL THEN
    missing_objects := array_append(missing_objects, 'function public.sync_event_reminders_for_event()');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_event_rsvp_reminder'
      AND tgrelid = 'public.event_rsvps'::regclass
      AND tgfoid = 'public.handle_event_rsvp_reminder()'::regprocedure
      AND pg_get_triggerdef(oid) LIKE '%AFTER INSERT OR UPDATE ON public.event_rsvps%'
      AND NOT tgisinternal
  ) THEN
    missing_objects := array_append(missing_objects, 'trigger on_event_rsvp_reminder');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'sermons_set_updated_at'
      AND tgrelid = 'public.sermons'::regclass
      AND tgfoid = 'public.set_updated_at()'::regprocedure
      AND pg_get_triggerdef(oid) LIKE '%BEFORE UPDATE ON public.sermons%'
      AND NOT tgisinternal
  ) THEN
    missing_objects := array_append(missing_objects, 'trigger sermons_set_updated_at');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'push_config_set_updated_at'
      AND tgrelid = 'public.push_config'::regclass
      AND tgfoid = 'public.set_updated_at()'::regprocedure
      AND pg_get_triggerdef(oid) LIKE '%BEFORE UPDATE ON public.push_config%'
      AND NOT tgisinternal
  ) THEN
    missing_objects := array_append(missing_objects, 'trigger push_config_set_updated_at');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_event_reminder_settings_change'
      AND tgrelid = 'public.events'::regclass
      AND tgfoid = 'public.sync_event_reminders_for_event()'::regprocedure
      AND pg_get_triggerdef(oid) LIKE '%AFTER UPDATE OF reminder_settings, starts_at ON public.events%'
      AND NOT tgisinternal
  ) THEN
    missing_objects := array_append(missing_objects, 'trigger on_event_reminder_settings_change');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(ARRAY[
      'leader_touchpoints_unique_week',
      'leader_touchpoints_leader_week',
      'sermons_preached_on_idx',
      'user_push_tokens_endpoint_key'
    ]) AS expected(index_name)
    WHERE to_regclass('public.' || expected.index_name) IS NULL
  ) THEN
    missing_objects := array_append(missing_objects, 'required indexes');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (VALUES
      ('public', 'event_reminders', 'Usuários podem gerenciar seus próprios lembretes'),
      ('public', 'leader_touchpoints', 'Leaders manage own touchpoints'),
      ('public', 'leader_touchpoints', 'Leadership can view touchpoints'),
      ('public', 'sermons', 'Admins manage sermons'),
      ('storage', 'objects', 'sermon_arts_read_public'),
      ('storage', 'objects', 'sermon_arts_insert_auth'),
      ('storage', 'objects', 'sermon_arts_update_auth'),
      ('storage', 'objects', 'sermon_arts_delete_auth')
    ) AS expected(schemaname, tablename, policyname)
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE pg_policies.schemaname = expected.schemaname
        AND pg_policies.tablename = expected.tablename
        AND pg_policies.policyname = expected.policyname
    )
  ) THEN
    missing_objects := array_append(missing_objects, 'required RLS policies');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('public'::text, 'event_reminders'::text, 'Usuários podem gerenciar seus próprios lembretes'::text, 'ALL'::text, 'authenticated'::text, ARRAY['auth.uid', 'user_id']::text[], ARRAY['auth.uid', 'user_id']::text[]),
        ('public'::text, 'leader_touchpoints'::text, 'Leaders manage own touchpoints'::text, 'ALL'::text, 'authenticated'::text, ARRAY['leader_id', 'auth.uid', 'has_mesa_role', 'is_mesa_member']::text[], ARRAY['leader_id', 'auth.uid', 'has_mesa_role', 'is_mesa_member']::text[]),
        ('public'::text, 'leader_touchpoints'::text, 'Leadership can view touchpoints'::text, 'SELECT'::text, 'authenticated'::text, ARRAY['is_pastoral']::text[], ARRAY[]::text[]),
        ('public'::text, 'sermons'::text, 'Admins manage sermons'::text, 'ALL'::text, 'authenticated'::text, ARRAY['has_role', 'admin_geral']::text[], ARRAY['has_role', 'admin_geral']::text[]),
        ('storage'::text, 'objects'::text, 'sermon_arts_read_public'::text, 'SELECT'::text, 'public'::text, ARRAY['bucket_id']::text[], ARRAY[]::text[]),
        ('storage'::text, 'objects'::text, 'sermon_arts_insert_auth'::text, 'INSERT'::text, 'authenticated'::text, ARRAY[]::text[], ARRAY['bucket_id', 'has_role', 'admin_geral']::text[]),
        ('storage'::text, 'objects'::text, 'sermon_arts_update_auth'::text, 'UPDATE'::text, 'authenticated'::text, ARRAY['bucket_id', 'has_role', 'admin_geral']::text[], ARRAY['bucket_id', 'has_role', 'admin_geral']::text[]),
        ('storage'::text, 'objects'::text, 'sermon_arts_delete_auth'::text, 'DELETE'::text, 'authenticated'::text, ARRAY['bucket_id', 'has_role', 'admin_geral']::text[], ARRAY[]::text[])
    ) AS expected(schemaname, tablename, policyname, command, role_name, using_terms, check_terms)
    LEFT JOIN pg_policies AS policy
      ON policy.schemaname = expected.schemaname
      AND policy.tablename = expected.tablename
      AND policy.policyname = expected.policyname
    WHERE policy.policyname IS NULL
      OR policy.cmd <> expected.command
      OR array_to_string(policy.roles, ',') <> expected.role_name
      OR EXISTS (
        SELECT 1
        FROM unnest(expected.using_terms) AS required(term)
        WHERE position(required.term IN COALESCE(policy.qual, '')) = 0
      )
      OR EXISTS (
        SELECT 1
        FROM unnest(expected.check_terms) AS required(term)
        WHERE position(required.term IN COALESCE(policy.with_check, '')) = 0
      )
  ) THEN
    missing_objects := array_append(missing_objects, 'secure RLS policy definitions');
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.is_pastoral(uuid)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated',
    'public.has_role(uuid,public.app_role)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated',
    'public.has_mesa_role(uuid,uuid)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated',
    'public.is_mesa_member(uuid,uuid)',
    'EXECUTE'
  ) THEN
    missing_objects := array_append(missing_objects, 'authenticated execution of RLS helper functions');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public'
      AND pg_class.relname IN ('event_reminders', 'leader_touchpoints', 'sermons', 'push_config')
      AND NOT pg_class.relrowsecurity
  ) THEN
    missing_objects := array_append(missing_objects, 'RLS enabled on reconciled tables');
  END IF;

  IF has_table_privilege('anon', 'public.push_config', 'SELECT')
     OR has_table_privilege('authenticated', 'public.push_config', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.push_config', 'SELECT') THEN
    missing_objects := array_append(missing_objects, 'private push_config privileges');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'sermon-arts'
      AND public
  ) THEN
    missing_objects := array_append(missing_objects, 'public storage bucket sermon-arts');
  END IF;

  IF array_length(missing_objects, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'Schema reconciliation incomplete: %', array_to_string(missing_objects, ', ');
  END IF;
END;
$$;

DO $$
DECLARE
  v_user_id uuid;
  v_event_id uuid;
  v_reminder_count integer;
BEGIN
  SELECT profile.id
    INTO v_user_id
    FROM public.profiles AS profile
    JOIN auth.users AS account ON account.id = profile.id
    ORDER BY profile.id
    LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Reminder behavior check skipped because no public.profiles row has a matching auth.users row.';
    RETURN;
  END IF;

  INSERT INTO public.events (title, starts_at, reminder_settings)
  VALUES (
    '__schema_reconciliation_test__',
    now() + interval '7 days',
    '{"enabled": true, "lead_time": 30, "type": "push"}'::jsonb
  )
  RETURNING id INTO v_event_id;

  INSERT INTO public.event_rsvps (event_id, user_id, status)
  VALUES (v_event_id, v_user_id, 'vou');

  SELECT count(*)
    INTO v_reminder_count
    FROM public.event_reminders
    WHERE event_id = v_event_id
      AND user_id = v_user_id;

  IF v_reminder_count <> 1 THEN
    RAISE EXCEPTION 'Expected RSVP trigger to create one reminder, got %', v_reminder_count;
  END IF;

  UPDATE public.events
    SET reminder_settings = '{"enabled": false, "lead_time": 30, "type": "push"}'::jsonb
    WHERE id = v_event_id;

  SELECT count(*)
    INTO v_reminder_count
    FROM public.event_reminders
    WHERE event_id = v_event_id;

  IF v_reminder_count <> 0 THEN
    RAISE EXCEPTION 'Expected disabling reminders to clear schedules, got % rows', v_reminder_count;
  END IF;

  UPDATE public.events
    SET reminder_settings = '{"enabled": true, "lead_time": 15, "type": "push"}'::jsonb
    WHERE id = v_event_id;

  SELECT count(*)
    INTO v_reminder_count
    FROM public.event_reminders
    WHERE event_id = v_event_id
      AND user_id = v_user_id;

  IF v_reminder_count <> 1 THEN
    RAISE EXCEPTION 'Expected enabling reminders to reschedule one RSVP, got %', v_reminder_count;
  END IF;
END;
$$;

ROLLBACK;
