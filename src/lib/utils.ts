// TMDB image size options — see https://developer.themoviedb.org/docs/image-basics
type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'h632' | 'original';

export function getImageUrl(path: string | null, size: ImageSize = 'w500') {
  if (!path) return '/placeholder.png';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function formatRuntime(minutes?: number): string {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatBingeTime(totalEpisodes?: number, avgRuntimeMinutes: number = 45): string {
  if (!totalEpisodes || totalEpisodes <= 0) return '';
  const totalMins = totalEpisodes * avgRuntimeMinutes;
  const days = Math.floor(totalMins / (24 * 60));
  const hours = Math.floor((totalMins % (24 * 60)) / 60);
  
  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}, ${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }
  return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
}

export function extractTvRating(showData: any): string | null {
  if (!showData || !showData.content_ratings || !showData.content_ratings.results) return null;
  const results = showData.content_ratings.results;
  const usRating = results.find((r: any) => r.iso_3166_1 === 'US');
  if (usRating && usRating.rating) return usRating.rating;
  return results[0]?.rating || null;
}

export function extractMovieRating(movieData: any): string | null {
  if (!movieData || !movieData.release_dates || !movieData.release_dates.results) return null;
  const results = movieData.release_dates.results;
  const usRelease = results.find((r: any) => r.iso_3166_1 === 'US');
  if (usRelease && usRelease.release_dates) {
    const cert = usRelease.release_dates.find((d: any) => d.certification && d.certification.length > 0);
    if (cert) return cert.certification;
  }
  return null;
}
