# Technical Documentation: Movie Recommendation System

## Table of Contents
1. [System Overview](#system-overview)
2. [Data Architecture](#data-architecture)
3. [Recommendation Algorithms](#recommendation-algorithms)
4. [Evaluation Metrics](#evaluation-metrics)
5. [Technical Stack](#technical-stack)
6. [Implementation Details](#implementation-details)

---

## System Overview

This is a complete movie recommendation system built on the collaborative filtering paradigm. The system operates purely on user-item interaction data (ratings) without requiring any content information about the movies themselves.

### Core Principle
**Collaborative Filtering**: Users who agreed in the past tend to agree in the future. If User A and User B both liked movies X, Y, and Z, and User A also liked movie W, then User B will probably like movie W too.

---

## Data Architecture

### Input Data Structure

#### MovieLens 1M Dataset
- **1,000,209 ratings** from 6,040 users on 3,883 movies
- **Rating scale**: 1-5 stars (integers only)
- **Timestamp**: UNIX timestamp for temporal analysis
- **Format**: Tab-separated values (`.dat` files)

#### Data Files

**ratings.dat**
```
UserID::MovieID::Rating::Timestamp
1::1193::5::978300760
```

**movies.dat**
```
MovieID::Title::Genres
1::Toy Story (1995)::Animation|Children's|Comedy
```

#### Internal Data Representation

```typescript
interface Interaction {
  userId: number;      // User identifier
  itemId: number;      // Movie identifier
  weight: number;      // Rating value (1-5)
  timestamp?: number;  // When rating was given
}
```

### Train/Test Splitting

**Temporal Split (80/20)**
```
For each user:
  Sort interactions by timestamp
  Take first 80% → training set
  Take last 20% → test set
```

**Why temporal?**
- Mimics real-world scenario where we predict future preferences
- Prevents data leakage (training on future, testing on past)
- More realistic evaluation

---

## Recommendation Algorithms

### 1. Popularity-Based Model

**Concept**: Recommend items that are generally popular across all users.

**Algorithm**:
```
For each item i:
  popularity_score(i) = count(ratings) × average(ratings)
  
Recommend: Top-N items with highest popularity_score
```

**Mathematical Formula**:
```
Score(i) = |U_i| × (Σ r_ui / |U_i|)

where:
  U_i = set of users who rated item i
  r_ui = rating user u gave to item i
```

**Pros**:
- Fast (O(n) training, O(1) inference)
- No cold-start problem for new users
- Good baseline performance

**Cons**:
- No personalization
- Popular items dominate (filter bubble)
- Low diversity

---

### 2. Matrix Factorization (ALS)

**Concept**: Decompose the user-item rating matrix into two lower-dimensional matrices representing latent factors.

**Mathematical Foundation**:

The rating matrix R (users × items) is approximated as:
```
R ≈ U × V^T

where:
  R ∈ ℝ^(m×n)    - rating matrix (m users, n items)
  U ∈ ℝ^(m×k)    - user latent factors
  V ∈ ℝ^(n×k)    - item latent factors
  k              - number of latent dimensions
```

**Predicted Rating**:
```
r̂_ui = u_u · v_i = Σ(j=1 to k) u_uj × v_ij

where:
  u_u = latent vector for user u
  v_i = latent vector for item i
```

**Optimization (Alternating Least Squares)**:

Minimize the following objective:
```
L = Σ(r_ui - u_u · v_i)² + λ(||u_u||² + ||v_i||²)

where:
  λ = regularization parameter
  ||·|| = L2 norm
```

**Training Algorithm**:
```
Initialize U, V randomly
For iteration = 1 to max_iterations:
  # Fix V, solve for U
  For each user u:
    u_u = (V^T V + λI)^(-1) V^T r_u
    
  # Fix U, solve for V
  For each item i:
    v_i = (U^T U + λI)^(-1) U^T r_i
```

**Hyperparameters**:
- `k = 30`: Number of latent factors (dimensions)
- `iterations = 5`: Number of ALS iterations
- `λ = 0.1`: Regularization strength

**Interpretation of Latent Factors**:
Each dimension in the latent space represents an implicit feature:
- Factor 1 might represent "action vs. drama"
- Factor 2 might represent "old vs. new"
- Factor 3 might represent "serious vs. comedy"

These are learned automatically from data!

**Ranking Process**:
```
For user u, to recommend top-N items:
  1. Compute score for all items: score(i) = u_u · v_i
  2. Exclude items user has already rated
  3. Sort by score (descending)
  4. Return top N items
```

**Pros**:
- Captures latent patterns
- Good generalization
- Scalable

**Cons**:
- Cold start problem
- Requires sufficient data per user/item

---

### 3. Item-Item Collaborative Filtering

**Concept**: Recommend items similar to items the user has liked in the past.

**Similarity Metric (Cosine Similarity)**:

```
sim(i, j) = cos(θ) = (r_i · r_j) / (||r_i|| × ||r_j||)

where:
  r_i = vector of ratings for item i across all users
  r_j = vector of ratings for item j across all users
```

**Expanded Formula**:
```
sim(i, j) = Σ(u∈U) r_ui × r_uj / (√(Σ r_ui²) × √(Σ r_uj²))

where:
  U = set of users who rated both items
```

**Prediction Formula**:
```
r̂_ui = Σ(j∈N(i)) sim(i,j) × r_uj / Σ(j∈N(i)) |sim(i,j)|

where:
  N(i) = set of top-K most similar items to i
```

**Algorithm**:
```
Training:
  1. For each item i:
    2. For each item j ≠ i:
      3. Compute similarity sim(i,j)
    4. Keep only top-K similar items
    
Prediction:
  1. Get items user has rated: I_u
  2. For each candidate item i not in I_u:
    3. score(i) = Σ(j∈I_u) sim(i,j) × r_uj
  4. Rank by score
```

**Optimization - Candidate Selection**:
Instead of computing O(n²) similarities, we only compute similarities between items with overlapping users:
```
For item i:
  candidates = {j | ∃u: r_ui > 0 AND r_uj > 0, j ≠ i}
  # Only items co-rated by at least one user
```

**Hyperparameters**:
- `K = 30`: Number of similar items to consider
- `similarity_threshold = 0.01`: Minimum similarity to store

**Pros**:
- Interpretable ("because you liked X")
- Stable over time
- Works well with implicit feedback

**Cons**:
- Expensive to compute (O(n²) item pairs)
- Popularity bias
- Cold start for new items

---

### 4. Graph-Based Recommendation (Random Walk with Restart)

**Concept**: Model user-item interactions as a bipartite graph and use random walk to measure proximity.

**Graph Structure**:
```
Bipartite Graph G = (U ∪ I, E)

where:
  U = set of user nodes
  I = set of item nodes
  E = edges (u,i) with weight r_ui
```

**Random Walk with Restart (RWR)**:

At each step, the walker:
1. With probability α: restart (go back to start user)
2. With probability (1-α): move to a random neighbor

**Mathematical Formulation**:

Stationary distribution π satisfies:
```
π = αe_s + (1-α)Pπ

where:
  e_s = unit vector with 1 at source node
  P = transition probability matrix
  α = restart probability (teleport probability)
```

**Transition Probability**:
```
P(v → w) = w(v,w) / Σ(u∈N(v)) w(v,u)

where:
  w(v,w) = weight of edge from v to w
  N(v) = neighbors of node v
```

**Implementation (Monte Carlo Simulation)**:
```
For walk = 1 to num_walks:
  current = user_u
  For step = 1 to walk_length:
    visit_count[current] += 1
    
    if random() < restart_prob:
      current = user_u  # Restart
    else:
      # Move to random neighbor (weighted)
      current = sample_neighbor(current)

Score(item_i) = visit_count[item_i] / total_visits
```

**Hyperparameters**:
- `α = 0.15`: Restart probability (PageRank default)
- `num_walks = 50`: Number of random walks
- `walk_length = 8`: Steps per walk

**Intuition**:
- Items frequently visited during random walks from user u are "close" to u
- Captures multi-hop relationships
- Similar to Personalized PageRank

**Pros**:
- Captures graph structure
- Discovers non-obvious patterns
- Good diversity

**Cons**:
- Computationally expensive
- Stochastic (requires multiple walks)
- Less interpretable

---

## Evaluation Metrics

### Why These Metrics?

We're solving a **ranking problem**, not a rating prediction problem. The goal is to recommend a **Top-N list**, not to predict exact ratings.

### 1. Precision@K

**Definition**: What fraction of recommended items are relevant?

```
Precision@K = |{relevant items} ∩ {top-K recommended}| / K
```

**Example**:
```
Recommended: [A, B, C, D, E, F, G, H, I, J]  (K=10)
Relevant:    [B, D, F, M, N]
Hits:        [B, D, F]

Precision@10 = 3/10 = 0.30 (30%)
```

**Interpretation**: High precision = few false positives

---

### 2. Recall@K

**Definition**: What fraction of relevant items did we recommend?

```
Recall@K = |{relevant items} ∩ {top-K recommended}| / |{relevant items}|
```

**Using same example**:
```
Recall@10 = 3/5 = 0.60 (60%)
```

**Interpretation**: High recall = few false negatives

---

### 3. NDCG@K (Normalized Discounted Cumulative Gain)

**Purpose**: Precision/Recall treat all positions equally. NDCG rewards relevant items at the top.

**DCG (Discounted Cumulative Gain)**:
```
DCG@K = Σ(i=1 to K) rel_i / log₂(i+1)

where:
  rel_i = relevance of item at position i (1 if relevant, 0 otherwise)
```

**IDCG (Ideal DCG)**:
Best possible DCG (all relevant items at top)
```
IDCG@K = Σ(i=1 to min(K, |relevant|)) 1 / log₂(i+1)
```

**NDCG (Normalized)**:
```
NDCG@K = DCG@K / IDCG@K
```

**Example**:
```
Recommended: [A, B, C, D, E]  (K=5)
Relevant:    [B, D]
Relevance:   [0, 1, 0, 1, 0]

DCG = 0/log₂(2) + 1/log₂(3) + 0/log₂(4) + 1/log₂(5) + 0/log₂(6)
    = 0 + 0.631 + 0 + 0.431 + 0
    = 1.062

IDCG = 1/log₂(2) + 1/log₂(3)  # Best case: both at top
     = 1.0 + 0.631
     = 1.631

NDCG = 1.062 / 1.631 = 0.651
```

**Interpretation**: 
- NDCG = 1.0: Perfect ranking
- NDCG = 0.0: No relevant items in top-K

---

### 4. MRR (Mean Reciprocal Rank)

**Definition**: What's the average position of the first relevant item?

```
RR = 1 / rank_of_first_relevant_item

MRR = average(RR) across all users
```

**Example**:
```
User 1: First relevant at position 2 → RR = 1/2 = 0.50
User 2: First relevant at position 1 → RR = 1/1 = 1.00
User 3: First relevant at position 5 → RR = 1/5 = 0.20

MRR = (0.50 + 1.00 + 0.20) / 3 = 0.567
```

**Interpretation**: Higher MRR = relevant items appear earlier

---

### 5. Coverage

**Definition**: What fraction of the catalog is ever recommended?

```
Coverage = |{items recommended to any user}| / |{all items}|
```

**Example**:
```
Total items: 1000
Unique items in all recommendations: 250

Coverage = 250/1000 = 0.25 (25%)
```

**Interpretation**: 
- High coverage = diverse recommendations
- Low coverage = filter bubble (only popular items)

---

### Determining Top-N Rankings

**Process for User u**:

1. **Get Candidate Items**
   ```
   candidates = all_items - items_already_rated_by_u
   ```

2. **Score Each Candidate**
   ```
   For each item i in candidates:
     score(i) = model.predict(u, i)
   ```

3. **Rank by Score**
   ```
   ranked_items = sort(candidates, key=score, descending=True)
   ```

4. **Return Top-N**
   ```
   recommendations = ranked_items[0:N]
   ```

**Example with Matrix Factorization**:
```
User vector: u_1 = [0.5, -0.3, 0.8, ...]  (30 dimensions)

Item 1 vector: v_1 = [0.6, -0.2, 0.7, ...]
Item 2 vector: v_2 = [0.1, 0.4, -0.3, ...]
Item 3 vector: v_3 = [0.7, -0.4, 0.9, ...]

Scores:
  score(1) = u_1 · v_1 = 0.5×0.6 + (-0.3)×(-0.2) + 0.8×0.7 + ... = 4.2
  score(2) = u_1 · v_2 = 0.5×0.1 + (-0.3)×0.4 + 0.8×(-0.3) + ... = -0.3
  score(3) = u_1 · v_3 = 0.5×0.7 + (-0.3)×(-0.4) + 0.8×0.9 + ... = 5.1

Ranking: [Item 3, Item 1, Item 2]
Top-3: [3, 1, 2]
```

---

## Technical Stack

### Backend
- **Language**: TypeScript 5.9
- **Runtime**: Node.js (ES2020)
- **Framework**: Express 5.2
- **Type System**: Strict TypeScript

### Data Processing
- **CSV Parsing**: csv-parse 6.1
- **Data Format**: Custom parsers for MovieLens .dat format

### Development Tools
- **Build Tool**: TypeScript Compiler (tsc)
- **Dev Server**: nodemon + ts-node
- **Environment**: dotenv for configuration

### Architecture Pattern
```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Web UI + REST API Endpoints)        │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│          Serving Layer                  │
│   (Express Server, Route Handlers)      │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Model Layer                     │
│  (Recommendation Algorithms Interface)  │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      Evaluation Layer                   │
│     (Metrics Computation)               │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│          Data Layer                     │
│  (Loaders, Splitters, Preprocessing)    │
└─────────────────────────────────────────┘
```

---

## Implementation Details

### Model Interface

All models implement a common interface:
```typescript
interface RecommenderModel {
  name: string;
  
  // Train the model
  fit(data: Interaction[]): void;
  
  // Predict score for user-item pair
  predict(userId: number, itemId: number): number;
  
  // Generate top-N recommendations
  recommendTopN(
    userId: number, 
    n: number, 
    excludeItems?: Set<number>
  ): Recommendation[];
}
```

### Data Flow

**Training Phase**:
```
Load Dataset
    ↓
Split Train/Test (80/20 temporal)
    ↓
For each model:
    model.fit(train_data)
    ↓
    predictions = model.recommendTopN(user, K)
    ↓
    metrics = evaluate(predictions, test_data)
```

**Serving Phase**:
```
HTTP Request: GET /api/recommendations/42?model=MatrixFactorization&n=10
    ↓
API Layer validates parameters
    ↓
Model Layer: model.recommendTopN(userId=42, n=10, excludeItems)
    ↓
Data Enrichment: add movie titles, genres
    ↓
JSON Response with recommendations
```

### Performance Characteristics

| Model | Training Time | Inference Time | Memory |
|-------|--------------|----------------|---------|
| Popularity | O(n) | O(1) | O(m) |
| Matrix Factorization | O(k·n·i) | O(k·m) | O(k(n+m)) |
| Item-Item CF | O(n²) | O(n) | O(n²) |
| Graph-Based | O(n) | O(w·l) | O(n+m) |

Where:
- n = number of items
- m = number of users
- k = latent dimensions
- i = iterations
- w = number of walks
- l = walk length

### Cold Start Handling

**New User** (no ratings):
- Popularity: ✅ Works (non-personalized)
- Matrix Factorization: ❌ Cannot generate vector
- Item-Item CF: ❌ No rated items to find similar ones
- Graph-Based: ❌ No starting node

**New Item** (no ratings):
- Popularity: ❌ No statistics yet
- Matrix Factorization: ❌ No item vector
- Item-Item CF: ❌ No similarity scores
- Graph-Based: ✅ Can be reached through graph

### Scalability Considerations

**Current Implementation** (Development):
- In-memory storage
- Single-threaded computation
- Suitable for datasets up to ~10M interactions

**Production Scalability Path**:
1. **Data Layer**: PostgreSQL/MongoDB for persistence
2. **Caching**: Redis for computed similarities/factors
3. **Batch Processing**: Pre-compute recommendations offline
4. **Distributed Training**: Spark MLlib for large-scale MF
5. **Approximate Search**: FAISS/Annoy for nearest neighbor search

---

## Model Comparison

### When to Use Each Model?

**Popularity**:
- ✅ New users (cold start)
- ✅ Quick baseline
- ✅ Non-personalized sections (trending, featured)
- ❌ Poor personalization

**Matrix Factorization**:
- ✅ Large, dense datasets
- ✅ Capturing latent patterns
- ✅ Balanced accuracy/speed
- ❌ Cold start problems
- ❌ Requires tuning

**Item-Item CF**:
- ✅ Explainable recommendations
- ✅ Stable predictions
- ✅ Works well with implicit feedback
- ❌ Slow training on large catalogs
- ❌ Popularity bias

**Graph-Based**:
- ✅ Sparse datasets
- ✅ Discovering non-obvious patterns
- ✅ High diversity
- ❌ Computationally expensive
- ❌ Less interpretable
- ❌ Stochastic results

### Real-World Hybrid Approach

Production systems typically combine multiple models:
```
final_score = α × popularity_score
            + β × mf_score
            + γ × cf_score
            + δ × graph_score
            + ε × diversity_bonus
            - ζ × popularity_penalty
```

---

## API Response Examples

### Get Recommendations
```json
GET /api/recommendations/42?model=MatrixFactorization&n=5

Response:
{
  "userId": 42,
  "model": "MatrixFactorization",
  "recommendations": [
    {
      "itemId": 2571,
      "score": 4.523,
      "explanation": "Matrix factorization",
      "title": "Matrix, The (1999)",
      "genres": ["Action", "Sci-Fi", "Thriller"]
    },
    ...
  ]
}
```

### Search Movies
```json
GET /api/movies/search/star%20wars?limit=3

Response:
{
  "results": [
    {
      "id": 260,
      "title": "Star Wars: Episode IV - A New Hope (1977)",
      "genres": ["Action", "Adventure", "Sci-Fi"]
    },
    {
      "id": 1196,
      "title": "Star Wars: Episode V - The Empire Strikes Back (1980)",
      "genres": ["Action", "Adventure", "Sci-Fi"]
    },
    {
      "id": 1210,
      "title": "Star Wars: Episode VI - Return of the Jedi (1983)",
      "genres": ["Action", "Adventure", "Sci-Fi"]
    }
  ]
}
```

---

## Future Enhancements

### Algorithm Improvements
1. **Deep Learning**: Neural Collaborative Filtering (NCF)
2. **Context-Aware**: Time-aware, session-based recommendations
3. **Multi-Armed Bandit**: Exploration vs exploitation
4. **Ensemble Methods**: Blending multiple models

### System Improvements
1. **A/B Testing Framework**: Compare models in production
2. **Real-time Updates**: Incremental model updates
3. **Personalized Re-ranking**: Diversity, novelty, serendipity
4. **Explanation Generation**: Natural language explanations

### Data Enhancements
1. **Implicit Feedback**: Clicks, views, dwell time
2. **Side Information**: Movie metadata, user demographics
3. **Multi-Modal**: Images, text, audio features
4. **Social Network**: Friend recommendations

---

## References

### Academic Papers
1. Koren, Y., Bell, R., & Volinsky, C. (2009). "Matrix Factorization Techniques for Recommender Systems"
2. Sarwar, B., et al. (2001). "Item-based collaborative filtering recommendation algorithms"
3. Tong, H., et al. (2006). "Fast Random Walk with Restart"
4. Harper, F. M., & Konstan, J. A. (2015). "The MovieLens Datasets: History and Context"

### Books
- Aggarwal, C. C. (2016). "Recommender Systems: The Textbook"
- Ricci, F., et al. (2015). "Recommender Systems Handbook"

---

## Glossary

- **Collaborative Filtering**: Recommendation based on user-user or item-item similarities
- **Latent Factor**: Hidden feature learned from data
- **Cold Start**: Problem of recommending to new users/items
- **Sparsity**: Most users rate only a tiny fraction of items
- **Implicit Feedback**: Indirect signals (views, clicks) vs explicit ratings
- **Top-N Recommendation**: Ranking problem, not rating prediction
- **Exploration**: Recommending diverse items vs. Exploitation: Recommending safe bets

---

**Document Version**: 1.0  
**Last Updated**: December 13, 2025  
**System Version**: Complete with 4 algorithms, full evaluation suite, and REST API
