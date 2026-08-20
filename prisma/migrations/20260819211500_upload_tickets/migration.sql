-- 큰 PDF를 끊김 없이 올릴 때 사용하는 일회성 업로드 허가증을 추가하는 변경 기록입니다.
-- 허가증은 정확한 파일 위치와 만료 시간을 가지므로 아무나 PDF 보관함에 올릴 수 없습니다.
CREATE TABLE public.upload_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_key text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX upload_tickets_expires_at_idx ON public.upload_tickets (expires_at);
ALTER TABLE public.upload_tickets ENABLE ROW LEVEL SECURITY;

-- 관리자가 인증되면 브라우저는 임의의 파일 주소 한 개만 받습니다.
-- Supabase는 그 주소의 허가증이 사용 전이고 만료 전일 때만 새 PDF 업로드를 받습니다.
CREATE POLICY "active upload tickets allow pdf insert"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'product-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.upload_tickets
    WHERE object_key = name
      AND used_at IS NULL
      AND expires_at > now()
  )
);

-- 중단된 업로드를 이어 올리는 경우에도 똑같이 유효한 허가증을 확인합니다.
CREATE POLICY "active upload tickets allow pdf update"
ON storage.objects FOR UPDATE
TO anon
USING (
  bucket_id = 'product-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.upload_tickets
    WHERE object_key = name
      AND used_at IS NULL
      AND expires_at > now()
  )
)
WITH CHECK (
  bucket_id = 'product-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.upload_tickets
    WHERE object_key = name
      AND used_at IS NULL
      AND expires_at > now()
  )
);
