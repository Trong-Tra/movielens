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
    this.app.use(express.static(path.join(__dirname, '../../public')));
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
      console.log(`   - GET /api/users/random?count=<count>`);
      console.log(`\n🎬 Web UI available at http://localhost:${this.port}\n`);
    });
  }
}
