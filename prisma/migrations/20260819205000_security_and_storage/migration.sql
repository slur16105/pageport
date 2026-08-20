-- PAGEPORT의 기본 보안, 다운로드 횟수 계산, 요청 제한, 파일 보관함을 설정하는 변경 기록입니다.
-- 결제·고객 정보는 서버만 다루고, 고객 브라우저에는 공개 상품만 보이게 합니다.

-- 모든 중요 정보표에 행 단위 보안(RLS)을 켭니다.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_limits ENABLE ROW LEVEL SECURITY;

-- 브라우저는 운영자가 'published(공개)'로 승인한 상품만 읽을 수 있습니다.
CREATE POLICY "published products are public"
ON public.products FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- 고객·결제·관리자·다운로드 정보표에는 브라우저 허용 규칙을 만들지 않습니다.
-- 따라서 PAGEPORT 서버 비밀키를 가진 서버만 접근할 수 있습니다.

-- 원본 PDF는 비공개로, 상품 미리보기 이미지는 공개로 보관하는 두 저장 공간을 만듭니다.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-pdfs', 'product-pdfs', false, 52428800, ARRAY['application/pdf']),
  ('product-previews', 'product-previews', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "published preview images are readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-previews');

-- 유효한 주소인지 확인하고 다운로드 횟수 증가와 이용 기록 저장을 한 번에 처리합니다.
-- 중간에 실패하면 전체가 취소되므로 횟수만 잘못 올라가는 일을 막습니다.
CREATE OR REPLACE FUNCTION public.consume_download_grant(
  p_token_hash text,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS TABLE(object_key text, order_id text, download_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grant public.download_grants%ROWTYPE;
  v_status text;
BEGIN
  SELECT * INTO v_grant
  FROM public.download_grants
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'DOWNLOAD_NOT_FOUND'; END IF;
  IF v_grant.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'DOWNLOAD_REVOKED'; END IF;
  IF v_grant.expires_at <= now() THEN RAISE EXCEPTION 'DOWNLOAD_EXPIRED'; END IF;
  IF v_grant.download_count >= v_grant.max_downloads THEN RAISE EXCEPTION 'DOWNLOAD_LIMIT'; END IF;

  SELECT status INTO v_status FROM public.orders WHERE id = v_grant.order_id FOR UPDATE;
  IF v_status NOT IN ('paid', 'test_paid') THEN RAISE EXCEPTION 'ORDER_UNAVAILABLE'; END IF;

  UPDATE public.download_grants
  SET download_count = download_count + 1, last_downloaded_at = now()
  WHERE id = v_grant.id
  RETURNING download_grants.download_count INTO v_grant.download_count;

  UPDATE public.orders
  SET total_download_count = total_download_count + 1, updated_at = now()
  WHERE id = v_grant.order_id;

  INSERT INTO public.download_events (id, order_id, grant_id, ip_hash, user_agent)
  VALUES (gen_random_uuid(), v_grant.order_id, v_grant.id, p_ip_hash, left(p_user_agent, 500));

  RETURN QUERY SELECT v_grant.object_key, v_grant.order_id, v_grant.download_count;
END;
$$;

-- 같은 사람이 정해진 시간 안에 허용 횟수보다 많이 요청했는지 계산합니다.
CREATE OR REPLACE FUNCTION public.enforce_request_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.request_limits (key, count, window_start, expires_at)
  VALUES (p_key, 1, now(), now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE SET
    count = CASE WHEN request_limits.expires_at <= now() THEN 1 ELSE request_limits.count + 1 END,
    window_start = CASE WHEN request_limits.expires_at <= now() THEN now() ELSE request_limits.window_start END,
    expires_at = CASE WHEN request_limits.expires_at <= now() THEN now() + make_interval(secs => p_window_seconds) ELSE request_limits.expires_at END
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

-- 위 두 기능은 일반 방문자가 직접 실행하지 못하고 서버 전용 역할만 실행하게 제한합니다.
REVOKE ALL ON FUNCTION public.consume_download_grant(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_request_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_download_grant(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_request_limit(text, integer, integer) TO service_role;
