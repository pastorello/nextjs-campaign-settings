-- SPEC-024: an area's footprint becomes a polygon, stored as {"ring": [...]}.
-- Every two-corner rectangle SPEC-009 stored, [[lat1,lng1],[lat2,lng2]],
-- becomes the four-vertex ring of the same rectangle, so an existing area
-- renders and behaves exactly as before. `isFootprint` accepts only the new
-- shape from here on: two accepted formats in one Json column is how the next
-- reader gets it wrong (SPEC-024 §6).
--
-- Reversible only while a footprint is still a rectangle: once the DM draws a
-- real polygon, going back to two corners loses the shape.
UPDATE "zone"
SET "footprint" = jsonb_build_object(
  'ring',
  jsonb_build_array(
    jsonb_build_array("footprint" -> 0 -> 0, "footprint" -> 0 -> 1),
    jsonb_build_array("footprint" -> 0 -> 0, "footprint" -> 1 -> 1),
    jsonb_build_array("footprint" -> 1 -> 0, "footprint" -> 1 -> 1),
    jsonb_build_array("footprint" -> 1 -> 0, "footprint" -> 0 -> 1)
  )
)
WHERE "footprint" IS NOT NULL
  AND jsonb_typeof("footprint") = 'array'
  AND jsonb_array_length("footprint") = 2;
