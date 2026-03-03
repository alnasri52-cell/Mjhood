-- PostGIS Backend Clustering Setup
-- Run this in Supabase SQL Editor
-- This enables spatial queries and viewport-based clustering

-- 1. Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add a geography column for efficient spatial queries
ALTER TABLE local_needs
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);

-- 3. Populate the geography column from existing lat/lng data
UPDATE local_needs
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. Create a spatial index for fast bounding box queries
CREATE INDEX IF NOT EXISTS idx_local_needs_location
ON local_needs USING GIST (location);

-- 5. Create a trigger to auto-populate location on insert/update
CREATE OR REPLACE FUNCTION update_need_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_need_location ON local_needs;
CREATE TRIGGER trg_update_need_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON local_needs
    FOR EACH ROW
    EXECUTE FUNCTION update_need_location();

-- 6. RPC function: Get needs within a bounding box (no clustering, just viewport filtering)
CREATE OR REPLACE FUNCTION get_needs_in_viewport(
    min_lng DOUBLE PRECISION,
    min_lat DOUBLE PRECISION,
    max_lng DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    category_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    custom_category TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    upvotes INT,
    downvotes INT,
    created_at TIMESTAMPTZ,
    user_id UUID,
    image_urls TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id, n.title, n.description, n.category, n.custom_category,
        n.latitude, n.longitude, n.upvotes, n.downvotes,
        n.created_at, n.user_id, n.image_urls
    FROM local_needs n
    WHERE n.deleted_at IS NULL
      AND n.latitude BETWEEN min_lat AND max_lat
      AND n.longitude BETWEEN min_lng AND max_lng
      AND (category_filter IS NULL OR n.category = category_filter)
    ORDER BY n.created_at DESC
    LIMIT 2000;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. RPC function: Get clustered needs for a viewport at a given zoom level
CREATE OR REPLACE FUNCTION get_clustered_needs(
    min_lng DOUBLE PRECISION,
    min_lat DOUBLE PRECISION,
    max_lng DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    zoom_level INT DEFAULT 10,
    category_filter TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    grid_size DOUBLE PRECISION;
    result JSON;
BEGIN
    -- Grid size decreases as zoom increases (more detail at higher zoom)
    grid_size := 360.0 / POWER(2, zoom_level);

    SELECT json_agg(cluster_row) INTO result
    FROM (
        SELECT
            json_build_object(
                'type', CASE WHEN COUNT(*) = 1 THEN 'point' ELSE 'cluster' END,
                'count', COUNT(*),
                'latitude', AVG(n.latitude),
                'longitude', AVG(n.longitude),
                -- For single points, include full need data
                'need', CASE WHEN COUNT(*) = 1 THEN
                    json_build_object(
                        'id', MIN(n.id::text),
                        'title', MIN(n.title),
                        'description', MIN(n.description),
                        'category', MIN(n.category),
                        'custom_category', MIN(n.custom_category),
                        'latitude', MIN(n.latitude),
                        'longitude', MIN(n.longitude),
                        'upvotes', MIN(n.upvotes),
                        'downvotes', MIN(n.downvotes),
                        'created_at', MIN(n.created_at::text),
                        'user_id', MIN(n.user_id::text),
                        'image_urls', MIN(n.image_urls::text)
                    )
                ELSE NULL END,
                -- For clusters, include category breakdown
                'categories', json_agg(DISTINCT n.category)
            ) AS cluster_row
        FROM local_needs n
        WHERE n.deleted_at IS NULL
          AND n.latitude BETWEEN min_lat AND max_lat
          AND n.longitude BETWEEN min_lng AND max_lng
          AND (category_filter IS NULL OR n.category = category_filter)
        GROUP BY
            FLOOR(n.latitude / grid_size),
            FLOOR(n.longitude / grid_size)
    ) sub;

    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql STABLE;
