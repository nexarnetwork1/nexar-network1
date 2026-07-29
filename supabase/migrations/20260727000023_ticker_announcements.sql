-- News ticker announcements (Super Admin managed)

CREATE TABLE public.ticker_announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message     TEXT NOT NULL CHECK (char_length(trim(message)) > 0),
  is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  priority    INTEGER NOT NULL DEFAULT 0,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ticker_announcements_date_range CHECK (
    starts_at IS NULL OR ends_at IS NULL OR starts_at <= ends_at
  )
);

CREATE INDEX idx_ticker_announcements_sort
  ON public.ticker_announcements (sort_order ASC, priority DESC, created_at ASC);

CREATE INDEX idx_ticker_announcements_active
  ON public.ticker_announcements (is_enabled, starts_at, ends_at);

CREATE TRIGGER ticker_announcements_updated_at
  BEFORE UPDATE ON public.ticker_announcements
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.ticker_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active ticker announcements"
  ON public.ticker_announcements
  FOR SELECT
  USING (
    is_enabled = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

CREATE POLICY "Admins manage ticker announcements"
  ON public.ticker_announcements
  FOR ALL
  USING (private.current_user_role() = 'admin')
  WITH CHECK (private.current_user_role() = 'admin');
