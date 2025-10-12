import express from 'express';
import multer from 'multer';
import InjuryDetector from '../services/ai/InjuryDetector.js';
import MilitaryAuth from '../middleware/auth.js';

const router = express.Router();
const injuryDetector = new InjuryDetector();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Detect injury from image
router.post('/detect', MilitaryAuth.authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required',
        offlineFallback: true
      });
    }

    console.log(`🖼️ Analyzing injury image for soldier ${req.soldier.soldierId}`);
    console.log(`   File: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    const { mechanism, location, additionalInfo } = req.body;

    const detectionResult = await injuryDetector.detectInjury(req.file.buffer);

    // Enhance with additional context
    const enhancedResult = {
      ...detectionResult,
      soldierId: req.soldier.soldierId,
      imageMetadata: {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadTime: new Date()
      },
      context: {
        mechanism: mechanism || 'unknown',
        location: location || {},
        additionalInfo: additionalInfo || '',
        analyzedBy: 'Battlefield Medical AI'
      }
    };

    res.json({
      success: true,
      data: enhancedResult,
      timestamp: new Date(),
      system: 'Combat Injury Detection System'
    });

  } catch (error) {
    console.error('Injury detection route error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Injury detection system error',
      message: error.message,
      offlineFallback: true,
      emergencyProtocol: true,
      timestamp: new Date()
    });
  }
});

// Bulk injury analysis for multiple images
router.post('/bulk-detect', MilitaryAuth.authenticate, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one image file is required'
      });
    }

    console.log(`🖼️ Bulk analyzing ${req.files.length} images for soldier ${req.soldier.soldierId}`);

    const analyses = await Promise.all(
      req.files.map(async (file, index) => {
        try {
          const detection = await injuryDetector.detectInjury(file.buffer);
          
          return {
            imageId: `img-${index + 1}`,
            filename: file.originalname,
            ...detection
          };
        } catch (error) {
          return {
            imageId: `img-${index + 1}`,
            filename: file.originalname,
            success: false,
            error: 'Analysis failed',
            injuries: [],
            overallAssessment: 'Analysis unavailable'
          };
        }
      })
    );

    // Generate combined assessment
  const combinedAssessment = router.generateCombinedAssessment(analyses);

    res.json({
      success: true,
      data: {
        totalImages: analyses.length,
        analyses,
        combinedAssessment,
  recommendations: router.generateBulkRecommendations(analyses)
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Bulk injury detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk analysis system error',
      offlineFallback: true
    });
  }
});

// Get injury detection capabilities
router.get('/capabilities', MilitaryAuth.authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      detectableInjuries: injuryDetector.labels,
      confidenceThreshold: injuryDetector.confidenceThreshold,
      modelStatus: injuryDetector.modelLoaded ? 'OPERATIONAL' : 'OFFLINE',
      maxFileSize: '10MB',
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'BMP', 'WEBP'],
      capabilities: [
        'Combat injury detection',
        'Severity assessment', 
        'First aid guidance',
        'Military context analysis',
        'Offline fallback mode'
      ]
    },
    timestamp: new Date()
  });
});

// Helper methods
router.generateCombinedAssessment = (analyses) => {
  const allInjuries = analyses.flatMap(analysis => 
    analysis.injuries.map(injury => ({
      ...injury,
      sourceImage: analysis.filename
    }))
  );

  const severeInjuries = allInjuries.filter(injury => 
    injury.severity === 'severe' || injury.severity === 'moderate-severe'
  );

  if (severeInjuries.length > 0) {
    return {
      level: 'CRITICAL',
      message: `${severeInjuries.length} severe injuries detected across ${analyses.length} images`,
      injuries: severeInjuries,
      priority: 'IMMEDIATE_EVACUATION'
    };
  }

  const totalInjuries = allInjuries.filter(injury => injury.injuryType !== 'normal').length;

  if (totalInjuries > 0) {
    return {
      level: 'MODERATE',
      message: `${totalInjuries} injuries detected requiring medical attention`,
      injuries: allInjuries.filter(injury => injury.injuryType !== 'normal'),
      priority: 'URGENT_CARE'
    };
  }

  return {
    level: 'MINOR',
    message: 'No significant injuries detected',
    injuries: [],
    priority: 'ROUTINE_CHECK'
  };
};

router.generateBulkRecommendations = (analyses) => {
  const recommendations = [];
  const hasSevereInjuries = analyses.some(analysis =>
    analysis.injuries.some(injury => injury.severity === 'severe' || injury.severity === 'moderate-severe')
  );

  if (hasSevereInjuries) {
    recommendations.push('IMMEDIATE: Multiple severe injuries detected - Prepare for emergency evacuation');
    recommendations.push('RESOURCE: Require surgical team and blood products');
    recommendations.push('TACTICAL: Secure evacuation route and landing zone');
  }

  const totalInjuries = analyses.reduce((count, analysis) =>
    count + analysis.injuries.filter(injury => injury.injuryType !== 'normal').length, 0
  );

  if (totalInjuries > 3) {
    recommendations.push(`LOGISTICS: ${totalInjuries} total injuries - Prepare mass casualty response`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring and provide routine care as needed');
  }

  return recommendations;
};

export default router;