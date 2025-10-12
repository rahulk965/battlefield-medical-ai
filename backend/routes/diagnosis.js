import express from 'express';
import SymptomAnalyzer from '../services/ai/SymptomAnalyzer.js';
import MilitaryAuth from '../middleware/auth.js';

const router = express.Router();
const symptomAnalyzer = new SymptomAnalyzer();

// Analyze symptoms endpoint
router.post('/analyze', MilitaryAuth.authenticate, async (req, res) => {
  try {
    const { symptoms, vitalSigns, location, soldierInfo } = req.body;

    if (!symptoms || (typeof symptoms !== 'string' && !Array.isArray(symptoms))) {
      return res.status(400).json({
        success: false,
        error: 'Symptoms are required and must be a string or array',
        offlineFallback: true
      });
    }

    console.log(`🔍 Analyzing symptoms for soldier ${req.soldier.soldierId}:`, symptoms);

    const analysis = await symptomAnalyzer.analyzeSymptoms(
      symptoms, 
      vitalSigns || {}, 
      location || {}
    );

    // Add soldier info to analysis
    analysis.soldierId = req.soldier.soldierId;
    analysis.unit = req.soldier.unit;

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date(),
      system: 'Battlefield Medical AI'
    });

  } catch (error) {
    console.error('Diagnosis route error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Diagnosis system error',
      message: error.message,
      offlineFallback: true,
      emergencyProtocol: true,
      timestamp: new Date()
    });
  }
});

// Emergency triage assessment
router.post('/triage', MilitaryAuth.authenticate, async (req, res) => {
  try {
    const { symptoms, vitalSigns, mechanismOfInjury, environment } = req.body;

    if (!symptoms && !vitalSigns) {
      return res.status(400).json({
        success: false,
        error: 'Symptoms or vital signs required for triage assessment'
      });
    }

    const analysis = await symptomAnalyzer.analyzeSymptoms(
      symptoms || [], 
      vitalSigns || {}, 
      {}
    );

    // Enhanced triage with mechanism of injury
    const enhancedTriage = {
      ...analysis,
      mechanismOfInjury,
      environment,
      fieldTriageDecision: router.makeFieldTriageDecision(analysis, mechanismOfInjury),
      evacuationPriority: router.calculateEvacuationPriority(analysis, environment),
      resourceRequirements: router.assessResourceNeeds(analysis)
    };

    res.json({
      success: true,
      data: enhancedTriage,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Triage assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Triage system error',
      offlineFallback: true
    });
  }
});

// Batch symptoms analysis for multiple casualties
router.post('/mass-casualty', MilitaryAuth.authenticate, async (req, res) => {
  try {
    const { casualties } = req.body;

    if (!Array.isArray(casualties) || casualties.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Casualties array is required'
      });
    }

    if (casualties.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 casualties per request'
      });
    }

    const analyses = await Promise.all(
      casualties.map(async (casualty, index) => {
        try {
          const analysis = await symptomAnalyzer.analyzeSymptoms(
            casualty.symptoms,
            casualty.vitalSigns,
            casualty.location
          );
          
          return {
            casualtyId: casualty.id || `casualty-${index + 1}`,
            ...analysis,
            triageTag: router.assignTriageTag(analysis.triageLevel)
          };
        } catch (error) {
          return {
            casualtyId: casualty.id || `casualty-${index + 1}`,
            error: 'Analysis failed',
            triageLevel: 'IMMEDIATE', // Assume worst case
            triageTag: 'RED',
            offline: true
          };
        }
      })
    );

    // Sort by triage priority
    const triageOrder = { IMMEDIATE: 1, DELAYED: 2, MINOR: 3, EXPECTANT: 4 };
    analyses.sort((a, b) => triageOrder[a.triageLevel] - triageOrder[b.triageLevel]);

    res.json({
      success: true,
      data: {
        totalCasualties: analyses.length,
        immediate: analyses.filter(a => a.triageLevel === 'IMMEDIATE').length,
        delayed: analyses.filter(a => a.triageLevel === 'DELAYED').length,
        minor: analyses.filter(a => a.triageLevel === 'MINOR').length,
        analyses,
        summary: this.generateMassCasualtySummary(analyses)
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Mass casualty analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Mass casualty system error',
      offlineFallback: true
    });
  }
});

// Helper methods
router.makeFieldTriageDecision = (analysis, mechanism) => {
  if (analysis.triageLevel === 'IMMEDIATE') return 'IMMEDIATE_EVACUATION';
  if (mechanism === 'blast' || mechanism === 'gunshot') return 'URGENT_ASSESSMENT';
  return 'ROUTINE_CARE';
};

router.calculateEvacuationPriority = (analysis, environment) => {
  let priority = 3; // Default
  
  if (analysis.triageLevel === 'IMMEDIATE') priority = 1;
  else if (analysis.triageLevel === 'DELAYED') priority = 2;
  
  // Environmental factors
  if (environment === 'combat') priority = Math.max(1, priority - 1);
  if (environment === 'remote') priority = Math.max(1, priority - 1);
  
  return priority;
};

router.assessResourceNeeds = (analysis) => {
  const needs = [];
  
  if (analysis.triageLevel === 'IMMEDIATE') {
    needs.push('MEDEVAC', 'BLOOD_PRODUCTS', 'SURGICAL_TEAM');
  }
  
  if (analysis.emergencyActions.length > 0) {
    needs.push('EMERGENCY_SUPPLIES');
  }
  
  if (analysis.militaryContext.combatRelated) {
    needs.push('TACTICAL_MEDIC', 'COMBAT_DRESSINGS');
  }
  
  return needs.length > 0 ? needs : ['BASIC_MEDICAL_SUPPLIES'];
};

router.assignTriageTag = (triageLevel) => {
  const tags = {
    'IMMEDIATE': 'RED',
    'DELAYED': 'YELLOW', 
    'MINOR': 'GREEN',
    'EXPECTANT': 'BLACK'
  };
  
  return tags[triageLevel] || 'GREEN';
};

router.generateMassCasualtySummary = (analyses) => {
  const summary = {
    red: analyses.filter(a => a.triageTag === 'RED').length,
    yellow: analyses.filter(a => a.triageTag === 'YELLOW').length,
    green: analyses.filter(a => a.triageTag === 'GREEN').length,
    black: analyses.filter(a => a.triageTag === 'BLACK').length,
    recommendations: []
  };

  if (summary.red > 0) {
    summary.recommendations.push(`IMMEDIATE: ${summary.red} critical casualties require urgent evacuation`);
  }
  
  if (summary.yellow > 0) {
    summary.recommendations.push(`URGENT: ${summary.yellow} casualties need medical attention within 2 hours`);
  }

  return summary;
};

export default router;