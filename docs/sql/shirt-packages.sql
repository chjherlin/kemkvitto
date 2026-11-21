-- Proposal only. Do not run until Kimmen approves.
--
-- The old product page had no stored package price. +5 and +10 added that
-- many shirts at the single Skjorta price. This gives existing laundries the
-- two new products and, only when a price is missing, sets it to 5 or 10
-- times that laundry's current Skjorta price. They can change it in Settings.
-- Rows with garment_list NULL already receive the new default list from code.

UPDATE washers
SET price_list = price_list
  || CASE
       WHEN price_list ? '5 Skjortor' THEN '{}'::jsonb
       ELSE jsonb_build_object(
         '5 Skjortor',
         COALESCE((price_list->>'Skjorta')::numeric, 0) * 5
       )
     END
  || CASE
       WHEN price_list ? '10 Skjortor' THEN '{}'::jsonb
       ELSE jsonb_build_object(
         '10 Skjortor',
         COALESCE((price_list->>'Skjorta')::numeric, 0) * 10
       )
     END
WHERE price_list IS NOT NULL;

UPDATE washers
SET garment_list = (
  SELECT jsonb_agg(name ORDER BY ord)
  FROM (
    SELECT elem AS name, ord
    FROM jsonb_array_elements_text(garment_list) WITH ORDINALITY AS listed(elem, ord)
    WHERE elem NOT IN ('Skjorta ×5', 'Skjorta ×10')
    UNION ALL
    SELECT '5 Skjortor', 1000
    WHERE NOT garment_list @> '["5 Skjortor"]'::jsonb
    UNION ALL
    SELECT '10 Skjortor', 1001
    WHERE NOT garment_list @> '["10 Skjortor"]'::jsonb
  ) names
)
WHERE garment_list IS NOT NULL;
