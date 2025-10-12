import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SymptomAnalyzer {
  constructor() {
    this.symptomMap = this.loadSymptomMap();
    this.emergencyKeywords = this.loadEmergencyKeywords();
    this.confidenceThreshold = 0.7;
  }

  loadSymptomMap() {
    try {
      const symptomData = fs.readFileSync(
        path.join(__dirname, '../../ml/symptomMap.json'), 
        'utf8'
      );
      return JSON.parse(symptomData);
    } catch (error) {
      console.error('Failed to load symptom map:', error);
      return this.getFallbackSymptomMap();
    }
  }

  loadEmergencyKeywords() {
    return {
      critical: [
        'unconscious', 'not breathing', 'no pulse', 'severe bleeding',
        'choking', 'heart attack', 'stroke', 'massive hemorrhage',
        'stopped breathing', 'cardiac arrest'
      ],
      urgent: [
        'difficulty breathing', 'chest pain', 'severe pain',
        'heavy bleeding', 'broken bone', 'major burn',
        'head injury', 'confusion', 'severe allergic'
      ],
      emergency: [
        'gunshot', 'shrapnel', 'blast', 'explosion', 'ambush',
        'IED', 'mortar', 'rocket', 'attack', 'combat'
      ]
    };
  }

  getFallbackSymptomMap() {
    return {
      "bleeding": {
        "diagnosis": "Hemorrhage",
        "triage": "IMMEDIATE",
        "firstAid": [
          "Apply direct pressure to wound",
          "Elevate injured area",
          "Use pressure points if needed",
          "Apply tourniquet for severe bleeding",
          "Treat for shock"
        ]
      },
      "broken bone": {
        "diagnosis": "Fracture", 
        "triage": "DELAYED",
        "firstAid": [
          "Immobilize injured area",
          "Apply splint if available",
          "Apply cold pack",
          "Elevate if possible"
        ]
      }
    };
  }

  async analyzeSymptoms(symptoms, vitalSigns = {}, location = {}) {
    try {
      const normalizedSymptoms = this.normalizeInput(symptoms);
      const analysis = {
        primaryDiagnosis: this.matchSymptoms(normalizedSymptoms),
        triageLevel: this.assessTriageLevel(normalizedSymptoms, vitalSigns),
        confidence: this.calculateConfidence(normalizedSymptoms),
        firstAidSteps: [],
        emergencyActions: [],
        militaryContext: {},
        timestamp: new Date(),
        vitalSignsAssessment: this.assessVitalSigns(vitalSigns)
      };

      // Generate first aid steps
      analysis.firstAidSteps = this.generateFirstAidSteps(analysis.primaryDiagnosis);
      
      // Check for emergency actions
      analysis.emergencyActions = this.getEmergencyActions(normalizedSymptoms);
      
      // Apply military context
      analysis.militaryContext = this.applyMilitaryContext(normalizedSymptoms, location);

      return analysis;
    } catch (error) {
      console.error('Symptom analysis error:', error);
      return this.getEmergencyFallback(symptoms);
    }
  }

  normalizeInput(symptoms) {
    if (typeof symptoms === 'string') {
      return symptoms.toLowerCase().split(/[,\\.]+/).map(s => s.trim()).filter(s => s);
    }
    return Array.isArray(symptoms) ? symptoms : [symptoms];
  }

  matchSymptoms(symptoms) {
    let bestMatch = { diagnosis: 'Unknown Condition', confidence: 0 };
    
    symptoms.forEach(symptom => {
      for (const [key, condition] of Object.entries(this.symptomMap)) {
        const similarity = this.calculateSimilarity(symptom, key);
        
        if (similarity > bestMatch.confidence && similarity > this.confidenceThreshold) {
          bestMatch = {
            diagnosis: condition.diagnosis,
            condition: key,
            confidence: similarity,
            metadata: condition
          };
        }
      }
    });

    return bestMatch.confidence > 0 ? bestMatch : {
      diagnosis: 'General First Aid Required',
      confidence: 0.3,
      metadata: {
        triage: 'MINOR',
        firstAid: [
          "Keep patient calm and comfortable",
          "Monitor vital signs",
          "Seek medical assistance when possible",
          "Document symptoms and timeline"
        ]
      }
    };
  }

  calculateSimilarity(symptom, condition) {
    const symptomWords = new Set(symptom.toLowerCase().split(/\s+/));
    const conditionWords = new Set(condition.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...symptomWords].filter(x => conditionWords.has(x)));
    const union = new Set([...symptomWords, ...conditionWords]);
    
    return intersection.size / union.size;
  }

  assessTriageLevel(symptoms, vitalSigns) {
    let score = 0;
    
    // Critical symptoms scoring
    symptoms.forEach(symptom => {
      const lowerSymptom = symptom.toLowerCase();
      
      if (this.emergencyKeywords.critical.some(keyword => lowerSymptom.includes(keyword))) {
        score += 40;
      } else if (this.emergencyKeywords.urgent.some(keyword => lowerSymptom.includes(keyword))) {
        score += 25;
      } else if (this.emergencyKeywords.emergency.some(keyword => lowerSymptom.includes(keyword))) {
        score += 30;
      }
    });

    // Vital signs assessment
    if (vitalSigns.heartRate > 140 || vitalSigns.heartRate < 50) score += 20;
    if (vitalSigns.bloodPressure && vitalSigns.bloodPressure.systolic < 90) score += 25;
    if (vitalSigns.respiratoryRate > 30 || vitalSigns.respiratoryRate < 10) score += 15;
    if (vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation < 90) score += 30;

    // Determine triage level
    if (score >= 70) return 'IMMEDIATE';
    if (score >= 40) return 'DELAYED'; 
    if (score >= 20) return 'MINOR';
    return 'EXPECTANT';
  }

  assessVitalSigns(vitalSigns) {
    const assessment = { status: 'NORMAL', concerns: [] };
    
    if (vitalSigns.heartRate > 100) assessment.concerns.push('Tachycardia');
    if (vitalSigns.heartRate < 60) assessment.concerns.push('Bradycardia');
    if (vitalSigns.respiratoryRate > 20) assessment.concerns.push('Tachypnea');
    
    if (assessment.concerns.length > 0) {
      assessment.status = 'ABNORMAL';
    }
    
    return assessment;
  }

  generateFirstAidSteps(diagnosisResult) {
    if (diagnosisResult.metadata && diagnosisResult.metadata.firstAid) {
      return diagnosisResult.metadata.firstAid;
    }
    
    // Fallback first aid steps
    return [
      "Ensure scene safety",
      "Check responsiveness",
      "Call for medical assistance",
      "Provide basic life support if needed",
      "Monitor patient condition",
      "Document all actions taken"
    ];
  }

  getEmergencyActions(symptoms) {
    const actions = [];
    const lowerSymptoms = symptoms.map(s => s.toLowerCase());
    
    if (lowerSymptoms.some(s => s.includes('not breathing') || s.includes('no pulse'))) {
      actions.push("BEGIN CPR IMMEDIATELY");
      actions.push("USE AED IF AVAILABLE");
      actions.push("CALL EMERGENCY MEDEVAC");
    }
    
    if (lowerSymptoms.some(s => s.includes('severe bleeding') || s.includes('hemorrhage'))) {
      actions.push("APPLY TOURNIQUET FOR LIMB BLEEDING");
      actions.push("USE HEMOSTATIC AGENTS");
      actions.push("PREPARE FOR BLOOD TRANSFUSION");
    }
    
    if (lowerSymptoms.some(s => s.includes('chemical') || s.includes('burn'))) {
      actions.push("DECONTAMINATE PATIENT");
      actions.push("USE PROTECTIVE EQUIPMENT");
      actions.push("ISOLATE CONTAMINATED AREA");
    }
    
    return actions;
  }

  applyMilitaryContext(symptoms, location) {
    const context = {
      combatRelated: false,
      evacuationPriority: 3,
      fieldTreatment: [],
      tacticalConsiderations: []
    };
    
    const lowerSymptoms = symptoms.map(s => s.toLowerCase());
    
    // Check for combat-related injuries
    const combatKeywords = ['gunshot', 'shrapnel', 'blast', 'ied', 'mortar', 'ambush'];
    context.combatRelated = lowerSymptoms.some(s => 
      combatKeywords.some(keyword => s.includes(keyword))
    );
    
    if (context.combatRelated) {
      context.evacuationPriority = 1;
      context.tacticalConsiderations.push("Secure area before treatment");
      context.tacticalConsiderations.push("Consider tactical field care");
      context.fieldTreatment.push("Apply combat tourniquet if needed");
      context.fieldTreatment.push("Use hemostatic agents for bleeding");
    }
    
    // Location-based considerations
    if (location.coordinates) {
      context.tacticalConsiderations.push(`Treatment at coordinates: ${location.coordinates}`);
    }
    
    return context;
  }

  calculateConfidence(symptoms) {
    if (symptoms.length === 0) return 0;
    
    let totalConfidence = 0;
    let matches = 0;
    
    symptoms.forEach(symptom => {
      for (const condition of Object.keys(this.symptomMap)) {
        const similarity = this.calculateSimilarity(symptom, condition);
        if (similarity > this.confidenceThreshold) {
          totalConfidence += similarity;
          matches++;
        }
      }
    });
    
    return matches > 0 ? totalConfidence / matches : 0.3;
  }

  getEmergencyFallback(symptoms) {
    return {
      primaryDiagnosis: {
        diagnosis: 'Emergency Condition - Immediate Assistance Required',
        confidence: 0.9,
        metadata: {
          triage: 'IMMEDIATE'
        }
      },
      triageLevel: 'IMMEDIATE',
      confidence: 0.9,
      firstAidSteps: [
        "CALL FOR EMERGENCY MEDEVAC",
        "Ensure scene safety",
        "Check ABCs (Airway, Breathing, Circulation)",
        "Control major bleeding",
        "Treat for shock",
        "Monitor vital signs continuously",
        "Prepare for emergency evacuation"
      ],
      emergencyActions: [
        "IMMEDIATE MEDICAL ATTENTION REQUIRED",
        "PREPARE FOR RAPID EVACUATION"
      ],
      militaryContext: {
        combatRelated: true,
        evacuationPriority: 1,
        fieldTreatment: ["Emergency trauma care required"]
      },
      timestamp: new Date()
    };
  }
}

export default SymptomAnalyzer;