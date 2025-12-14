# 🎬 MovieLens Recommendation System

A full-stack movie recommendation platform built with TypeScript, featuring multiple AI-powered recommendation algorithms, a Netflix-inspired UI, and TMDb integration for rich movie data.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🤖 Multiple Recommendation Algorithms
- **Popularity-Based**: Community favorite movies
- **Matrix Factorization (ALS)**: Latent factor models for personalized recommendations
- **Item-Item Collaborative Filtering**: Find movies similar to what you've liked
- **Graph-Based (Random Walk with Restart)**: Network-based recommendations using bipartite graphs

### 🎨 Modern UI
- Netflix-inspired dark theme with Tailwind CSS v4
- Movie posters and details from TMDb API
- Interactive rating system with star ratings
- Smooth animations and responsive design
- Full-screen movie detail modals

### 👤 User Management
- Simple onboarding flow (rate 10+ movies to get started)
- Sequential user ID generation (6041, 6042, 6043...)
- LocalStorage-based session persistence
- **Cold-start support**: All models work for new users!

### 📊 Dataset
- MovieLens 1M dataset (1,000,209 ratings, 6,040 users, 3,883 movies)
- 80/20 train/test split
- Model caching for fast server startup

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested on v22.20.0)
- npm or yarn
- TMDb API key (free from [themoviedb.org](https://www.themoviedb.org/settings/api))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Trong-Tra/movielens.git
cd movielens-proj
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your TMDb API key:
```env
PORT=3001
API_TMDb_KEY=your_tmdb_api_key_here
MOVIELENS_DATASET_PATH=./ml-1m
```

4. **Download MovieLens 1M dataset**
```bash
# The dataset should be in ml-1m/ directory
# Download from: https://grouplens.org/datasets/movielens/1m/
# Extract and place movies.dat, ratings.dat, users.dat in ml-1m/
```

### Running the Application

**Terminal 1 - Backend (Port 3001)**
```bash
npm run dev
```
The backend will:
- Load the MovieLens 1M dataset
- Train all models (first run takes ~3-5 minutes)
- Cache trained models to `data/models/` for faster subsequent starts
- Start API server on http://localhost:3001

**Terminal 2 - Frontend (Port 3000)**
```bash
npm run dev:next
```
The frontend will start on http://localhost:3000

### First Time Setup

1. Go to http://localhost:3000/get-started
2. Rate at least 10 movies (click on movie cards to see details and rate)
3. Complete onboarding to get your unique user ID
4. Explore personalized recommendations from all 4 algorithms!

## 📁 Project Structure

```
movielens-proj/
├── src/                          # Backend TypeScript source
│   ├── models/                   # Recommendation algorithms
│   │   ├── BaselineModels.ts    # Popularity model
│   │   ├── MatrixFactorization.ts
│   │   ├── ItemItemCF.ts
│   │   └── GraphBased.ts
│   ├── serving/                  # API server
│   │   └── RecommendationAPI.ts
│   ├── data/                     # Data loading utilities
│   ├── evaluation/               # Metrics and evaluation
│   ├── utils/                    # Helper utilities
│   └── server.ts                 # Main backend entry point
│
├── components/                   # React components
│   ├── ExplorePage.tsx           # Main recommendations page
│   ├── FeaturedMoviesPage.tsx   # Top movies leaderboard
│   ├── BrowseOthersPage.tsx     # Explore other users
│   ├── OnboardingPage.tsx       # New user onboarding
│   ├── MovieCard.tsx             # Reusable movie card with poster
│   └── MovieDetailsModal.tsx    # Full movie details modal
│
├── contexts/                     # React contexts
│   └── UserContext.tsx           # User state management
│
├── lib/                          # Frontend utilities
│   ├── api.ts                    # API client functions
│   └── tmdb.ts                   # TMDb API integration
│
├── app/                          # Next.js app router
│   ├── page.tsx                  # Home page (redirects to /explore)
│   ├── explore/                  # Main recommendations
│   ├── featured/                 # Featured movies
│   ├── browse-others/            # Browse others
│   ├── get-started/              # Onboarding
│   └── layout.tsx                # Root layout with navigation
│
├── data/                         # Data and cached models
│   └── models/                   # Trained model cache (auto-generated)
│
├── ml-1m/                        # MovieLens 1M dataset
│   ├── movies.dat
│   ├── ratings.dat
│   └── users.dat
│
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── .env                          # Environment variables (create from .env.example)
```

## 🔌 API Endpoints

### Backend API (Port 3001)

```
GET  /api/health                              # Health check
GET  /api/models                              # List available models
GET  /api/recommendations/:userId             # Get recommendations
     ?model=<ModelName>&n=<count>
GET  /api/movies/:movieId                     # Get movie details
GET  /api/movies/search/:query                # Search movies
GET  /api/users/random?count=<n>              # Get random user IDs
GET  /api/users/next-id                       # Get next sequential user ID
GET  /api/ratings/:userId/:movieId            # Get user's rating for movie
POST /api/ratings                             # Add/update rating
     body: { userId, movieId, rating }
GET  /api/tmdb/movie/:title                   # Proxy to TMDb API
```

### Frontend Routes (Port 3000)

- `/` - Home (redirects to /explore)
- `/explore` - Your personalized recommendations
- `/featured` - Top 50 community-rated movies
- `/browse-others` - Explore recommendations for other users
- `/get-started` - New user onboarding

## 🧠 How It Works

### Cold Start Problem Solution

New users (ID 6041+) who aren't in the training data can still get recommendations! Here's how:

1. **ItemItemCF**: Uses live ratings to find similar movies
2. **MatrixFactorization**: Computes user embedding as weighted average of rated item embeddings
3. **GraphBased**: Temporarily adds user node to graph with edges to rated movies
4. **Popularity**: Always works (doesn't need user data)

### Model Training & Caching

- First run: Trains all models (~3-5 minutes), saves to `data/models/`
- Subsequent runs: Loads from cache (~2 seconds)
- To retrain: Delete `data/models/` or set `USE_MODEL_CACHE=false`

### Data Flow

1. User rates movies → Stored in memory (`dataset.interactions`)
2. Request recommendations → API injects live interactions into models
3. Models generate scores → API enriches with movie metadata
4. Frontend fetches → Displays with TMDb posters and details

## 🎨 Tech Stack

**Backend**
- TypeScript 5.x
- Node.js 22.x
- Express 5.2.1
- Custom ML algorithms (no external ML libraries!)

**Frontend**
- Next.js 16 (Turbopack)
- React 19
- Tailwind CSS v4
- Axios for API calls

**External APIs**
- TMDb API for movie posters and metadata

## 📊 Evaluation Metrics

Models are evaluated using:
- **Precision@10**: Accuracy of top-10 recommendations
- **Recall@10**: Coverage of relevant items
- **NDCG@10**: Normalized Discounted Cumulative Gain
- **MRR**: Mean Reciprocal Rank
- **Coverage**: Percentage of catalog recommended

## 🛠️ Development

### Useful Commands

```bash
# Backend
npm run dev              # Start backend with nodemon (auto-reload)
npm run build            # Compile TypeScript to dist/

# Frontend
npm run dev:next         # Start Next.js dev server
npm run build:next       # Build Next.js for production
npm run start            # Start Next.js production server

# Combined (requires separate terminals)
npm run dev              # Terminal 1
npm run dev:next         # Terminal 2
```

### Environment Variables

```env
# Backend port
PORT=3001

# TMDb API key (get from https://www.themoviedb.org/settings/api)
API_TMDb_KEY=your_key_here

# Dataset path (relative to project root)
MOVIELENS_DATASET_PATH=./ml-1m

# Model caching (optional, defaults to true)
USE_MODEL_CACHE=true
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is available: `lsof -i :3001`
- Ensure MovieLens dataset is in `ml-1m/` directory
- Check `.env` file exists with correct variables

### Frontend shows "Internal Server Error"
- Ensure backend is running on port 3001
- Check browser console for detailed errors
- Clear `.next/` cache: `rm -rf .next`

### Models returning empty recommendations
- For new users: Make sure you rated 10+ movies during onboarding
- Ratings are stored in memory - restarting backend clears them
- Check backend logs for errors

### TMDb posters not loading
- Verify `API_TMDb_KEY` in `.env` is valid
- Check browser network tab for 401 errors
- TMDb has rate limits - wait a moment and retry

## 📝 License

MIT License - feel free to use this project for learning or building upon!

## 🙏 Acknowledgments

- **MovieLens 1M Dataset**: GroupLens Research
- **TMDb API**: The Movie Database for poster images and metadata
- **Inspiration**: Netflix UI/UX design principles

## 🔮 Future Enhancements

- [ ] Persistent database for ratings (PostgreSQL/MongoDB)
- [ ] User accounts with authentication
- [ ] Social features (follow users, share recommendations)
- [ ] Advanced filtering (genre, year, runtime)
- [ ] Watchlist and viewing history
- [ ] Real-time collaborative filtering with WebSockets
- [ ] A/B testing framework for algorithms
- [ ] Production deployment guides (Docker, AWS, Vercel)

---

**Built with ❤️ using TypeScript, Next.js, and custom ML algorithms**
