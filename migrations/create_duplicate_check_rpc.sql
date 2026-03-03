-- Duplicate Pin Prevention RPC
-- Run this in Supabase SQL Editor
-- Uses PostGIS to find nearby needs with same category within a radius

CREATE OR REPLACE FUNCTION check_nearby_duplicates(
    check_lat DOUBLE PRECISION,
    check_lng DOUBLE PRECISION,
    check_category TEXT,
    radius_meters INT DEFAULT 100
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    category TEXT,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.title,
        n.category,
        ST_Distance(
            n.location,
            ST_SetSRID(ST_MakePoint(check_lng, check_lat), 4326)::geography
        ) AS distance_meters
    FROM local_needs n
    WHERE n.deleted_at IS NULL
      AND n.category = check_category
      AND ST_DWithin(
          n.location,
          ST_SetSRID(ST_MakePoint(check_lng, check_lat), 4326)::geography,
          radius_meters
      )
    ORDER BY distance_meters ASC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;
