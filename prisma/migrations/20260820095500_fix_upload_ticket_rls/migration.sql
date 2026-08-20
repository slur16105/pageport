-- 업로드 허가증 정보 자체는 비공개로 유지하면서 유효 여부만 '예/아니오'로 확인하도록 보완합니다.
-- 브라우저 역할로 실행되는 Storage 정책이 허가증의 상세 정보를 읽을 필요가 없게 만드는 변경 기록입니다.

-- 파일 주소에 맞는 사용 전·만료 전 허가증이 있는지만 안전하게 확인합니다.
CREATE OR REPLACE FUNCTION public.has_active_upload_ticket(target_object_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.upload_tickets
    WHERE object_key = target_object_key
      AND used_at IS NULL
      AND expires_at > now()
  );
$$;

-- 모든 사람에게 자동 공개하지 않고, 업로드에 필요한 익명 브라우저 역할에 실행 권한만 줍니다.
REVOKE ALL ON FUNCTION public.has_active_upload_ticket(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_upload_ticket(text) TO anon;

-- 이전 정책을 지운 뒤 상세 정보 대신 위의 안전한 확인 기능을 쓰도록 다시 만듭니다.
DROP POLICY IF EXISTS "active upload tickets allow pdf insert" ON storage.objects;
DROP POLICY IF EXISTS "active upload tickets allow pdf update" ON storage.objects;

CREATE POLICY "active upload tickets allow pdf insert"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'product-pdfs'
  AND public.has_active_upload_ticket(name)
);

CREATE POLICY "active upload tickets allow pdf update"
ON storage.objects FOR UPDATE
TO anon
USING (
  bucket_id = 'product-pdfs'
  AND public.has_active_upload_ticket(name)
)
WITH CHECK (
  bucket_id = 'product-pdfs'
  AND public.has_active_upload_ticket(name)
);
