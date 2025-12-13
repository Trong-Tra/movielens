import axios from 'axios';
import { Movie, Recommendation, ModelInfo } from '../types';

const API_BASE = '/api';

// Helper functions exported separately
export const getModels = async (): Promise<ModelInfo[]> => {
  const response = await axios.get<{ models: string[] }>(`${API_BASE}/models`);
  // Transform simple model list into ModelInfo objects
  return response.data.models.map(name => ({
    name,
    description: getModelDescription(name),
    metrics: {} as Record<string, number | string>
  }));
};

export const getRecommendations = async (
  userId: number,
  model: string,
  n: number = 10
): Promise<Recommendation[]> => {
  const response = await axios.get(
    `${API_BASE}/recommendations/${userId}?model=${model}&n=${n}`
  );
  return response.data.recommendations;
};

export const searchMovies = async (query: string, limit: number = 20): Promise<Movie[]> => {
  const response = await axios.get<{ results: Movie[] }>(
    `${API_BASE}/movies/search/${query}?limit=${limit}`
  );
  return response.data.results;
};

const getModelDescription = (name: string): string => {
  const descriptions: Record<string, string> = {
    'popularity': 'Recommends the most popular movies overall',
    'matrix-factorization': 'Uses collaborative filtering with latent factor models',
    'item-item-cf': 'Recommends based on item similarity patterns',
    'graph-based': 'Uses random walk on user-item graph',
  };
  return descriptions[name] || 'Advanced recommendation algorithm';
};

export const api = {
  // Health check
  health: () => axios.get(`${API_BASE}/health`),

  // Get movie details
  getMovie: (movieId: number) => axios.get<Movie>(`${API_BASE}/movies/${movieId}`),

  // Get random users
  getRandomUsers: (count: number = 10) =>
    axios.get<{ users: number[] }>(`${API_BASE}/users/random?count=${count}`),
};

// TMDB API for movie posters
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY'; // User will need to add their own
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export const tmdb = {
  searchMovie: async (title: string) => {
    try {
      const response = await axios.get(`${TMDB_BASE}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: title,
        },
      });
      return response.data.results[0];
    } catch (error) {
      return null;
    }
  },

  getPosterUrl: (posterPath: string | null) => {
    if (!posterPath) return null;
    return `${TMDB_IMAGE_BASE}${posterPath}`;
  },
};
