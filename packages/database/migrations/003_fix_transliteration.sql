-- Migration: Fix Transliteration Functions using TRANSLATE
-- Replace inefficient REPLACE-based transliteration with TRANSLATE function

DROP FUNCTION IF EXISTS cyrillic_to_latin(text);
DROP FUNCTION IF EXISTS latin_to_cyrillic(text);

-- Cyrillic to Latin transliteration using TRANSLATE
CREATE OR REPLACE FUNCTION cyrillic_to_latin(input_text text) RETURNS text AS $$
BEGIN
  RETURN LOWER(TRANSLATE(input_text,
    'АаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщЪъЫыЬьЭэЮюЯя',
    'aabbvvggddeeyozhzhzziiykklllmmnnoopprrssttuuffkhkhtststchchshshshshchshchyyyyeeeyuyaya'
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Latin to Cyrillic transliteration (simplified - cannot reverse multi-char replacements perfectly)
CREATE OR REPLACE FUNCTION latin_to_cyrillic(input_text text) RETURNS text AS $$
BEGIN
  -- Simplified version: only handles basic single-letter mappings
  RETURN LOWER(TRANSLATE(input_text,
    'abvgdezijklmnoprstuf',
    'абвгдезийклмнопрстуф'
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION cyrillic_to_latin(text) IS 'Transliterates Cyrillic text to Latin alphabet using TRANSLATE (more efficient than REPLACE)';
COMMENT ON FUNCTION latin_to_cyrillic(text) IS 'Transliterates Latin text to Cyrillic alphabet (simplified mapping)';
