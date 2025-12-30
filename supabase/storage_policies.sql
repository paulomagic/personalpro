-- ============================================
-- STORAGE SECURITY POLICIES - PersonalPro
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Bucket: assessment-photos
-- Garante que o bucket existe (script idempotente se possível, mas buckets geralmente são criados via UI ou API)
-- INSERT INTO storage.buckets (id, name) VALUES ('assessment-photos', 'assessment-photos') ON CONFLICT DO NOTHING;

-- Habilitar RLS na tabela objects (Global para Storage)
-- OBS: Comentado pois gera erro de permissão (42501) se você não for superuser.
-- O Supabase já habilita RLS por padrão no Storage.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Permitir Upload (INSERT) - Apenas authenticated users
-- Regra: O usuário só pode fazer upload para sua própria pasta/caminho ou qualquer arquivo se for autenticado?
-- Blueprint: "Buckets de arquivos com RLS (ex: usuário só vê sua própria foto)"
-- Implementação: Restringir caminho por coach_id (que é o auth.uid())

CREATE POLICY "Coachs can upload assessment photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assessment-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Permitir Leitura (SELECT) - Apenas authenticated users (Coachs)
-- Regra: Coach só vê fotos que estão na sua pasta.
CREATE POLICY "Coachs can view their own assessment photos" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'assessment-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Permitir Delete (DELETE) - Apenas authenticated owners
CREATE POLICY "Coachs can delete their own assessment photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'assessment-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Permitir Update (UPDATE) - Se necessário substituir arquivos
CREATE POLICY "Coachs can update their own assessment photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'assessment-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
