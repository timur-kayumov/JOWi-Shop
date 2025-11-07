-- Migration: Simple and Reliable Transliteration using REPLACE
-- Using plain REPLACE which is guaranteed to work with UTF-8

DROP FUNCTION IF EXISTS cyrillic_to_latin(text);
DROP FUNCTION IF EXISTS latin_to_cyrillic(text);

-- Cyrillic to Latin using sequential REPLACE operations
CREATE OR REPLACE FUNCTION cyrillic_to_latin(input_text text) RETURNS text AS $$
DECLARE
  result text;
BEGIN
  result := LOWER(input_text);

  -- Multi-character replacements first
  result := REPLACE(result, 'щ', 'shch');
  result := REPLACE(result, 'ё', 'yo');
  result := REPLACE(result, 'ж', 'zh');
  result := REPLACE(result, 'х', 'kh');
  result := REPLACE(result, 'ц', 'ts');
  result := REPLACE(result, 'ч', 'ch');
  result := REPLACE(result, 'ш', 'sh');
  result := REPLACE(result, 'ю', 'yu');
  result := REPLACE(result, 'я', 'ya');

  -- Single character replacements
  result := REPLACE(result, 'а', 'a');
  result := REPLACE(result, 'б', 'b');
  result := REPLACE(result, 'в', 'v');
  result := REPLACE(result, 'г', 'g');
  result := REPLACE(result, 'д', 'd');
  result := REPLACE(result, 'е', 'e');
  result := REPLACE(result, 'з', 'z');
  result := REPLACE(result, 'и', 'i');
  result := REPLACE(result, 'й', 'y');
  result := REPLACE(result, 'к', 'k');
  result := REPLACE(result, 'л', 'l');
  result := REPLACE(result, 'м', 'm');
  result := REPLACE(result, 'н', 'n');
  result := REPLACE(result, 'о', 'o');
  result := REPLACE(result, 'п', 'p');
  result := REPLACE(result, 'р', 'r');
  result := REPLACE(result, 'с', 's');
  result := REPLACE(result, 'т', 't');
  result := REPLACE(result, 'у', 'u');
  result := REPLACE(result, 'ф', 'f');
  result := REPLACE(result, 'ъ', '');
  result := REPLACE(result, 'ы', 'y');
  result := REPLACE(result, 'ь', '');
  result := REPLACE(result, 'э', 'e');

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Latin to Cyrillic (reverse operation)
CREATE OR REPLACE FUNCTION latin_to_cyrillic(input_text text) RETURNS text AS $$
DECLARE
  result text;
BEGIN
  result := LOWER(input_text);

  -- Multi-character replacements first (ORDER MATTERS!)
  result := REPLACE(result, 'shch', 'щ');
  result := REPLACE(result, 'yo', 'ё');
  result := REPLACE(result, 'zh', 'ж');
  result := REPLACE(result, 'kh', 'х');
  result := REPLACE(result, 'ts', 'ц');
  result := REPLACE(result, 'ch', 'ч');
  result := REPLACE(result, 'sh', 'ш');
  result := REPLACE(result, 'yu', 'ю');
  result := REPLACE(result, 'ya', 'я');

  -- Single letters
  result := REPLACE(result, 'a', 'а');
  result := REPLACE(result, 'b', 'б');
  result := REPLACE(result, 'v', 'в');
  result := REPLACE(result, 'g', 'г');
  result := REPLACE(result, 'd', 'д');
  result := REPLACE(result, 'e', 'е');
  result := REPLACE(result, 'z', 'з');
  result := REPLACE(result, 'i', 'и');
  result := REPLACE(result, 'y', 'й');
  result := REPLACE(result, 'k', 'к');
  result := REPLACE(result, 'l', 'л');
  result := REPLACE(result, 'm', 'м');
  result := REPLACE(result, 'n', 'н');
  result := REPLACE(result, 'o', 'о');
  result := REPLACE(result, 'p', 'п');
  result := REPLACE(result, 'r', 'р');
  result := REPLACE(result, 's', 'с');
  result := REPLACE(result, 't', 'т');
  result := REPLACE(result, 'u', 'у');
  result := REPLACE(result, 'f', 'ф');

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

COMMENT ON FUNCTION cyrillic_to_latin(text) IS 'Reliable Cyrillic to Latin transliteration using REPLACE';
COMMENT ON FUNCTION latin_to_cyrillic(text) IS 'Reliable Latin to Cyrillic transliteration using REPLACE';
