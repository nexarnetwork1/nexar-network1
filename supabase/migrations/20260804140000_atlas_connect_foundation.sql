-- ATLAS Connect foundation (additive, backward-compatible)
-- Business Collaboration Platform — not a chat app.
-- Does NOT modify atlas_network, atlas_pulse, business_hub, or commerce tables.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.connect_channel_type AS ENUM (
  'general', 'sales', 'support', 'finance', 'hr', 'marketing', 'operations',
  'development', 'management', 'announcements', 'marketplace', 'projects',
  'private', 'public'
);

CREATE TYPE public.connect_conversation_kind AS ENUM (
  'direct', 'group', 'channel', 'business', 'customer', 'supplier',
  'partner', 'department', 'project', 'support'
);

CREATE TYPE public.connect_message_type AS ENUM (
  'text', 'image', 'video', 'voice', 'pdf', 'document', 'spreadsheet',
  'presentation', 'product', 'service', 'marketplace_listing', 'quotation',
  'invoice', 'purchase_order', 'payment_link', 'wallet_transfer', 'task',
  'calendar_event', 'location', 'ai_response', 'announcement', 'system'
);

CREATE TYPE public.connect_participant_role AS ENUM (
  'owner', 'admin', 'manager', 'department_manager', 'finance', 'sales',
  'hr', 'support', 'employee', 'guest'
);

CREATE TYPE public.connect_meeting_status AS ENUM (
  'scheduled', 'in_progress', 'ended', 'cancelled'
);

CREATE TYPE public.connect_call_type AS ENUM (
  'voice', 'video'
);

CREATE TYPE public.connect_call_status AS ENUM (
  'ringing', 'active', 'ended', 'missed', 'declined'
);

CREATE TYPE public.connect_task_status AS ENUM (
  'open', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE public.connect_approval_status AS ENUM (
  'pending', 'approved', 'rejected', 'cancelled'
);

CREATE TYPE public.connect_reference_type AS ENUM (
  'quotation', 'invoice', 'order', 'payment', 'product', 'service', 'store'
);

CREATE TYPE public.connect_action_type AS ENUM (
  'task', 'lead', 'customer', 'supplier', 'employee', 'order', 'invoice',
  'calendar_event', 'crm_opportunity', 'business_note'
);

CREATE TYPE public.connect_file_category AS ENUM (
  'contract', 'invoice', 'certificate', 'drawing', 'company_document',
  'product_catalog', 'media', 'business_card', 'general'
);

CREATE TYPE public.connect_reaction_type AS ENUM (
  'like', 'celebrate', 'support', 'insightful', 'interesting', 'love', 'approve'
);

-- ---------------------------------------------------------------------------
-- Workspaces (one per business)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_connect_workspaces_business ON public.atlas_connect_workspaces(business_id);

-- ---------------------------------------------------------------------------
-- Workspace members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.connect_participant_role NOT NULL DEFAULT 'employee',
  department_id UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_connect_ws_members_workspace ON public.atlas_connect_workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_connect_ws_members_user ON public.atlas_connect_workspace_members(user_id);

-- ---------------------------------------------------------------------------
-- Departments & teams
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  manager_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

CREATE TABLE IF NOT EXISTS public.atlas_connect_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.atlas_connect_departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  lead_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

-- ---------------------------------------------------------------------------
-- Channels
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  channel_type public.connect_channel_type NOT NULL DEFAULT 'general',
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_connect_channels_workspace ON public.atlas_connect_channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_connect_channels_type ON public.atlas_connect_channels(channel_type);

-- ---------------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.atlas_connect_channels(id) ON DELETE SET NULL,
  conversation_kind public.connect_conversation_kind NOT NULL DEFAULT 'channel',
  title TEXT,
  external_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  external_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id UUID,
  department_id UUID REFERENCES public.atlas_connect_departments(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_connect_conversations_workspace ON public.atlas_connect_conversations(workspace_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_connect_conversations_channel ON public.atlas_connect_conversations(channel_id);
CREATE INDEX IF NOT EXISTS idx_connect_conversations_kind ON public.atlas_connect_conversations(conversation_kind);

-- ---------------------------------------------------------------------------
-- Participants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.atlas_connect_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.connect_participant_role NOT NULL DEFAULT 'employee',
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_connect_participants_conversation ON public.atlas_connect_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_connect_participants_user ON public.atlas_connect_participants(user_id);

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.atlas_connect_conversations(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message_type public.connect_message_type NOT NULL DEFAULT 'text',
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  thread_id UUID,
  reply_to_id UUID REFERENCES public.atlas_connect_messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  -- Encryption-ready: app-layer E2E/at-rest encryption plugs in without schema rewrite
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  encryption_key_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_messages_conversation ON public.atlas_connect_messages(conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_connect_messages_sender ON public.atlas_connect_messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_connect_messages_type ON public.atlas_connect_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_connect_messages_thread ON public.atlas_connect_messages(thread_id);

-- ---------------------------------------------------------------------------
-- Threads (top-level thread anchor per conversation branch)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.atlas_connect_conversations(id) ON DELETE CASCADE,
  root_message_id UUID NOT NULL REFERENCES public.atlas_connect_messages(id) ON DELETE CASCADE,
  reply_count INTEGER NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_threads_conversation ON public.atlas_connect_threads(conversation_id);

-- ---------------------------------------------------------------------------
-- Message reactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.atlas_connect_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type public.connect_reaction_type NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_connect_reactions_message ON public.atlas_connect_message_reactions(message_id);

-- ---------------------------------------------------------------------------
-- Attachments (files, voice, video metadata)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.atlas_connect_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  encryption_key_id TEXT,
  malware_scan_status TEXT NOT NULL DEFAULT 'pending',
  malware_scanned_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_attachments_message ON public.atlas_connect_attachments(message_id);

-- ---------------------------------------------------------------------------
-- Pinned messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.atlas_connect_conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.atlas_connect_messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, message_id)
);

-- ---------------------------------------------------------------------------
-- Announcements (workspace-wide)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.atlas_connect_channels(id) ON DELETE SET NULL,
  author_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_announcements_workspace ON public.atlas_connect_announcements(workspace_id, published_at DESC);

-- ---------------------------------------------------------------------------
-- Meetings & calls
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.atlas_connect_conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status public.connect_meeting_status NOT NULL DEFAULT 'scheduled',
  host_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  recording_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_meetings_workspace ON public.atlas_connect_meetings(workspace_id, scheduled_start);

CREATE TABLE IF NOT EXISTS public.atlas_connect_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.atlas_connect_conversations(id) ON DELETE SET NULL,
  call_type public.connect_call_type NOT NULL DEFAULT 'voice',
  status public.connect_call_status NOT NULL DEFAULT 'ringing',
  initiator_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Tasks & approvals (collaboration workflow)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.atlas_connect_conversations(id) ON DELETE SET NULL,
  source_message_id UUID REFERENCES public.atlas_connect_messages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.connect_task_status NOT NULL DEFAULT 'open',
  assignee_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_tasks_workspace ON public.atlas_connect_tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_connect_tasks_assignee ON public.atlas_connect_tasks(assignee_user_id);

CREATE TABLE IF NOT EXISTS public.atlas_connect_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.atlas_connect_conversations(id) ON DELETE SET NULL,
  source_message_id UUID REFERENCES public.atlas_connect_messages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status public.connect_approval_status NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approver_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Entity references (quotation, invoice, order, payment, product shares)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_entity_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.atlas_connect_messages(id) ON DELETE CASCADE,
  reference_type public.connect_reference_type NOT NULL,
  entity_id UUID NOT NULL,
  entity_label TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_refs_message ON public.atlas_connect_entity_references(message_id);
CREATE INDEX IF NOT EXISTS idx_connect_refs_entity ON public.atlas_connect_entity_references(reference_type, entity_id);

-- ---------------------------------------------------------------------------
-- Calendar events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.atlas_connect_conversations(id) ON DELETE SET NULL,
  source_message_id UUID REFERENCES public.atlas_connect_messages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  organizer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_calendar_workspace ON public.atlas_connect_calendar_events(workspace_id, starts_at);

-- ---------------------------------------------------------------------------
-- Shared business files
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.atlas_connect_conversations(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_category public.connect_file_category NOT NULL DEFAULT 'general',
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_files_workspace ON public.atlas_connect_shared_files(workspace_id);

-- ---------------------------------------------------------------------------
-- Smart business actions (message → action conversion log)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_message_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.atlas_connect_messages(id) ON DELETE CASCADE,
  action_type public.connect_action_type NOT NULL,
  result_entity_type TEXT,
  result_entity_id UUID,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_actions_message ON public.atlas_connect_message_actions(message_id);

-- ---------------------------------------------------------------------------
-- Audit logs (security & permission audit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.atlas_connect_workspaces(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_audit_workspace ON public.atlas_connect_audit_logs(workspace_id, created_at DESC);

-- Full-text search indexes (messages + files + announcements)
CREATE INDEX IF NOT EXISTS idx_connect_messages_body_fts
  ON public.atlas_connect_messages USING gin (to_tsvector('english', coalesce(body, '')));
CREATE INDEX IF NOT EXISTS idx_connect_files_name_fts
  ON public.atlas_connect_shared_files USING gin (to_tsvector('english', coalesce(file_name, '')));
CREATE INDEX IF NOT EXISTS idx_connect_announcements_fts
  ON public.atlas_connect_announcements USING gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  );

-- ---------------------------------------------------------------------------
-- Notification preferences (realtime / push / email / desktop)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_notification_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.atlas_connect_workspaces(id) ON DELETE CASCADE,
  realtime_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  desktop_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  mention_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  priority_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_connect_notif_prefs_user
  ON public.atlas_connect_notification_prefs(user_id);

-- ---------------------------------------------------------------------------
-- Device / session history (security audit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_connect_device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.atlas_connect_workspaces(id) ON DELETE SET NULL,
  device_label TEXT,
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_device_sessions_user
  ON public.atlas_connect_device_sessions(user_id, last_seen_at DESC);

-- Deferred FK: messages.thread_id → threads (tables created in order)
ALTER TABLE public.atlas_connect_messages
  DROP CONSTRAINT IF EXISTS fk_connect_messages_thread;
ALTER TABLE public.atlas_connect_messages
  ADD CONSTRAINT fk_connect_messages_thread
  FOREIGN KEY (thread_id) REFERENCES public.atlas_connect_threads(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Auto-provision Connect workspace + default channels on Business INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.ensure_atlas_connect_for_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wid UUID;
  cid UUID;
  conv_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.atlas_connect_workspaces WHERE business_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.atlas_connect_workspaces (business_id, owner_user_id, name, slug)
  VALUES (NEW.id, NEW.owner_user_id, NEW.display_name || ' Connect', NEW.slug || '-connect')
  RETURNING id INTO wid;

  INSERT INTO public.atlas_connect_workspace_members (workspace_id, user_id, role)
  VALUES (wid, NEW.owner_user_id, 'owner'::public.connect_participant_role);

  -- Default channels (aligned with DEFAULT_CONNECT_CHANNELS in module)
  INSERT INTO public.atlas_connect_channels (workspace_id, channel_type, name, slug, created_by)
  VALUES
    (wid, 'general'::public.connect_channel_type, 'General', 'general', NEW.owner_user_id),
    (wid, 'announcements'::public.connect_channel_type, 'Announcements', 'announcements', NEW.owner_user_id),
    (wid, 'sales'::public.connect_channel_type, 'Sales', 'sales', NEW.owner_user_id),
    (wid, 'support'::public.connect_channel_type, 'Support', 'support', NEW.owner_user_id),
    (wid, 'finance'::public.connect_channel_type, 'Finance', 'finance', NEW.owner_user_id),
    (wid, 'hr'::public.connect_channel_type, 'HR', 'hr', NEW.owner_user_id),
    (wid, 'marketplace'::public.connect_channel_type, 'Marketplace', 'marketplace', NEW.owner_user_id);

  -- General channel conversation
  SELECT id INTO cid FROM public.atlas_connect_channels
  WHERE workspace_id = wid AND slug = 'general' LIMIT 1;

  INSERT INTO public.atlas_connect_conversations (
    workspace_id, channel_id, conversation_kind, title, created_by
  ) VALUES (
    wid, cid, 'channel'::public.connect_conversation_kind, 'General', NEW.owner_user_id
  ) RETURNING id INTO conv_id;

  INSERT INTO public.atlas_connect_participants (conversation_id, user_id, role)
  VALUES (conv_id, NEW.owner_user_id, 'owner'::public.connect_participant_role);

  INSERT INTO public.atlas_connect_messages (
    conversation_id, sender_user_id, message_type, body, payload
  ) VALUES (
    conv_id, NEW.owner_user_id, 'system'::public.connect_message_type,
    'Welcome to ATLAS Connect — your business collaboration workspace.',
    jsonb_build_object('businessId', NEW.id, 'event', 'workspace.created')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_ensure_connect ON public.businesses;
CREATE TRIGGER businesses_ensure_connect
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION private.ensure_atlas_connect_for_business();

-- Backfill workspaces for existing businesses
DO $$
DECLARE r RECORD; wid UUID;
BEGIN
  FOR r IN SELECT * FROM public.businesses WHERE deleted_at IS NULL LOOP
    IF EXISTS (SELECT 1 FROM public.atlas_connect_workspaces WHERE business_id = r.id) THEN
      CONTINUE;
    END IF;
    INSERT INTO public.atlas_connect_workspaces (business_id, owner_user_id, name, slug)
    VALUES (r.id, r.owner_user_id, r.display_name || ' Connect', r.slug || '-connect')
    RETURNING id INTO wid;
    INSERT INTO public.atlas_connect_workspace_members (workspace_id, user_id, role)
    VALUES (wid, r.owner_user_id, 'owner'::public.connect_participant_role);
    INSERT INTO public.atlas_connect_channels (workspace_id, channel_type, name, slug, created_by)
    VALUES
      (wid, 'general'::public.connect_channel_type, 'General', 'general', r.owner_user_id),
      (wid, 'announcements'::public.connect_channel_type, 'Announcements', 'announcements', r.owner_user_id),
      (wid, 'sales'::public.connect_channel_type, 'Sales', 'sales', r.owner_user_id),
      (wid, 'support'::public.connect_channel_type, 'Support', 'support', r.owner_user_id),
      (wid, 'finance'::public.connect_channel_type, 'Finance', 'finance', r.owner_user_id),
      (wid, 'hr'::public.connect_channel_type, 'HR', 'hr', r.owner_user_id),
      (wid, 'marketplace'::public.connect_channel_type, 'Marketplace', 'marketplace', r.owner_user_id);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- RLS — defense in depth (service-role app client bypasses; Auth.js JWT later)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_connect_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.atlas_connect_workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
      AND wm.left_at IS NULL
  ) OR private.current_user_role() = 'admin'::public.user_role;
$$;

CREATE OR REPLACE FUNCTION private.is_connect_conversation_participant(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.atlas_connect_participants p
    WHERE p.conversation_id = p_conversation_id
      AND p.user_id = auth.uid()
      AND p.left_at IS NULL
  ) OR EXISTS (
    SELECT 1
    FROM public.atlas_connect_conversations c
    JOIN public.atlas_connect_workspace_members wm ON wm.workspace_id = c.workspace_id
    WHERE c.id = p_conversation_id
      AND wm.user_id = auth.uid()
      AND wm.left_at IS NULL
  ) OR private.current_user_role() = 'admin'::public.user_role;
$$;

ALTER TABLE public.atlas_connect_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_entity_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_message_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_connect_device_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members read workspaces" ON public.atlas_connect_workspaces;
CREATE POLICY "Workspace members read workspaces" ON public.atlas_connect_workspaces
  FOR SELECT USING (private.is_connect_workspace_member(id));

DROP POLICY IF EXISTS "Members read workspace members" ON public.atlas_connect_workspace_members;
CREATE POLICY "Members read workspace members" ON public.atlas_connect_workspace_members
  FOR SELECT USING (private.is_connect_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members read channels" ON public.atlas_connect_channels;
CREATE POLICY "Members read channels" ON public.atlas_connect_channels
  FOR SELECT USING (private.is_connect_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Workspace members read conversations" ON public.atlas_connect_conversations;
CREATE POLICY "Workspace members read conversations" ON public.atlas_connect_conversations
  FOR SELECT USING (private.is_connect_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Participants read messages" ON public.atlas_connect_messages;
CREATE POLICY "Participants read messages" ON public.atlas_connect_messages
  FOR SELECT USING (private.is_connect_conversation_participant(conversation_id));

DROP POLICY IF EXISTS "Members read meetings" ON public.atlas_connect_meetings;
CREATE POLICY "Members read meetings" ON public.atlas_connect_meetings
  FOR SELECT USING (private.is_connect_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members read tasks" ON public.atlas_connect_tasks;
CREATE POLICY "Members read tasks" ON public.atlas_connect_tasks
  FOR SELECT USING (private.is_connect_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members read files" ON public.atlas_connect_shared_files;
CREATE POLICY "Members read files" ON public.atlas_connect_shared_files
  FOR SELECT USING (private.is_connect_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users read own notification prefs" ON public.atlas_connect_notification_prefs;
CREATE POLICY "Users read own notification prefs" ON public.atlas_connect_notification_prefs
  FOR SELECT USING (user_id = auth.uid() OR private.current_user_role() = 'admin'::public.user_role);

DROP POLICY IF EXISTS "Users read own device sessions" ON public.atlas_connect_device_sessions;
CREATE POLICY "Users read own device sessions" ON public.atlas_connect_device_sessions
  FOR SELECT USING (user_id = auth.uid() OR private.current_user_role() = 'admin'::public.user_role);
