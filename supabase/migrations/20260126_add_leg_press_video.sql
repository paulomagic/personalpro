-- ============================================
-- ADD VIDEO TO LEG PRESS EXERCISE
-- Adiciona vídeo do YouTube ao exercício Leg Press
-- ============================================

-- Verificar estado atual
SELECT id, slug, name, video_url 
FROM exercises 
WHERE slug = 'leg-press';

-- Atualizar com vídeo do YouTube
UPDATE exercises 
SET 
  video_url = 'https://youtu.be/fppT8gFqGwA',
  updated_at = NOW()
WHERE slug = 'leg-press';

-- Verificar resultado
SELECT id, slug, name, video_url, updated_at
FROM exercises 
WHERE slug = 'leg-press';
