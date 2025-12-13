import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { Dataset, Interaction, Movie, Rating } from '../types';

/**
 * MovieLens dataset loader
 * Handles loading and parsing of MovieLens dataset files
 */
export class MovieLensLoader {
  private dataPath: string;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  /**
   * Load the complete dataset
   */
  async loadDataset(): Promise<Dataset> {
    const [ratings, movies] = await Promise.all([
      this.loadRatings(),
      this.loadMovies()
    ]);

    const interactions: Interaction[] = ratings.map(r => ({
      userId: r.userId,
      itemId: r.movieId,
      weight: r.rating,
      timestamp: r.timestamp
    }));

    const users = new Set(ratings.map(r => r.userId));

    return {
      interactions,
      movies,
      users
    };
  }

  /**
   * Load ratings from ratings.dat (ML-1M format: UserID::MovieID::Rating::Timestamp)
   */
  private async loadRatings(): Promise<Rating[]> {
    const ratingsPath = path.join(this.dataPath, 'ratings.dat');
    const content = fs.readFileSync(ratingsPath, 'utf-8');
    
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    return lines.map(line => {
      const [userId, movieId, rating, timestamp] = line.split('::');
      return {
        userId: parseInt(userId),
        movieId: parseInt(movieId),
        rating: parseFloat(rating),
        timestamp: parseInt(timestamp)
      };
    });
  }

  /**
   * Load movies from movies.dat (ML-1M format: MovieID::Title::Genres)
   */
  private async loadMovies(): Promise<Map<number, Movie>> {
    const moviesPath = path.join(this.dataPath, 'movies.dat');
    const content = fs.readFileSync(moviesPath, 'utf-8');
    
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const moviesMap = new Map<number, Movie>();
    
    for (const line of lines) {
      const parts = line.split('::');
      const movieId = parseInt(parts[0]);
      const title = parts[1];
      const genres = parts[2].split('|').filter((g: string) => g.length > 0);
      
      const movie: Movie = {
        id: movieId,
        title: title,
        genres: genres
      };
      moviesMap.set(movie.id, movie);
    }

    return moviesMap;
  }

  /**
   * Check if dataset exists at the specified path
   */
  static datasetExists(dataPath: string): boolean {
    const ratingsPath = path.join(dataPath, 'ratings.dat');
    const moviesPath = path.join(dataPath, 'movies.dat');
    return fs.existsSync(ratingsPath) && fs.existsSync(moviesPath);
  }
}
