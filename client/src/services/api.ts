import axios from 'axios';
import { Movie, RecommendationResponse } from '../types';

const API_BASE = '/api';

export const api = {
  // Health check
  health: () => axios.get(`${API_BASE}/health`),

  // Get available models
  getModels: () => axios.get<{ models: string[] }>(`${API_BASE}/models`),

  // Get recommendations
  getRecommendations: (userId: number, model: string, n: number = 10) =>
    axios.get<RecommendationResponse>(
      `${API_BASE}/recommendations/${userId}?model=${model}&n=${n}`
    ),

  // Search movies
  searchMovies: (query: string, limit: number = 20) =>
    axios.get<{ results: Movie[] }>(`${API_BASE}/movies/search/${query}?limit=${limit}`),

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
