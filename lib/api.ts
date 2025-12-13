import axios from 'axios';
import { Movie, Recommendation, ModelInfo } from '@/types';

const API_BASE = '/api';

export const getModels = async (): Promise<ModelInfo[]> => {
  const response = await axios.get<{ models: string[] }>(`${API_BASE}/models`);
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
