import fs from 'fs';
import path from 'path';
import { RecommenderModel } from '../types';

export class ModelPersistence {
  private modelsDir: string;

  constructor(modelsDir: string = './data/models') {
    this.modelsDir = modelsDir;
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  getModelPath(modelName: string): string {
    return path.join(this.modelsDir, `${modelName}.json`);
  }

  modelExists(modelName: string): boolean {
    return fs.existsSync(this.getModelPath(modelName));
  }

  saveModel(model: RecommenderModel, metadata?: any): void {
    const modelPath = this.getModelPath(model.name);
    const data = {
      name: model.name,
      timestamp: new Date().toISOString(),
      metadata,
      // Store model-specific data
      modelData: (model as any).serialize ? (model as any).serialize() : null
    };
    
    fs.writeFileSync(modelPath, JSON.stringify(data, null, 2));
    console.log(`✅ Model ${model.name} saved to ${modelPath}`);
  }

  loadModel(modelName: string): any | null {
    const modelPath = this.getModelPath(modelName);
    
    if (!this.modelExists(modelName)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      console.log(`✅ Model ${modelName} loaded from ${modelPath}`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to load model ${modelName}:`, error);
      return null;
    }
  }

  allModelsExist(modelNames: string[]): boolean {
    return modelNames.every(name => this.modelExists(name));
  }

  getModelAge(modelName: string): number | null {
    if (!this.modelExists(modelName)) {
      return null;
    }

    const data = this.loadModel(modelName);
    if (data?.timestamp) {
      return Date.now() - new Date(data.timestamp).getTime();
    }
    return null;
  }

  clearAllModels(): void {
    if (fs.existsSync(this.modelsDir)) {
      const files = fs.readdirSync(this.modelsDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.modelsDir, file));
        }
      });
      console.log('🗑️  All cached models cleared');
    }
  }
}
