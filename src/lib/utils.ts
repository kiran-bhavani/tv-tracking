// TMDB image size options — see https://developer.themoviedb.org/docs/image-basics
type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'h632' | 'original';

export function getImageUrl(path: string | null, size: ImageSize = 'w500') {
  if (!path) return '/placeholder.png';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
