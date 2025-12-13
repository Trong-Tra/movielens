export interface Movie {
  id: number;
  title: string;
  genres: string[];
}

export interface User {
  id: number;
  name: string;
  age?: number;
  gender?: string;
}

export interface Rating {
  userId: number;
  movieId: number;
  rating: number;
  timestamp: number;
}

export interface Recommendation {
  itemId: number;
  score: number;
  explanation?: string;
  title?: string;
  genres?: string[];
}

export interface RecommendationResponse {
  userId: number;
  model: string;
  recommendations: Recommendation[];
}

export interface ModelMetrics {
  model: string;
  precisionAtK: number;
  recallAtK: number;
  ndcgAtK: number;
  mrr: number;
  coverage: number;
}
