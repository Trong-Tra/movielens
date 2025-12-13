import * as dotenv from 'dotenv';
import { MovieLensLoader, DataSplitter } from './data';
import { 
  PopularityModel, 
  MatrixFactorizationModel, 
  GraphBasedModel 
} from './models';
import { Evaluator } from './evaluation';
import { RecommendationAPI } from './serving';

dotenv.config();

async function main() {
  console.log('🎬 Movie Recommendation System - Quick Demo');
  console.log('=============================================\n');

  const datasetPath = process.env.MOVIELENS_DATASET_PATH || './ml-1m';
  const port = parseInt(process.env.PORT || '3000');

  // Load dataset
  console.log(`📁 Loading dataset from: ${datasetPath}`);
  const loader = new MovieLensLoader(datasetPath);
  
  if (!MovieLensLoader.datasetExists(datasetPath)) {
    console.error(`❌ Dataset not found at ${datasetPath}`);
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

  // Initialize fast models only
  const models = [
    new PopularityModel(),
    new MatrixFactorizationModel(30, 5, 0.1),
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

  // Quick evaluation sample (just 100 users for demo)
  console.log('📊 Quick evaluation (sample)...\n');
  const k = 10;
  const sampleSize = 100;
  
  for (const model of models) {
    console.log(`Evaluating ${model.name}...`);
    
    const testUsers = Array.from(new Set(test.map(t => t.userId))).slice(0, sampleSize);
    const predictions = new Map();
    
    const trainUserItems = new Map<number, Set<number>>();
    for (const interaction of train) {
      if (!trainUserItems.has(interaction.userId)) {
        trainUserItems.set(interaction.userId, new Set());
      }
      trainUserItems.get(interaction.userId)!.add(interaction.itemId);
    }
    
    for (const userId of testUsers) {
      const excludeItems = trainUserItems.get(userId) || new Set();
      const recs = model.recommendTopN(userId, k, excludeItems);
      if (recs.length > 0) {
        predictions.set(userId, recs);
      }
    }
    
    const sampleTest = test.filter(t => testUsers.includes(t.userId));
    const metrics = Evaluator.evaluateModel(
      predictions,
      sampleTest,
      k,
      dataset.movies.size
    );
    
    console.log(Evaluator.formatMetrics(metrics, k));
    console.log('');
  }

  // Example recommendations
  console.log('🎯 Example Recommendations for User 1:\n');
  const userId = 1;
  const excludeItems = new Set<number>();
  for (const interaction of train) {
    if (interaction.userId === userId) {
      excludeItems.add(interaction.itemId);
    }
  }

  for (const model of models) {
    const recs = model.recommendTopN(userId, 5, excludeItems);
    console.log(`${model.name}:`);
    recs.forEach((rec, idx) => {
      const movie = dataset.movies.get(rec.itemId);
      console.log(`  ${idx + 1}. ${movie?.title || 'Unknown'} (score: ${rec.score.toFixed(3)})`);
    });
    console.log('');
  }

  // Start API server
  console.log('🚀 Starting API server...\n');
  const api = new RecommendationAPI(port);
  
  for (const model of models) {
    api.registerModel(model);
  }
  
  api.setDataset(dataset, train);
  api.start();
}

main().catch(error => {
  console.error('❌ Application error:', error);
  process.exit(1);
});
