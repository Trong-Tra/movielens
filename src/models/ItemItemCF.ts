import { Interaction, Recommendation, RecommenderModel } from '../types';

/**
 * Item-Item Collaborative Filtering using cosine similarity
 */
export class ItemItemCF implements RecommenderModel {
  name = 'ItemItemCF';
  
  private itemSimilarities: Map<number, Map<number, number>> = new Map();
  private userItems: Map<number, Map<number, number>> = new Map();
  private allItems: Set<number> = new Set();
  private topKSimilar: number;

  constructor(topKSimilar: number = 50) {
    this.topKSimilar = topKSimilar;
  }

  fit(data: Interaction[]): void {
    console.log('Training Item-Item CF...');
    
    // Build user-item matrix
    const itemUsers: Map<number, Map<number, number>> = new Map();
    
    for (const interaction of data) {
      // User -> Items
      if (!this.userItems.has(interaction.userId)) {
        this.userItems.set(interaction.userId, new Map());
      }
      this.userItems.get(interaction.userId)!.set(interaction.itemId, interaction.weight);
      
      // Item -> Users
      if (!itemUsers.has(interaction.itemId)) {
        itemUsers.set(interaction.itemId, new Map());
      }
      itemUsers.get(interaction.itemId)!.set(interaction.userId, interaction.weight);
      
      this.allItems.add(interaction.itemId);
    }

    // Compute item-item similarities
    const items = Array.from(this.allItems);
    console.log(`Computing similarities for ${items.length} items...`);
    
    // For large datasets, compute similarities in batches
    const batchSize = 100;
    for (let i = 0; i < items.length; i++) {
      const itemI = items[i];
      const usersI = itemUsers.get(itemI);
      if (!usersI) continue;

      const similarities: Array<{ itemId: number; similarity: number }> = [];

      // Only compute with items that have overlapping users for efficiency
      const candidateItems = new Set<number>();
      for (const userId of usersI.keys()) {
        const userInteractions = this.userItems.get(userId);
        if (userInteractions) {
          for (const itemId of userInteractions.keys()) {
            if (itemId !== itemI) {
              candidateItems.add(itemId);
            }
          }
        }
      }

      for (const itemJ of candidateItems) {
        const usersJ = itemUsers.get(itemJ);
        if (!usersJ) continue;

        const similarity = this.cosineSimilarity(usersI, usersJ);
        if (similarity > 0.01) { // Threshold to reduce noise
          similarities.push({ itemId: itemJ, similarity });
        }
      }

      // Keep only top-K similar items
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topK = similarities.slice(0, this.topKSimilar);

      if (topK.length > 0) {
        const simMap = new Map<number, number>();
        for (const { itemId, similarity } of topK) {
          simMap.set(itemId, similarity);
        }
        this.itemSimilarities.set(itemI, simMap);
      }

      if ((i + 1) % batchSize === 0) {
        console.log(`  Processed ${i + 1}/${items.length} items`);
      }
    }

    console.log('Item-Item CF training complete');
  }

  predict(userId: number, itemId: number): number {
    const userRatings = this.userItems.get(userId);
    if (!userRatings) return 0;

    const similarItems = this.itemSimilarities.get(itemId);
    if (!similarItems) return 0;

    let numerator = 0;
    let denominator = 0;

    for (const [simItemId, similarity] of similarItems) {
      const rating = userRatings.get(simItemId);
      if (rating !== undefined) {
        numerator += similarity * rating;
        denominator += similarity;
      }
    }

    return denominator > 0 ? numerator / denominator : 0;
  }

  recommendTopN(userId: number, n: number, excludeItems: Set<number> = new Set()): Recommendation[] {
    const userRatings = this.userItems.get(userId);
    if (!userRatings) return [];

    const scores = new Map<number, number>();

    // For each item the user has interacted with
    for (const [ratedItemId, rating] of userRatings) {
      const similarItems = this.itemSimilarities.get(ratedItemId);
      if (!similarItems) continue;

      // Aggregate scores from similar items
      for (const [candidateItemId, similarity] of similarItems) {
        if (excludeItems.has(candidateItemId)) continue;
        if (userRatings.has(candidateItemId)) continue;

        const currentScore = scores.get(candidateItemId) || 0;
        scores.set(candidateItemId, currentScore + similarity * rating);
      }
    }

    // Sort by score
    const recommendations = Array.from(scores.entries())
      .map(([itemId, score]) => ({
        itemId,
        score,
        explanation: 'Similar to items you liked'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n);

    return recommendations;
  }

  private cosineSimilarity(
    vectorA: Map<number, number>,
    vectorB: Map<number, number>
  ): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    // Common users
    for (const [userId, ratingA] of vectorA) {
      const ratingB = vectorB.get(userId);
      if (ratingB !== undefined) {
        dotProduct += ratingA * ratingB;
      }
      normA += ratingA * ratingA;
    }

    for (const [userId, ratingB] of vectorB) {
      normB += ratingB * ratingB;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  serialize(): any {
    const similaritiesArray = Array.from(this.itemSimilarities.entries()).map(([itemId, simMap]) => [
      itemId,
      Array.from(simMap.entries())
    ]);
    
    const userItemsArray = Array.from(this.userItems.entries()).map(([userId, itemMap]) => [
      userId,
      Array.from(itemMap.entries())
    ]);

    return {
      itemSimilarities: similaritiesArray,
      userItems: userItemsArray,
      allItems: Array.from(this.allItems),
      topKSimilar: this.topKSimilar
    };
  }

  deserialize(data: any): void {
    this.itemSimilarities = new Map(
      data.itemSimilarities.map(([itemId, simArray]: [number, [number, number][]]) => [
        itemId,
        new Map(simArray)
      ])
    );
    
    this.userItems = new Map(
      data.userItems.map(([userId, itemArray]: [number, [number, number][]]) => [
        userId,
        new Map(itemArray)
      ])
    );
    
    this.allItems = new Set(data.allItems);
    this.topKSimilar = data.topKSimilar;
  }
}
