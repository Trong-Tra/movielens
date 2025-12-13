# Movie Recommendation System

A complete, production-style movie recommendation platform built with TypeScript. This system implements multiple recommendation algorithms on the MovieLens 1M dataset, featuring collaborative filtering, matrix factorization, and graph-based approaches.

## 🎯 Project Overview

This is an **application-driven** recommendation system designed to mirror real-world recommendation backends. It operates purely on user-item interactions, statistical patterns, and graph/network structures without requiring any actual movie content.

### Key Features

- **Multiple Recommendation Algorithms**
  - Popularity-based baseline
  - Matrix Factorization (ALS)
  - Item-Item Collaborative Filtering
  - Graph-Based (Random Walk with Restart)

- **Comprehensive Evaluation**
  - Precision@K
  - Recall@K
  - NDCG@K
  - Mean Reciprocal Rank (MRR)
  - Catalog Coverage

- **Production-Ready API**
  - RESTful endpoints
  - Model switching at runtime
  - Real-time recommendations

- **Interactive Web UI**
  - Clean, modern interface
  - Model comparison
  - User exploration

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MovieLens 1M dataset (included in `ml-1m/`)

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Running the System

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The system will:
1. Load the MovieLens 1M dataset (1M ratings, 6K users, 4K movies)
2. Split data into train/test sets (80/20)
3. Train all models
4. Evaluate each model
5. Start the API server on http://localhost:3000

## 📊 Dataset

The system uses the **MovieLens 1M** dataset:
- **1,000,209 ratings** from 6,040 users on 3,883 movies
- Ratings on a 5-star scale
- Each user has at least 20 ratings
- Files: `ratings.dat`, `movies.dat`, `users.dat`

### Data Format

**ratings.dat**: `UserID::MovieID::Rating::Timestamp`
**movies.dat**: `MovieID::Title::Genres`

## 🏗️ Architecture

```
src/
├── data/           # Dataset loaders and splitters
├── models/         # Recommendation algorithms
├── evaluation/     # Metrics and evaluation
├── serving/        # API server
├── types/          # TypeScript interfaces
└── server.ts       # Main application
```

### Core Components

#### Data Layer
- `MovieLensLoader`: Loads and parses MovieLens dataset
- `DataSplitter`: Train/test splitting strategies (temporal, random, leave-one-out)

#### Models Layer
- `PopularityModel`: Baseline popularity-based recommendations
- `MatrixFactorizationModel`: ALS-based matrix factorization
- `ItemItemCF`: Cosine similarity-based collaborative filtering
- `GraphBasedModel`: Random walk on bipartite user-item graph

#### Evaluation Layer
- `Evaluator`: Computes ranking metrics (Precision, Recall, NDCG, MRR, Coverage)

#### Serving Layer
- `RecommendationAPI`: Express-based REST API with model management

## 🔌 API Endpoints

### Get Recommendations
```http
GET /api/recommendations/:userId?model=<model>&n=<count>
```

**Parameters:**
- `userId`: User ID (1-6040)
- `model`: Model name (`Popularity`, `MatrixFactorization`, `ItemItemCF`, `GraphBased`)
- `n`: Number of recommendations (default: 10)

**Response:**
```json
{
  "userId": 1,
  "model": "MatrixFactorization",
  "recommendations": [
    {
      "itemId": 2571,
      "score": 4.523,
      "title": "Matrix, The (1999)",
      "genres": ["Action", "Sci-Fi", "Thriller"],
      "explanation": "Matrix factorization"
    }
  ]
}
```

### Get Available Models
```http
GET /api/models
```

### Search Movies
```http
GET /api/movies/search/:query?limit=<count>
```

### Get Random Users
```http
GET /api/users/random?count=<count>
```

### Health Check
```http
GET /api/health
```

## 🧪 Model Performance

After training on 80% of the data, models are evaluated on the remaining 20%:

| Model | Precision@10 | Recall@10 | NDCG@10 | Training Time |
|-------|--------------|-----------|---------|---------------|
| Popularity | ~5-8% | ~3-5% | ~8-12% | <1s |
| Matrix Factorization | ~12-15% | ~7-10% | ~18-22% | 30-60s |
| Item-Item CF | ~10-13% | ~6-9% | ~15-19% | 60-120s |
| Graph-Based | ~8-11% | ~5-7% | ~13-17% | 15-30s |

*Note: Exact metrics depend on train/test split and hyperparameters*

## 🔧 Configuration

Environment variables (`.env`):

```bash
PORT=3000
NODE_ENV=development
MOVIELENS_DATASET_PATH=./ml-1m
```

## 📝 Model Details

### Matrix Factorization
- Algorithm: Alternating Least Squares (ALS)
- Latent factors: 50
- Iterations: 10
- Regularization: 0.01

### Item-Item CF
- Similarity: Cosine similarity
- Top-K similar items: 50

### Graph-Based
- Algorithm: Random Walk with Restart
- Restart probability: 0.15
- Number of walks: 100
- Walk length: 10

## 🎨 Web Interface

Access the web UI at `http://localhost:3000` after starting the server.

Features:
- Select user and model
- Adjust number of recommendations
- Try random users
- View movie details and genres
- Compare model outputs

## 🧩 Extending the System

### Adding a New Model

1. Implement the `RecommenderModel` interface:

```typescript
export class MyModel implements RecommenderModel {
  name = 'MyModel';
  
  fit(data: Interaction[]): void {
    // Training logic
  }
  
  predict(userId: number, itemId: number): number {
    // Prediction logic
  }
  
  recommendTopN(userId: number, n: number, excludeItems?: Set<number>): Recommendation[] {
    // Ranking logic
  }
}
```

2. Register the model in `server.ts`:

```typescript
const models = [
  // ... existing models
  new MyModel()
];
```

### Using a Different Dataset

1. Create a new loader implementing the dataset interface
2. Update the loader in `server.ts`
3. Ensure the data follows the `Interaction` format

## 📚 Technical Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Web Framework**: Express
- **Dataset**: MovieLens 1M
- **Algorithms**: Collaborative Filtering, Matrix Factorization, Graph-Based

## 🔬 Design Philosophy

- **Correctness over cleverness**: Simple, auditable implementations
- **Modularity**: Swappable components with clear interfaces
- **Reproducibility**: Deterministic train/test splits with seeded randomization
- **Explainability**: Transparent scoring and ranking

## 📄 License

This project is for educational and research purposes. The MovieLens dataset is provided by GroupLens Research at the University of Minnesota.

## 🙏 Acknowledgments

- MovieLens dataset: F. Maxwell Harper and Joseph A. Konstan. 2015. The MovieLens Datasets: History and Context. ACM Transactions on Interactive Intelligent Systems (TiiS) 5, 4, Article 19.

## 📧 Contact

For questions or feedback about this implementation, please open an issue in the repository.

---

**Note**: This is a system engineering exercise focused on building a clean, extensible recommendation platform. It prioritizes clarity and correctness over state-of-the-art performance.
