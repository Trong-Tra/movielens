import { Interaction, Recommendation, RecommenderModel } from '../types';

/**
 * Baseline: Global average rating
 */
export class GlobalAverageModel implements RecommenderModel {
  name = 'GlobalAverage';
  private globalAverage: number = 0;

  fit(data: Interaction[]): void {
    const sum = data.reduce((acc, int) => acc + int.weight, 0);
    this.globalAverage = data.length > 0 ? sum / data.length : 0;
  }

  predict(userId: number, itemId: number): number {
    return this.globalAverage;
  }

  recommendTopN(userId: number, n: number, excludeItems?: Set<number>): Recommendation[] {
    // Global average doesn't personalize, so we can't really recommend
    return [];
  }
}

/**
 * User-based average rating
 */
export class UserAverageModel implements RecommenderModel {
  name = 'UserAverage';
  private userAverages: Map<number, number> = new Map();
  private globalAverage: number = 0;

  fit(data: Interaction[]): void {
    const userSums = new Map<number, number>();
    const userCounts = new Map<number, number>();

    for (const interaction of data) {
      const sum = userSums.get(interaction.userId) || 0;
      const count = userCounts.get(interaction.userId) || 0;
      
      userSums.set(interaction.userId, sum + interaction.weight);
      userCounts.set(interaction.userId, count + 1);
    }

    // Calculate averages
    for (const [userId, sum] of userSums) {
      const count = userCounts.get(userId)!;
      this.userAverages.set(userId, sum / count);
    }

    // Global average as fallback
    const totalSum = Array.from(userSums.values()).reduce((a, b) => a + b, 0);
    const totalCount = Array.from(userCounts.values()).reduce((a, b) => a + b, 0);
    this.globalAverage = totalCount > 0 ? totalSum / totalCount : 0;
  }

  predict(userId: number, itemId: number): number {
    return this.userAverages.get(userId) || this.globalAverage;
  }

  recommendTopN(userId: number, n: number, excludeItems?: Set<number>): Recommendation[] {
    // User average doesn't distinguish between items
    return [];
  }
}

/**
 * Item popularity model (recommend most popular items)
 */
export class PopularityModel implements RecommenderModel {
  name = 'Popularity';
  private itemScores: Map<number, number> = new Map();
  private sortedItems: number[] = [];

  fit(data: Interaction[]): void {
    const itemCounts = new Map<number, number>();
    const itemWeights = new Map<number, number>();

    for (const interaction of data) {
      const count = itemCounts.get(interaction.itemId) || 0;
      const weight = itemWeights.get(interaction.itemId) || 0;
      
      itemCounts.set(interaction.itemId, count + 1);
      itemWeights.set(interaction.itemId, weight + interaction.weight);
    }

    // Score = count * average rating
    for (const [itemId, count] of itemCounts) {
      const avgWeight = itemWeights.get(itemId)! / count;
      this.itemScores.set(itemId, count * avgWeight);
    }

    // Sort items by score
    this.sortedItems = Array.from(this.itemScores.keys())
      .sort((a, b) => this.itemScores.get(b)! - this.itemScores.get(a)!);
  }

  predict(userId: number, itemId: number): number {
    return this.itemScores.get(itemId) || 0;
  }

  recommendTopN(userId: number, n: number, excludeItems: Set<number> = new Set()): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    for (const itemId of this.sortedItems) {
      if (excludeItems.has(itemId)) continue;
      
      recommendations.push({
        itemId,
        score: this.itemScores.get(itemId)!,
        explanation: 'Popular item'
      });

      if (recommendations.length >= n) break;
    }

    return recommendations;
  }

  serialize(): any {
    return {
      itemScores: Array.from(this.itemScores.entries()),
      sortedItems: this.sortedItems
    };
  }

  deserialize(data: any): void {
    this.itemScores = new Map(data.itemScores);
    this.sortedItems = data.sortedItems;
  }
}
