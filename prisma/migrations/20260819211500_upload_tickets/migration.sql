CREATE TABLE public.upload_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_key text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX upload_tickets_expires_at_idx ON public.upload_tickets (expires_at);
ALTER TABLE public.upload_tickets ENABLE ROW LEVEL SECURITY;

-- A browser receives only one random path after administrator authentication.
-- Supabase Storage accepts a resumable upload only while that exact ticket is active.
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
