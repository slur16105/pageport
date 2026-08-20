-- Storage policies run as the browser's anon role. Keep upload_tickets private
-- and expose only a boolean ticket check through a tightly scoped definer function.
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

REVOKE ALL ON FUNCTION public.has_active_upload_ticket(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_upload_ticket(text) TO anon;

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
