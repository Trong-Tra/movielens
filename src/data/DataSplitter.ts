import { Interaction, TrainTestSplit } from '../types';

/**
 * Utilities for splitting data into train and test sets
 */
export class DataSplitter {
  /**
   * Split interactions by timestamp (chronological split)
   * Takes the most recent interactions per user for testing
   */
  static temporalSplit(
    interactions: Interaction[],
    testRatio: number = 0.2
  ): TrainTestSplit {
    // Group interactions by user
    const userInteractions = new Map<number, Interaction[]>();
    
    for (const interaction of interactions) {
      if (!userInteractions.has(interaction.userId)) {
        userInteractions.set(interaction.userId, []);
      }
      userInteractions.get(interaction.userId)!.push(interaction);
    }

    const train: Interaction[] = [];
    const test: Interaction[] = [];

    // For each user, split their interactions
    for (const [userId, userInts] of userInteractions) {
      // Sort by timestamp
      const sorted = userInts.sort((a, b) => 
        (a.timestamp || 0) - (b.timestamp || 0)
      );

      const splitPoint = Math.floor(sorted.length * (1 - testRatio));
      train.push(...sorted.slice(0, splitPoint));
      test.push(...sorted.slice(splitPoint));
    }

    return { train, test };
  }

  /**
   * Random split with seed for reproducibility
   */
  static randomSplit(
    interactions: Interaction[],
    testRatio: number = 0.2,
    seed: number = 42
  ): TrainTestSplit {
    // Seeded shuffle
    const shuffled = [...interactions];
    this.shuffleWithSeed(shuffled, seed);

    const splitPoint = Math.floor(shuffled.length * (1 - testRatio));
    
    return {
      train: shuffled.slice(0, splitPoint),
      test: shuffled.slice(splitPoint)
    };
  }

  /**
   * Leave-one-out split: for each user, take their last interaction for testing
   */
  static leaveOneOut(interactions: Interaction[]): TrainTestSplit {
    const userInteractions = new Map<number, Interaction[]>();
    
    for (const interaction of interactions) {
      if (!userInteractions.has(interaction.userId)) {
        userInteractions.set(interaction.userId, []);
      }
      userInteractions.get(interaction.userId)!.push(interaction);
    }

    const train: Interaction[] = [];
    const test: Interaction[] = [];

    for (const [userId, userInts] of userInteractions) {
      if (userInts.length === 1) {
        // If user has only one interaction, put it in train
        train.push(userInts[0]);
      } else {
        // Sort by timestamp and take last one for test
        const sorted = userInts.sort((a, b) => 
          (a.timestamp || 0) - (b.timestamp || 0)
        );
        train.push(...sorted.slice(0, -1));
        test.push(sorted[sorted.length - 1]);
      }
    }

    return { train, test };
  }

  /**
   * Seeded shuffle using a simple LCG
   */
  private static shuffleWithSeed<T>(array: T[], seed: number): void {
    let currentSeed = seed;
    
    const random = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };

    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
