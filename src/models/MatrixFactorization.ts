import { Interaction, Recommendation, RecommenderModel } from '../types';

/**
 * Matrix Factorization using Alternating Least Squares (ALS)
 * Simpler and more stable than SGD for implicit feedback
 */
export class MatrixFactorizationModel implements RecommenderModel {
  name = 'MatrixFactorization';
  
  private userFactors: Map<number, number[]> = new Map();
  private itemFactors: Map<number, number[]> = new Map();
  private userIds: number[] = [];
  private itemIds: number[] = [];
  private numFactors: number;
  private numIterations: number;
  private regularization: number;
  private liveInteractions: Interaction[] = [];

  constructor(
    numFactors: number = 30,
    numIterations: number = 5,
    regularization: number = 0.1
  ) {
    this.numFactors = numFactors;
    this.numIterations = numIterations;
    this.regularization = regularization;
  }

  /**
   * Set live interactions for handling new users not in training data
   */
  setLiveInteractions(interactions: Interaction[]): void {
    this.liveInteractions = interactions;
  }

  fit(data: Interaction[]): void {
    console.log(`Training Matrix Factorization with ${this.numFactors} factors...`);
    
    // Get unique users and items
    const userSet = new Set<number>();
    const itemSet = new Set<number>();
    
    for (const interaction of data) {
      userSet.add(interaction.userId);
      itemSet.add(interaction.itemId);
    }

    this.userIds = Array.from(userSet);
    this.itemIds = Array.from(itemSet);

    // Create index mappings
    const userIndex = new Map(this.userIds.map((id, idx) => [id, idx]));
    const itemIndex = new Map(this.itemIds.map((id, idx) => [id, idx]));

    // Build interaction matrix
    const matrix: number[][] = Array(this.userIds.length)
      .fill(0)
      .map(() => Array(this.itemIds.length).fill(0));

    for (const interaction of data) {
      const uIdx = userIndex.get(interaction.userId)!;
      const iIdx = itemIndex.get(interaction.itemId)!;
      matrix[uIdx][iIdx] = interaction.weight;
    }

    // Initialize factors randomly
    const userMat = this.randomMatrix(this.userIds.length, this.numFactors);
    const itemMat = this.randomMatrix(this.itemIds.length, this.numFactors);

    // ALS iterations
    for (let iter = 0; iter < this.numIterations; iter++) {
      // Update user factors
      for (let u = 0; u < this.userIds.length; u++) {
        userMat[u] = this.solveForFactor(matrix[u], itemMat, this.regularization);
      }

      // Update item factors
      const matrixT = this.transpose(matrix);
      for (let i = 0; i < this.itemIds.length; i++) {
        itemMat[i] = this.solveForFactor(matrixT[i], userMat, this.regularization);
      }

      const error = this.computeError(matrix, userMat, itemMat);
      console.log(`  Iteration ${iter + 1}/${this.numIterations}, RMSE: ${error.toFixed(4)}`);
    }

    // Store factors
    for (let i = 0; i < this.userIds.length; i++) {
      this.userFactors.set(this.userIds[i], userMat[i]);
    }
    for (let i = 0; i < this.itemIds.length; i++) {
      this.itemFactors.set(this.itemIds[i], itemMat[i]);
    }

    console.log('Matrix Factorization training complete');
  }

  predict(userId: number, itemId: number): number {
    const userFactor = this.userFactors.get(userId);
    const itemFactor = this.itemFactors.get(itemId);

    if (!userFactor || !itemFactor) return 0;

    return this.dotProduct(userFactor, itemFactor);
  }

  recommendTopN(userId: number, n: number, excludeItems: Set<number> = new Set()): Recommendation[] {
    let userFactor = this.userFactors.get(userId);
    
    // If user not in training data, compute factor from their ratings (new user)
    if (!userFactor && this.liveInteractions.length > 0) {
      const userRatings = new Map<number, number>();
      for (const interaction of this.liveInteractions) {
        if (interaction.userId === userId) {
          userRatings.set(interaction.itemId, interaction.weight);
        }
      }
      
      if (userRatings.size > 0) {
        // Compute user factor as weighted average of rated item factors
        userFactor = Array(this.numFactors).fill(0);
        let totalWeight = 0;
        
        for (const [itemId, rating] of userRatings) {
          const itemFactor = this.itemFactors.get(itemId);
          if (itemFactor) {
            for (let i = 0; i < this.numFactors; i++) {
              userFactor[i] += itemFactor[i] * rating;
            }
            totalWeight += rating;
          }
        }
        
        if (totalWeight > 0) {
          for (let i = 0; i < this.numFactors; i++) {
            userFactor[i] /= totalWeight;
          }
        }
      }
    }
    
    if (!userFactor) return [];

    const scores: Array<{ itemId: number; score: number }> = [];

    for (const itemId of this.itemIds) {
      if (excludeItems.has(itemId)) continue;

      // Compute score directly using the userFactor (handles both existing and new users)
      const itemFactor = this.itemFactors.get(itemId);
      if (!itemFactor) continue;
      
      const score = this.dotProduct(userFactor, itemFactor);
      scores.push({ itemId, score });
    }

    // Normalize scores to 1-5 scale BEFORE sorting
    if (scores.length > 0) {
      const allScores = scores.map(s => s.score);
      const maxScore = Math.max(...allScores);
      const minScore = Math.min(...allScores);
      const scoreRange = maxScore - minScore;
      
      scores.forEach(item => {
        // Normalize to 1-5 scale
        item.score = scoreRange > 0
          ? ((item.score - minScore) / scoreRange) * 4 + 1
          : 3.0;  // Default to middle if no range
      });
    }

    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, n).map(s => ({
      itemId: s.itemId,
      score: s.score,
      explanation: 'Matrix factorization'
    }));
  }

  private randomMatrix(rows: number, cols: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push((Math.random() - 0.5) * 0.01);
      }
      matrix.push(row);
    }
    return matrix;
  }

  private solveForFactor(
    ratings: number[],
    factors: number[][],
    regularization: number
  ): number[] {
    // Simplified ALS update using normal equations
    const k = factors[0].length;
    const A: number[][] = Array(k).fill(0).map(() => Array(k).fill(0));
    const b: number[] = Array(k).fill(0);

    for (let i = 0; i < ratings.length; i++) {
      if (ratings[i] === 0) continue;

      const factor = factors[i];
      for (let p = 0; p < k; p++) {
        for (let q = 0; q < k; q++) {
          A[p][q] += factor[p] * factor[q];
        }
        b[p] += ratings[i] * factor[p];
      }
    }

    // Add regularization
    for (let p = 0; p < k; p++) {
      A[p][p] += regularization;
    }

    // Solve using Gauss-Seidel (simplified)
    const result = Array(k).fill(0);
    for (let iter = 0; iter < 5; iter++) {
      for (let i = 0; i < k; i++) {
        let sum = b[i];
        for (let j = 0; j < k; j++) {
          if (i !== j) sum -= A[i][j] * result[j];
        }
        result[i] = sum / A[i][i];
      }
    }

    return result;
  }

  private transpose(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0]?.length || 0;
    const result: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = matrix[i][j];
      }
    }
    
    return result;
  }

  private dotProduct(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  private computeError(
    matrix: number[][],
    userFactors: number[][],
    itemFactors: number[][]
  ): number {
    let error = 0;
    let count = 0;

    for (let u = 0; u < matrix.length; u++) {
      for (let i = 0; i < matrix[u].length; i++) {
        if (matrix[u][i] === 0) continue;
        
        const predicted = this.dotProduct(userFactors[u], itemFactors[i]);
        error += Math.pow(matrix[u][i] - predicted, 2);
        count++;
      }
    }

    return count > 0 ? Math.sqrt(error / count) : 0;
  }

  serialize(): any {
    return {
      userFactors: Array.from(this.userFactors.entries()),
      itemFactors: Array.from(this.itemFactors.entries()),
      userIds: this.userIds,
      itemIds: this.itemIds,
      numFactors: this.numFactors,
      numIterations: this.numIterations,
      regularization: this.regularization
    };
  }

  deserialize(data: any): void {
    this.userFactors = new Map(data.userFactors);
    this.itemFactors = new Map(data.itemFactors);
    this.userIds = data.userIds;
    this.itemIds = data.itemIds;
    this.numFactors = data.numFactors;
    this.numIterations = data.numIterations;
    this.regularization = data.regularization;
  }
}
