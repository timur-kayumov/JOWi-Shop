-- Migration: Final Transliteration Solution using regexp_replace
-- This approach handles Cyrillic characters correctly

DROP FUNCTION IF EXISTS cyrillic_to_latin(text);
DROP FUNCTION IF EXISTS latin_to_cyrillic(text);

-- Robust Cyrillic to Latin transliteration
CREATE OR REPLACE FUNCTION cyrillic_to_latin(input_text text) RETURNS text AS $$
DECLARE
  result text;
BEGIN
  result := LOWER(input_text);

  -- Replace multi-character Cyrillic letters first
  result := regexp_replace(result, 'щ', 'shch', 'g');
  result := regexp_replace(result, 'ё', 'yo', 'g');
  result := regexp_replace(result, 'ж', 'zh', 'g');
  result := regexp_replace(result, 'х', 'kh', 'g');
  result := regexp_replace(result, 'ц', 'ts', 'g');
  result := regexp_replace(result, 'ч', 'ch', 'g');
  result := regexp_replace(result, 'ш', 'sh', 'g');
  result := regexp_replace(result, 'ю', 'yu', 'g');
  result := regexp_replace(result, 'я', 'ya', 'g');

  -- Replace single-character Cyrillic letters
  result := regexp_replace(result, 'а', 'a', 'g');
  result := regexp_replace(result, 'б', 'b', 'g');
  result := regexp_replace(result, 'в', 'v', 'g');
  result := regexp_replace(result, 'г', 'g', 'g');
  result := regexp_replace(result, 'д', 'd', 'g');
  result := regexp_replace(result, 'е', 'e', 'g');
  result := regexp_replace(result, 'з', 'z', 'g');
  result := regexp_replace(result, 'и', 'i', 'g');
  result := regexp_replace(result, 'й', 'y', 'g');
  result := regexp_replace(result, 'к', 'k', 'g');
  result := regexp_replace(result, 'л', 'l', 'g');
  result := regexp_replace(result, 'м', 'm', 'g');
  result := regexp_replace(result, 'н', 'n', 'g');
  result := regexp_replace(result, 'о', 'o', 'g');
  result := regexp_replace(result, 'п', 'p', 'g');
  result := regexp_replace(result, 'р', 'r', 'g');
  result := regexp_replace(result, 'с', 's', 'g');
  result := regexp_replace(result, 'т', 't', 'g');
  result := regexp_replace(result, 'у', 'u', 'g');
  result := regexp_replace(result, 'ф', 'f', 'g');
  result := regexp_replace(result, 'ъ', '', 'g');
  result := regexp_replace(result, 'ы', 'y', 'g');
  result := regexp_replace(result, 'ь', '', 'g');
  result := regexp_replace(result, 'э', 'e', 'g');

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Simplified Latin to Cyrillic (for reverse lookup)
CREATE OR REPLACE FUNCTION latin_to_cyrillic(input_text text) RETURNS text AS $$
DECLARE
  result text;
BEGIN
  result := LOWER(input_text);

  -- Replace multi-character combinations first (order matters!)
  result := regexp_replace(result, 'shch', 'щ', 'g');
  result := regexp_replace(result, 'yo', 'ё', 'g');
  result := regexp_replace(result, 'zh', 'ж', 'g');
  result := regexp_replace(result, 'kh', 'х', 'g');
  result := regexp_replace(result, 'ts', 'ц', 'g');
  result := regexp_replace(result, 'ch', 'ч', 'g');
  result := regexp_replace(result, 'sh', 'ш', 'g');
  result := regexp_replace(result, 'yu', 'ю', 'g');
  result := regexp_replace(result, 'ya', 'я', 'g');

  -- Replace single letters
  result := regexp_replace(result, 'a', 'а', 'g');
  result := regexp_replace(result, 'b', 'б', 'g');
  result := regexp_replace(result, 'v', 'в', 'g');
  result := regexp_replace(result, 'g', 'г', 'g');
  result := regexp_replace(result, 'd', 'д', 'g');
  result := regexp_replace(result, 'e', 'е', 'g');
  result := regexp_replace(result, 'z', 'з', 'g');
  result := regexp_replace(result, 'i', 'и', 'g');
  result := regexp_replace(result, 'y', 'й', 'g');
  result := regexp_replace(result, 'k', 'к', 'g');
  result := regexp_replace(result, 'l', 'л', 'g');
  result := regexp_replace(result, 'm', 'м', 'g');
  result := regexp_replace(result, 'n', 'н', 'g');
  result := regexp_replace(result, 'o', 'о', 'g');
  result := regexp_replace(result, 'p', 'п', 'g');
  result := regexp_replace(result, 'r', 'р', 'g');
  result := regexp_replace(result, 's', 'с', 'g');
  result := regexp_replace(result, 't', 'т', 'g');
  result := regexp_replace(result, 'u', 'у', 'g');
  result := regexp_replace(result, 'f', 'ф', 'g');

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION cyrillic_to_latin(text) IS 'Transliterates Cyrillic to Latin using regexp_replace (reliable for UTF-8)';
COMMENT ON FUNCTION latin_to_cyrillic(text) IS 'Transliterates Latin to Cyrillic using regexp_replace (reliable for UTF-8)';
