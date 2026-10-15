INSERT INTO public.garantias (project_id, numero_garantia, vigencia_inicio, vigencia_fin, monto)
SELECT p.id,
  COALESCE(g->>'numero', ''),
  NULLIF(g->>'vigenciaInicio', '')::date,
  NULLIF(g->>'vigenciaFin', '')::date,
  COALESCE((g->>'monto')::numeric, 0)
FROM public.projects p
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.photos->'garantias', '[]'::jsonb)) AS g
WHERE jsonb_typeof(COALESCE(p.photos->'garantias', '[]'::jsonb)) = 'array'
  AND NOT EXISTS (
    SELECT 1 FROM public.garantias gr
    WHERE gr.project_id = p.id
      AND gr.numero_garantia = COALESCE(g->>'numero', '')
  );