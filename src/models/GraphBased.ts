import { Interaction, Recommendation, RecommenderModel } from '../types';

/**
 * Graph-based recommendation using Random Walk with Restart
 * Inspired by Personalized PageRank on user-item bipartite graph
 */
export class GraphBasedModel implements RecommenderModel {
  name = 'GraphBased';
  
  private graph: Map<string, Map<string, number>> = new Map();
  private userNodes: Set<string> = new Set();
  private itemNodes: Set<string> = new Set();
  private restartProb: number;
  private numWalks: number;
  private walkLength: number;

  constructor(
    restartProb: number = 0.15,
    numWalks: number = 100,
    walkLength: number = 10
  ) {
    this.restartProb = restartProb;
    this.numWalks = numWalks;
    this.walkLength = walkLength;
  }

  fit(data: Interaction[]): void {
    console.log('Building bipartite graph...');
    
    // Build bipartite graph: users <-> items
    for (const interaction of data) {
      const userNode = `u_${interaction.userId}`;
      const itemNode = `i_${interaction.itemId}`;
      
      this.userNodes.add(userNode);
      this.itemNodes.add(itemNode);

      // User -> Item edge
      if (!this.graph.has(userNode)) {
        this.graph.set(userNode, new Map());
      }
      this.graph.get(userNode)!.set(itemNode, interaction.weight);

      // Item -> User edge (symmetric)
      if (!this.graph.has(itemNode)) {
        this.graph.set(itemNode, new Map());
      }
      this.graph.get(itemNode)!.set(userNode, interaction.weight);
    }

    // Normalize edge weights
    this.normalizeGraph();
    
    console.log(`Graph built: ${this.userNodes.size} users, ${this.itemNodes.size} items`);
  }

  predict(userId: number, itemId: number): number {
    const userNode = `u_${userId}`;
    const itemNode = `i_${itemId}`;
    
    if (!this.graph.has(userNode) || !this.graph.has(itemNode)) {
      return 0;
    }

    // Run random walk with restart from user
    const scores = this.randomWalkWithRestart(userNode);
    return scores.get(itemNode) || 0;
  }

  recommendTopN(userId: number, n: number, excludeItems: Set<number> = new Set()): Recommendation[] {
    const userNode = `u_${userId}`;
    
    if (!this.graph.has(userNode)) {
      return [];
    }

    // Run random walk with restart
    const scores = this.randomWalkWithRestart(userNode);

    // Extract item scores
    const recommendations: Recommendation[] = [];
    
    for (const [node, score] of scores) {
      if (!node.startsWith('i_')) continue;
      
      const itemId = parseInt(node.substring(2));
      if (excludeItems.has(itemId)) continue;

      recommendations.push({
        itemId,
        score,
        explanation: 'Graph proximity'
      });
    }

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, n);
  }

  private randomWalkWithRestart(startNode: string): Map<string, number> {
    const visitCounts = new Map<string, number>();

    for (let walk = 0; walk < this.numWalks; walk++) {
      let currentNode = startNode;

      for (let step = 0; step < this.walkLength; step++) {
        // Count visit
        visitCounts.set(currentNode, (visitCounts.get(currentNode) || 0) + 1);

        // Restart with probability
        if (Math.random() < this.restartProb) {
          currentNode = startNode;
          continue;
        }

        // Move to neighbor
        const neighbors = this.graph.get(currentNode);
        if (!neighbors || neighbors.size === 0) {
          currentNode = startNode;
          continue;
        }

        currentNode = this.sampleNeighbor(neighbors);
      }
    }

    // Normalize counts to probabilities
    const totalVisits = Array.from(visitCounts.values()).reduce((a, b) => a + b, 0);
    const scores = new Map<string, number>();
    
    for (const [node, count] of visitCounts) {
      scores.set(node, count / totalVisits);
    }

    return scores;
  }

  private sampleNeighbor(neighbors: Map<string, number>): string {
    const totalWeight = Array.from(neighbors.values()).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const [neighbor, weight] of neighbors) {
      random -= weight;
      if (random <= 0) {
        return neighbor;
      }
    }

    // Fallback
    return Array.from(neighbors.keys())[0];
  }

  private normalizeGraph(): void {
    for (const [node, neighbors] of this.graph) {
      const totalWeight = Array.from(neighbors.values()).reduce((a, b) => a + b, 0);
      
      if (totalWeight > 0) {
        for (const [neighbor, weight] of neighbors) {
          neighbors.set(neighbor, weight / totalWeight);
        }
      }
    }
  }

  serialize(): any {
    const graphArray = Array.from(this.graph.entries()).map(([node, neighbors]) => [
      node,
      Array.from(neighbors.entries())
    ]);

    return {
      graph: graphArray,
      userNodes: Array.from(this.userNodes),
      itemNodes: Array.from(this.itemNodes),
      restartProb: this.restartProb,
      numWalks: this.numWalks,
      walkLength: this.walkLength
    };
  }

  deserialize(data: any): void {
    this.graph = new Map(
      data.graph.map(([node, neighborsArray]: [string, [string, number][]]) => [
        node,
        new Map(neighborsArray)
      ])
    );
    
    this.userNodes = new Set(data.userNodes);
    this.itemNodes = new Set(data.itemNodes);
    this.restartProb = data.restartProb;
    this.numWalks = data.numWalks;
    this.walkLength = data.walkLength;
  }
}
