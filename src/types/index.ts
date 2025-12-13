/**
 * Core type definitions for the recommendation system
 */

export interface Rating {
  userId: number;
  movieId: number;
  rating: number;
  timestamp: number;
}

export interface Movie {
  id: number;
  title: string;
  genres: string[];
}

export interface User {
  id: number;
}

export interface Interaction {
  userId: number;
  itemId: number;
  weight: number; // Can be rating, click count, implicit signal, etc.
  timestamp?: number;
}

export interface Dataset {
  interactions: Interaction[];
  movies: Map<number, Movie>;
  users: Set<number>;
}

export interface TrainTestSplit {
  train: Interaction[];
  test: Interaction[];
}

export interface Recommendation {
  itemId: number;
  score: number;
  explanation?: string;
}

export interface RecommenderModel {
  name: string;
  fit(data: Interaction[]): Promise<void> | void;
  predict(userId: number, itemId: number): number;
  recommendTopN(userId: number, n: number, excludeItems?: Set<number>): Recommendation[];
}

export interface EvaluationMetrics {
  precisionAtK: number;
  recallAtK: number;
  ndcgAtK: number;
  mrr: number;
  coverage: number;
}

export interface GraphEdge {
  from: number;
  to: number;
  weight: number;
}

export interface BipartiteGraph {
  userNodes: Set<number>;
  itemNodes: Set<number>;
  edges: GraphEdge[];
}
