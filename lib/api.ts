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
  // Transform backend response to match frontend type
  return response.data.recommendations.map((rec: any) => ({
    movie: {
      id: rec.itemId,
      title: rec.title,
      genres: rec.genres
    },
    score: rec.score,
    explanation: rec.explanation
  }));
};

export const searchMovies = async (query: string, limit: number = 20): Promise<Movie[]> => {
  const response = await axios.get<{ results: Movie[] }>(
    `${API_BASE}/movies/search/${query}?limit=${limit}`
  );
  return response.data.results;
};

const getModelDescription = (name: string): string => {
  const descriptions: Record<string, string> = {
    'Popularity': 'Recommends the most popular movies overall',
    'MatrixFactorization': 'Uses collaborative filtering with latent factor models (ALS)',
    'ItemItemCF': 'Item-item collaborative filtering based on cosine similarity',
    'GraphBased': 'Random walk with restart on user-item bipartite graph',
  };
  return descriptions[name] || 'Advanced recommendation algorithm';
};
