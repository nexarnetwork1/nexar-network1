-- ATLAS Mobile foundation (additive, backward-compatible)
-- Mobile Business Platform — complete mobile experience of ATLAS, not a companion app.
-- Does NOT own Business/Product/Order masters. Syncs & projects over existing domains.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.mobile_platform AS ENUM (
  'ios', 'android', 'tablet_ios', 'tablet_android', 'foldable',
  'desktop_companion', 'wearable', 'web_pwa', 'other'
);

CREATE TYPE public.mobile_device_status AS ENUM (
  'active', 'revoked', 'lost', 'suspended'
);

CREATE TYPE public.mobile_auth_method AS ENUM (
  'password', 'pin', 'face_id', 'touch_id', 'mfa', 'passkey', 'other'
);

CREATE TYPE public.mobile_push_category AS ENUM (
  'business_alert', 'marketplace_order', 'message', 'mention',
  'payment', 'invoice', 'ai_insight', 'approval', 'meeting',
  'job', 'announcement', 'system'
);

CREATE TYPE public.mobile_push_status AS ENUM (
  'queued', 'sent', 'delivered', 'failed', 'opened', 'dismissed'
);

CREATE TYPE public.mobile_offline_status AS ENUM (
  'pending', 'syncing', 'synced', 'conflict', 'failed', 'discarded'
);

CREATE TYPE public.mobile_conflict_strategy AS ENUM (
  'server_wins', 'client_wins', 'last_write_wins', 'manual_merge'
);

CREATE TYPE public.mobile_sync_scope AS ENUM (
  'business', 'orders', 'inventory', 'crm', 'connect', 'wallet',
  'finance', 'marketplace', 'network', 'pulse', 'ai', 'settings', 'all'
);

CREATE TYPE public.mobile_camera_job_type AS ENUM (
  'document', 'invoice', 'receipt', 'qr', 'barcode', 'business_card', 'ocr', 'product'
);

CREATE TYPE public.mobile_entitlement_plan AS ENUM (
  'free', 'offline_pro', 'ai_credits', 'business_suite', 'premium'
);

CREATE TYPE public.mobile_remote_command AS ENUM (
  'logout', 'revoke_session', 'wipe_offline_cache', 'lock', 'notify'
);

-- ---------------------------------------------------------------------------
-- Devices & trusted device registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  device_fingerprint TEXT NOT NULL,
  platform public.mobile_platform NOT NULL DEFAULT 'other',
  os_version TEXT,
  app_version TEXT,
  model TEXT,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  biometrics_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  pin_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  status public.mobile_device_status NOT NULL DEFAULT 'active',
  last_seen_at TIMESTAMPTZ,
  trusted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_mobile_devices_user
  ON public.atlas_mobile_devices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_business
  ON public.atlas_mobile_devices(business_id) WHERE business_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Sessions (mobile auth sessions — complements Auth.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.atlas_mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auth_method public.mobile_auth_method NOT NULL DEFAULT 'password',
  refresh_token_hash TEXT,
  mfa_verified BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  end_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_sessions_device
  ON public.atlas_mobile_sessions(device_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_mobile_sessions_user
  ON public.atlas_mobile_sessions(user_id, last_active_at DESC);

-- ---------------------------------------------------------------------------
-- Push tokens & deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.atlas_mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'fcm', -- fcm | apns | expo | huawei
  token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_mobile_push_tokens_user
  ON public.atlas_mobile_push_tokens(user_id) WHERE is_active;

CREATE TABLE IF NOT EXISTS public.atlas_mobile_push_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.atlas_mobile_devices(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  category public.mobile_push_category NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  deep_link TEXT,
  status public.mobile_push_status NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_push_deliveries_user
  ON public.atlas_mobile_push_deliveries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_push_deliveries_status
  ON public.atlas_mobile_push_deliveries(status) WHERE status = 'queued';

-- ---------------------------------------------------------------------------
-- Offline queue & sync
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.atlas_mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  client_mutation_id TEXT NOT NULL,
  scope public.mobile_sync_scope NOT NULL DEFAULT 'all',
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'upsert')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  base_version BIGINT,
  status public.mobile_offline_status NOT NULL DEFAULT 'pending',
  conflict_strategy public.mobile_conflict_strategy NOT NULL DEFAULT 'last_write_wins',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, client_mutation_id)
);

CREATE INDEX IF NOT EXISTS idx_mobile_offline_pending
  ON public.atlas_mobile_offline_queue(device_id, status, created_at)
  WHERE status IN ('pending', 'conflict', 'failed');

CREATE TABLE IF NOT EXISTS public.atlas_mobile_sync_cursors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.atlas_mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  scope public.mobile_sync_scope NOT NULL,
  cursor_token TEXT NOT NULL DEFAULT '0',
  last_synced_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, scope, business_id)
);

CREATE TABLE IF NOT EXISTS public.atlas_mobile_sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES public.atlas_mobile_offline_queue(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.atlas_mobile_devices(id) ON DELETE CASCADE,
  strategy public.mobile_conflict_strategy NOT NULL,
  client_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  server_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_payload JSONB,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Deep links / universal links registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_deep_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme TEXT NOT NULL DEFAULT 'atlas',
  path_pattern TEXT NOT NULL,
  target_module TEXT NOT NULL,
  description TEXT,
  is_universal BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scheme, path_pattern)
);

INSERT INTO public.atlas_mobile_deep_links (path_pattern, target_module, description) VALUES
  ('/business/:id', 'business', 'Business overview'),
  ('/marketplace/listings/:id', 'marketplace', 'Listing detail'),
  ('/orders/:id', 'marketplace', 'Order tracking'),
  ('/network/profiles/:id', 'network', 'Network profile'),
  ('/pulse/:id', 'feed', 'Pulse item'),
  ('/connect/channels/:id', 'connect', 'Connect channel'),
  ('/wallet', 'wallet', 'Wallet home'),
  ('/ai/insights/:id', 'ai', 'AI insight'),
  ('/finance/invoices/:id', 'finance', 'Finance invoice'),
  ('/approvals/:id', 'connect', 'Approval deep link'),
  ('/meetings/:id', 'connect', 'Meeting join')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Camera / scanner jobs (OCR-ready stubs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_camera_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.atlas_mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  job_type public.mobile_camera_job_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  media_path TEXT,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_camera_jobs_user
  ON public.atlas_mobile_camera_jobs(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Location (nearby — privacy-conscious, coarse by default)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_location_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.atlas_mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_m REAL,
  purpose TEXT NOT NULL DEFAULT 'nearby', -- nearby_businesses | nearby_customers | nearby_events | nearby_stores
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mobile_location_user
  ON public.atlas_mobile_location_pings(user_id, recorded_at DESC);

-- ---------------------------------------------------------------------------
-- Dashboard widget layout (per user / business)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  widget_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, business_id, widget_key)
);

-- ---------------------------------------------------------------------------
-- Monetization entitlements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan public.mobile_entitlement_plan NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  ai_credits_remaining INTEGER NOT NULL DEFAULT 0,
  offline_pro BOOLEAN NOT NULL DEFAULT FALSE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_entitlements_user
  ON public.atlas_mobile_entitlements(user_id, status);

-- ---------------------------------------------------------------------------
-- Remote device commands (logout / wipe)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_remote_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.atlas_mobile_devices(id) ON DELETE CASCADE,
  command public.mobile_remote_command NOT NULL,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_remote_commands_pending
  ON public.atlas_mobile_remote_commands(device_id, status)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- Mobile analytics (sessions, crashes, offline usage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.atlas_mobile_devices(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  session_id UUID,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_analytics_name
  ON public.atlas_mobile_analytics_events(event_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_analytics_device
  ON public.atlas_mobile_analytics_events(device_id, recorded_at DESC);

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_mobile_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  device_id UUID,
  user_id UUID,
  business_id UUID,
  actor_user_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_audit_created
  ON public.atlas_mobile_audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS (open select for foundation; tighten with membership later)
-- ---------------------------------------------------------------------------
ALTER TABLE public.atlas_mobile_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_mobile_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_mobile_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_mobile_offline_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_mobile_sync_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY mobile_devices_select ON public.atlas_mobile_devices FOR SELECT USING (true);
CREATE POLICY mobile_sessions_select ON public.atlas_mobile_sessions FOR SELECT USING (true);
CREATE POLICY mobile_push_tokens_select ON public.atlas_mobile_push_tokens FOR SELECT USING (true);
CREATE POLICY mobile_offline_select ON public.atlas_mobile_offline_queue FOR SELECT USING (true);
CREATE POLICY mobile_sync_cursors_select ON public.atlas_mobile_sync_cursors FOR SELECT USING (true);
