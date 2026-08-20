-- Supabase Storage가 새 PDF를 저장한 뒤 결과 정보를 돌려줄 때 필요한 SELECT 정책입니다.
-- 일반 목록 조회나 다운로드에는 열지 않고, TUS 업로드 처리 중인 일회용 경로에만 허용합니다.

DROP POLICY IF EXISTS "active upload tickets allow pdf select during tus" ON storage.objects;

CREATE POLICY "active upload tickets allow pdf select during tus"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'product-pdfs'
  AND public.has_active_upload_ticket(name)
  AND storage.allow_any_operation(
    ARRAY[
      'storage.tus.upload.create',
      'storage.tus.upload.part',
      'storage.object.upload'
    ]
  )
);
