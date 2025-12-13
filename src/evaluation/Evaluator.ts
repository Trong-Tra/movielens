import { Interaction, Recommendation, EvaluationMetrics } from '../types';

/**
 * Evaluation metrics for recommendation systems
 */
export class Evaluator {
  /**
   * Calculate Precision@K
   */
  static precisionAtK(
    recommendations: Recommendation[],
    relevantItems: Set<number>,
    k: number
  ): number {
    const topK = recommendations.slice(0, k);
    const hits = topK.filter(rec => relevantItems.has(rec.itemId)).length;
    return k > 0 ? hits / k : 0;
  }

  /**
   * Calculate Recall@K
   */
  static recallAtK(
    recommendations: Recommendation[],
    relevantItems: Set<number>,
    k: number
  ): number {
    if (relevantItems.size === 0) return 0;
    
    const topK = recommendations.slice(0, k);
    const hits = topK.filter(rec => relevantItems.has(rec.itemId)).length;
    return hits / relevantItems.size;
  }

  /**
   * Calculate Normalized Discounted Cumulative Gain at K
   */
  static ndcgAtK(
    recommendations: Recommendation[],
    relevantItems: Set<number>,
    k: number
  ): number {
    const topK = recommendations.slice(0, k);
    
    // DCG
    let dcg = 0;
    for (let i = 0; i < topK.length; i++) {
      if (relevantItems.has(topK[i].itemId)) {
        dcg += 1 / Math.log2(i + 2); // i+2 because positions start at 1
      }
    }

    // IDCG (ideal DCG)
    let idcg = 0;
    const numRelevant = Math.min(k, relevantItems.size);
    for (let i = 0; i < numRelevant; i++) {
      idcg += 1 / Math.log2(i + 2);
    }

    return idcg > 0 ? dcg / idcg : 0;
  }

  /**
   * Calculate Mean Reciprocal Rank
   */
  static meanReciprocalRank(
    recommendations: Recommendation[],
    relevantItems: Set<number>
  ): number {
    for (let i = 0; i < recommendations.length; i++) {
      if (relevantItems.has(recommendations[i].itemId)) {
        return 1 / (i + 1);
      }
    }
    return 0;
  }

  /**
   * Calculate catalog coverage
   */
  static catalogCoverage(
    allRecommendations: Recommendation[][],
    totalItems: number
  ): number {
    const recommendedItems = new Set<number>();
    for (const recs of allRecommendations) {
      for (const rec of recs) {
        recommendedItems.add(rec.itemId);
      }
    }
    return recommendedItems.size / totalItems;
  }

  /**
   * Evaluate a model on test data
   */
  static evaluateModel(
    predictions: Map<number, Recommendation[]>,
    testData: Interaction[],
    k: number,
    totalItems: number
  ): EvaluationMetrics {
    // Group test interactions by user
    const userTestItems = new Map<number, Set<number>>();
    for (const interaction of testData) {
      if (!userTestItems.has(interaction.userId)) {
        userTestItems.set(interaction.userId, new Set());
      }
      userTestItems.get(interaction.userId)!.add(interaction.itemId);
    }

    let totalPrecision = 0;
    let totalRecall = 0;
    let totalNdcg = 0;
    let totalMrr = 0;
    let userCount = 0;

    const allRecommendations: Recommendation[][] = [];

    for (const [userId, testItems] of userTestItems) {
      const recommendations = predictions.get(userId);
      if (!recommendations || recommendations.length === 0) continue;

      allRecommendations.push(recommendations);

      totalPrecision += this.precisionAtK(recommendations, testItems, k);
      totalRecall += this.recallAtK(recommendations, testItems, k);
      totalNdcg += this.ndcgAtK(recommendations, testItems, k);
      totalMrr += this.meanReciprocalRank(recommendations, testItems);
      userCount++;
    }

    const coverage = this.catalogCoverage(allRecommendations, totalItems);

    return {
      precisionAtK: userCount > 0 ? totalPrecision / userCount : 0,
      recallAtK: userCount > 0 ? totalRecall / userCount : 0,
      ndcgAtK: userCount > 0 ? totalNdcg / userCount : 0,
      mrr: userCount > 0 ? totalMrr / userCount : 0,
      coverage
    };
  }

  /**
   * Format metrics for display
   */
  static formatMetrics(metrics: EvaluationMetrics, k: number): string {
    return `
Evaluation Metrics @ K=${k}
============================
Precision@${k}:  ${(metrics.precisionAtK * 100).toFixed(2)}%
Recall@${k}:     ${(metrics.recallAtK * 100).toFixed(2)}%
NDCG@${k}:       ${(metrics.ndcgAtK * 100).toFixed(2)}%
MRR:           ${metrics.mrr.toFixed(4)}
Coverage:      ${(metrics.coverage * 100).toFixed(2)}%
    `.trim();
  }
}
