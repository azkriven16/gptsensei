const GENRE_LABEL_OVERRIDES: Record<string, string> = {
  Hentai: 'NSFW',
};

export function getDisplayGenre(genre: string): string {
  return GENRE_LABEL_OVERRIDES[genre] || genre;
}

export function getMediaTypeLabel(format: string | null | undefined, countryOfOrigin: string | null | undefined): string {
  if (!format || format === 'MANGA') {
    if (countryOfOrigin === 'KR') return 'MANHWA';
    if (countryOfOrigin === 'CN' || countryOfOrigin === 'TW') return 'MANHUA';
    return 'MANGA';
  }
  if (format === 'NOVEL') return 'NOVEL';
  if (format === 'ONE_SHOT') return 'ONE-SHOT';
  return format;
}
