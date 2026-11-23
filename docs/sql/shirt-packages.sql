-- Proposal only. Do not run until Kimmen approves.
--
-- Does not convert existing prices into another currency. A laundry keeps
-- the numbers it already stored and only the currency sign changes in the app.
-- This only fills missing shirt-package prices, using the Swedish ratio
-- (150/80 and 250/80, about 1.9 and 3.1) rounded to the nearest 5.
-- Rows with garment_list NULL already receive the new default list from code.

UPDATE washers
SET price_list = price_list
  || CASE
       WHEN price_list ? '5 Skjortor' THEN '{}'::jsonb
       ELSE jsonb_build_object(
         '5 Skjortor',
         ROUND(COALESCE((price_list->>'Skjorta')::numeric, 0) * 1.875 / 5) * 5
       )
     END
  || CASE
       WHEN price_list ? '10 Skjortor' THEN '{}'::jsonb
       ELSE jsonb_build_object(
         '10 Skjortor',
         ROUND(COALESCE((price_list->>'Skjorta')::numeric, 0) * 3.125 / 5) * 5
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
