import * as tf from '@tensorflow/tfjs-node';

class TensorFlowConfig {
  constructor() {
    this.modelCache = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize TensorFlow backend
      await tf.ready();
      console.log('✅ TensorFlow.js backend initialized:', tf.getBackend());
      
      // Set memory configuration for better performance
      tf.engine().setMemoryLimit(1024 * 1024 * 512); // 512MB limit
      
      // Enable production mode for better performance
      tf.enableProdMode();
      
      this.initialized = true;
      
      console.log('🎯 TensorFlow.js configured for battlefield medical use');
    } catch (error) {
      console.error('❌ TensorFlow.js initialization failed:', error);
      throw error;
    }
  }

  async loadModel(modelPath) {
    if (this.modelCache.has(modelPath)) {
      return this.modelCache.get(modelPath);
    }

    try {
      console.log(`🔄 Loading model from: ${modelPath}`);
      
      // In production, this would load actual trained models
      // For now, we'll create a mock model for demonstration
      const mockModel = this.createMockModel();
      
      this.modelCache.set(modelPath, mockModel);
      return mockModel;
    } catch (error) {
      console.error(`❌ Failed to load model from ${modelPath}:`, error);
      throw error;
    }
  }

  createMockModel() {
    // Create a mock model for demonstration
    return {
      predict: (tensor) => {
        // Mock prediction logic
        const mockOutput = tf.tensor2d([
          [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.3] // Mock probabilities
        ]);
        return mockOutput;
      },
      dispose: () => {
        console.log('🧹 Model disposed');
      }
    };
  }

  async warmupModels() {
    try {
      console.log('🔥 Warming up AI models...');
      
      // Warm up injury detection model
      const injuryModel = await this.loadModel('injury-detection');
      const dummyInput = tf.zeros([1, 224, 224, 3]);
      const warmupResult = injuryModel.predict(dummyInput);
      tf.dispose([dummyInput, warmupResult]);
      
      console.log('✅ AI models warmed up and ready');
    } catch (error) {
      console.error('❌ Model warmup failed:', error);
    }
  }

  getMemoryUsage() {
    return {
      backend: tf.getBackend(),
      memory: tf.memory(),
      tensorCount: tf.engine().state.numTensors
    };
  }

  cleanup() {
    // Clean up model cache
    for (const model of this.modelCache.values()) {
      if (model.dispose) {
        model.dispose();
      }
    }
    this.modelCache.clear();
    
    // Clean up TensorFlow memory
    tf.disposeVariables();
    console.log('🧹 TensorFlow memory cleaned up');
  }
}

// Create singleton instance
const tensorFlowConfig = new TensorFlowConfig();

export default tensorFlowConfig;