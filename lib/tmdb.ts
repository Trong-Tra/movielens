const TMDB_API_KEY = process.env.API_TMDb_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
}

export class TMDbService {
  private cache: Map<string, TMDbMovie> = new Map();

  async searchMovie(title: string): Promise<TMDbMovie | null> {
    // Clean up the title (remove year)
    const cleanTitle = title.replace(/\s*\(\d{4}\)\s*$/, '').trim();
    
    // Check cache
    if (this.cache.has(cleanTitle)) {
      return this.cache.get(cleanTitle)!;
    }

    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=en-US&page=1`
      );
      
      if (!response.ok) {
        console.error(`TMDb API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const movie = data.results[0];
        
        // Fetch full details to get genres
        const detailsResponse = await fetch(
          `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`
        );
        
        if (detailsResponse.ok) {
          const details = await detailsResponse.json();
          this.cache.set(cleanTitle, details);
          return details;
        }
        
        return movie;
      }
      
      return null;
    } catch (error) {
      console.error('TMDb API error:', error);
      return null;
    }
  }

  getPosterUrl(posterPath: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342'): string | null {
    if (!posterPath) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath}`;
  }

  getBackdropUrl(backdropPath: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    if (!backdropPath) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath}`;
  }
}

export const tmdbService = new TMDbService();
