import * as dotenv from 'dotenv';
import path from 'path';
import { MovieLensLoader, DataSplitter } from './data';
import { 
  PopularityModel, 
  MatrixFactorizationModel, 
  ItemItemCF,
  GraphBasedModel 
} from './models';
import { Evaluator } from './evaluation';
import { RecommendationAPI } from './serving';

dotenv.config();

async function main() {
  console.log('🎬 Movie Recommendation System');
  console.log('================================\n');

  // Configuration
  const datasetPath = process.env.MOVIELENS_DATASET_PATH || './ml-1m';
  const port = parseInt(process.env.PORT || '3000');

  // Load dataset
  console.log(`📁 Loading dataset from: ${datasetPath}`);
  const loader = new MovieLensLoader(datasetPath);
  
  if (!MovieLensLoader.datasetExists(datasetPath)) {
    console.error(`❌ Dataset not found at ${datasetPath}`);
    console.error('Please ensure ratings.dat and movies.dat exist');
    process.exit(1);
  }

  const dataset = await loader.loadDataset();
  console.log(`✅ Loaded ${dataset.interactions.length} interactions`);
  console.log(`   - Users: ${dataset.users.size}`);
  console.log(`   - Movies: ${dataset.movies.size}\n`);

  // Split data
  console.log('🔪 Splitting data (80/20 train/test)...');
  const { train, test } = DataSplitter.temporalSplit(dataset.interactions, 0.2);
  console.log(`   - Training: ${train.length} interactions`);
  console.log(`   - Testing: ${test.length} interactions\n`);

  // Initialize models
  const models = [
    new PopularityModel(),
    new MatrixFactorizationModel(30, 5, 0.1),
    new ItemItemCF(30),
    new GraphBasedModel(0.15, 50, 8)
  ];

  // Train models
  console.log('🔧 Training models...\n');
  for (const model of models) {
    console.log(`Training ${model.name}...`);
    const startTime = Date.now();
    model.fit(train);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ ${model.name} trained in ${elapsed}s\n`);
  }

  // Evaluate models
  console.log('📊 Evaluating models...\n');
  const k = 10;
  
  for (const model of models) {
    console.log(`Evaluating ${model.name}...`);
    
    // Generate predictions for test users
    const testUsers = new Set(test.map(t => t.userId));
    const predictions = new Map();
    
    // Get items each user interacted with in training
    const trainUserItems = new Map<number, Set<number>>();
    for (const interaction of train) {
      if (!trainUserItems.has(interaction.userId)) {
        trainUserItems.set(interaction.userId, new Set());
      }
      trainUserItems.get(interaction.userId)!.add(interaction.itemId);
    }
    
    let userCount = 0;
    for (const userId of testUsers) {
      const excludeItems = trainUserItems.get(userId) || new Set();
      const recs = model.recommendTopN(userId, k, excludeItems);
      if (recs.length > 0) {
        predictions.set(userId, recs);
        userCount++;
      }
      
      // Progress indicator
      if (userCount % 500 === 0) {
        process.stdout.write(`  Processed ${userCount} users...\r`);
      }
    }
    console.log(`  Processed ${userCount} users`);
    
    const metrics = Evaluator.evaluateModel(
      predictions,
      test,
      k,
      dataset.movies.size
    );
    
    console.log(Evaluator.formatMetrics(metrics, k));
    console.log('');
  }

  // Start API server
  console.log('🚀 Starting API server...\n');
  const api = new RecommendationAPI(port);
  
  // Register all trained models
  for (const model of models) {
    api.registerModel(model);
  }
  
  // Set dataset for enrichment
  api.setDataset(dataset, train);
  
  // Start server
  api.start();
}

// Run the application
main().catch(error => {
  console.error('❌ Application error:', error);
  process.exit(1);
});
