import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { RecommenderModel } from '../types';
import { Dataset } from '../types';

export class RecommendationAPI {
  private app: express.Application;
  private models: Map<string, RecommenderModel> = new Map();
  private dataset: Dataset | null = null;
  private trainedInteractions: Map<number, Set<number>> = new Map();

  constructor(private port: number = 3001) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', models: Array.from(this.models.keys()) });
    });

    // Get available models
    this.app.get('/api/models', (req: Request, res: Response) => {
      const models = Array.from(this.models.keys());
      res.json({ models });
    });

    // Get next available user ID
    this.app.get('/api/users/next-id', (req: Request, res: Response) => {
      try {
        if (!this.dataset) {
          res.status(503).json({ error: 'Dataset not loaded' });
          return;
        }

        // Find the highest user ID in the dataset
        const maxUserId = Math.max(...Array.from(this.dataset.users));
        const nextUserId = maxUserId + 1;

        res.json({ nextUserId });
      } catch (error) {
        console.error('Error getting next user ID:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get recommendations for a user
    this.app.get('/api/recommendations/:userId', (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const model = req.query.model as string || Array.from(this.models.keys())[0];
        const n = parseInt(req.query.n as string) || 10;

        if (isNaN(userId)) {
          res.status(400).json({ error: 'Invalid user ID' });
          return;
        }

        const recommender = this.models.get(model);
        if (!recommender) {
          res.status(404).json({ error: `Model ${model} not found` });
          return;
        }

        // Get items to exclude (user's training items)
        const excludeItems = this.trainedInteractions.get(userId) || new Set();
        
        const recommendations = recommender.recommendTopN(userId, n, excludeItems);

        // Add movie metadata if available
        const enrichedRecommendations = recommendations.map(rec => {
          const movie = this.dataset?.movies.get(rec.itemId);
          return {
            ...rec,
            title: movie?.title,
            genres: movie?.genres
          };
        });

        res.json({
          userId,
          model,
          recommendations: enrichedRecommendations
        });
      } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get movie details
    this.app.get('/api/movies/:movieId', (req: Request, res: Response) => {
      try {
        const movieId = parseInt(req.params.movieId);
        
        if (isNaN(movieId)) {
          res.status(400).json({ error: 'Invalid movie ID' });
          return;
        }

        const movie = this.dataset?.movies.get(movieId);
        if (!movie) {
          res.status(404).json({ error: 'Movie not found' });
          return;
        }

        res.json(movie);
      } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get random users for demo
    this.app.get('/api/users/random', (req: Request, res: Response) => {
      try {
        const count = parseInt(req.query.count as string) || 10;
        
        if (!this.dataset) {
          res.status(503).json({ error: 'Dataset not loaded' });
          return;
        }

        const users = Array.from(this.dataset.users);
        const randomUsers = [];
        
        for (let i = 0; i < Math.min(count, users.length); i++) {
          const randomIndex = Math.floor(Math.random() * users.length);
          randomUsers.push(users[randomIndex]);
        }

        res.json({ users: randomUsers });
      } catch (error) {
        console.error('Error fetching random users:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Search movies
    this.app.get('/api/movies/search/:query', (req: Request, res: Response) => {
      try {
        const query = req.params.query.toLowerCase();
        const limit = parseInt(req.query.limit as string) || 20;

        if (!this.dataset) {
          res.status(503).json({ error: 'Dataset not loaded' });
          return;
        }

        const results = [];
        for (const movie of this.dataset.movies.values()) {
          if (movie.title.toLowerCase().includes(query)) {
            results.push(movie);
            if (results.length >= limit) break;
          }
        }

        res.json({ results });
      } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get user's rating for a movie
    this.app.get('/api/ratings/:userId/:movieId', (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const movieId = parseInt(req.params.movieId);

        if (isNaN(userId) || isNaN(movieId)) {
          res.status(400).json({ error: 'Invalid user or movie ID' });
          return;
        }

        if (!this.dataset) {
          res.status(503).json({ error: 'Dataset not loaded' });
          return;
        }

        // Find rating in dataset
        const rating = this.dataset.interactions.find(
          i => i.userId === userId && i.itemId === movieId
        );

        if (!rating) {
          res.json({ rated: false });
          return;
        }

        res.json({
          rated: true,
          rating: rating.weight,
          timestamp: rating.timestamp
        });
      } catch (error) {
        console.error('Error fetching rating:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Add or update a rating
    this.app.post('/api/ratings', (req: Request, res: Response) => {
      try {
        const { userId, movieId, rating } = req.body;

        if (!userId || !movieId || !rating) {
          res.status(400).json({ error: 'Missing required fields: userId, movieId, rating' });
          return;
        }

        if (rating < 1 || rating > 5) {
          res.status(400).json({ error: 'Rating must be between 1 and 5' });
          return;
        }

        if (!this.dataset) {
          res.status(503).json({ error: 'Dataset not loaded' });
          return;
        }

        // Find existing rating
        const existingIndex = this.dataset.interactions.findIndex(
          i => i.userId === userId && i.itemId === movieId
        );

        const timestamp = Date.now();

        if (existingIndex >= 0) {
          // Update existing rating
          this.dataset.interactions[existingIndex].weight = rating;
          this.dataset.interactions[existingIndex].timestamp = timestamp;
          res.json({ success: true, action: 'updated', rating });
        } else {
          // Add new rating
          this.dataset.interactions.push({
            userId,
            itemId: movieId,
            weight: rating,
            timestamp
          });
          res.json({ success: true, action: 'added', rating });
        }
      } catch (error) {
        console.error('Error saving rating:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // TMDb movie search proxy
    this.app.get('/api/tmdb/movie/:title', async (req: Request, res: Response) => {
      try {
        const title = decodeURIComponent(req.params.title);
        const cleanTitle = title.replace(/\s*\(\d{4}\)\s*$/, '').trim();
        
        const tmdbApiKey = process.env.API_TMDb_KEY;
        if (!tmdbApiKey) {
          res.status(500).json({ error: 'TMDb API key not configured' });
          return;
        }

        // Search for movie
        const searchResponse = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(cleanTitle)}&language=en-US&page=1`
        );

        if (!searchResponse.ok) {
          res.status(searchResponse.status).json({ error: 'TMDb API error' });
          return;
        }

        const searchData: any = await searchResponse.json();

        if (searchData.results && searchData.results.length > 0) {
          const movie = searchData.results[0];

          // Fetch full details
          const detailsResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${tmdbApiKey}&language=en-US`
          );

          if (detailsResponse.ok) {
            const details: any = await detailsResponse.json();
            res.json(details);
          } else {
            res.json(movie);
          }
        } else {
          res.status(404).json({ error: 'Movie not found' });
        }
      } catch (error) {
        console.error('Error fetching TMDb data:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  registerModel(model: RecommenderModel): void {
    this.models.set(model.name, model);
    console.log(`Registered model: ${model.name}`);
  }

  setDataset(dataset: Dataset, trainInteractions: any[]): void {
    this.dataset = dataset;
    
    // Build map of user's training items
    for (const interaction of trainInteractions) {
      if (!this.trainedInteractions.has(interaction.userId)) {
        this.trainedInteractions.set(interaction.userId, new Set());
      }
      this.trainedInteractions.get(interaction.userId)!.add(interaction.itemId);
    }
  }

  start(): void {
    this.app.listen(this.port, () => {
      console.log(`\n🚀 Recommendation API server running on http://localhost:${this.port}`);
      console.log(`📊 API endpoints:`);
      console.log(`   - GET /api/health`);
      console.log(`   - GET /api/models`);
      console.log(`   - GET /api/recommendations/:userId?model=<model>&n=<count>`);
      console.log(`   - GET /api/movies/:movieId`);
      console.log(`   - GET /api/movies/search/:query`);
      console.log(`   - GET /api/users/random?count=<count>\n`);
    });
  }
}
