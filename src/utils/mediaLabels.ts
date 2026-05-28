const GENRE_LABEL_OVERRIDES: Record<string, string> = {
  Hentai: 'NSFW',
};

export function getDisplayGenre(genre: string): string {
  return GENRE_LABEL_OVERRIDES[genre] || genre;
}
