import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class InjuryDetector {
  constructor() {
    this.model = null;
    this.labels = [
      'gunshot_wound', 'shrapnel_wound', 'burn', 'fracture_visible',
      'laceration', 'blast_injury', 'abrasion', 'normal'
    ];
    this.confidenceThreshold = 0.6;
    this.modelLoaded = false;
  }

  async loadModel() {
    try {
      if (this.modelLoaded) return true;
      // Try dynamic import of TensorFlow; if unavailable, fall back to mock
      console.log('🔄 Loading TensorFlow.js model for injury detection...');
      try {
        const tfModule = await import('@tensorflow/tfjs-node');
        this.tf = tfModule;

        // Create a wrapper model that returns tensors when tf is available
        this.model = {
          predict: (tensor) => {
            const mockPredictions = this.generateMockPredictions();
            try {
              return this.tf.tensor2d([mockPredictions]);
            } catch (e) {
              return [mockPredictions];
            }
          }
        };

        this.modelLoaded = true;
        console.log('✅ Injury detection model ready (TensorFlow available)');
        return true;
      } catch (err) {
        console.warn('TensorFlow not available, using mock injury detector');
        this.model = {
          predict: () => {
            const mockPredictions = this.generateMockPredictions();
            return [mockPredictions];
          }
        };
        this.modelLoaded = true;
        console.log('✅ Injury detection mock model ready');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to load injury detection model:', error);
      this.modelLoaded = false;
      return false;
    }
  }

  generateMockPredictions() {
    // Generate realistic mock predictions for demo
    const predictions = new Array(this.labels.length).fill(0);

    // Randomly select a primary injury with high confidence
    const primaryInjuryIndex = Math.floor(Math.random() * (this.labels.length - 1));
    predictions[primaryInjuryIndex] = 0.7 + Math.random() * 0.25;

    // Add some secondary possibilities
    for (let i = 0; i < this.labels.length; i++) {
      if (i !== primaryInjuryIndex && Math.random() > 0.7) {
        predictions[i] = 0.1 + Math.random() * 0.3;
      }
    }

    // Normalize
    const sum = predictions.reduce((a, b) => a + b, 0);
    return predictions.map(p => p / sum);
  }

  async detectInjury(imageBuffer) {
    try {
      if (!await this.loadModel()) {
        return this.getFallbackDetection();
      }

      console.log('🔍 Analyzing injury from image...');

      // Mock image processing - in real implementation, this would process the actual image
      const mockResults = await this.processImageMock(imageBuffer);

      return {
        success: true,
        injuries: mockResults.detections,
        overallAssessment: mockResults.assessment,
        confidence: mockResults.confidence,
        firstAid: this.getInjuryFirstAid(mockResults.primaryInjury),
        militaryContext: this.getMilitaryInjuryContext(mockResults.detections),
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Injury detection error:', error);
      return this.getFallbackDetection();
    }
  }

  async processImageMock(imageBuffer) {
    // Simulate image processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const predictions = this.generateMockPredictions();
    const detections = [];

    predictions.forEach((confidence, index) => {
      if (confidence > this.confidenceThreshold && this.labels[index] !== 'normal') {
        detections.push({
          injuryType: this.labels[index],
          confidence: Math.round(confidence * 100) / 100,
          severity: this.assessSeverity(this.labels[index], confidence),
          location: this.guessInjuryLocation(),
          description: this.getInjuryDescription(this.labels[index])
        });
      }
    });

    // If no specific injuries detected, return normal
    if (detections.length === 0) {
      detections.push({
        injuryType: 'normal',
        confidence: 0.95,
        severity: 'none',
        description: 'No visible injuries detected'
      });
    }

    // Sort by confidence
    detections.sort((a, b) => b.confidence - a.confidence);

    return {
      detections,
      primaryInjury: detections[0]?.injuryType || 'normal',
      assessment: this.getOverallAssessment(detections),
      confidence: Math.max(...detections.map(d => d.confidence))
    };
  }

  assessSeverity(injuryType, confidence) {
    const severityMap = {
      'gunshot_wound': 'severe',
      'blast_injury': 'severe',
      'shrapnel_wound': 'moderate-severe',
      'fracture_visible': 'moderate',
      'burn': 'moderate',
      'laceration': 'mild-moderate',
      'abrasion': 'mild'
    };

    return severityMap[injuryType] || 'unknown';
  }

  guessInjuryLocation() {
    const locations = ['arm', 'leg', 'chest', 'abdomen', 'head', 'face', 'back'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  getInjuryDescription(injuryType) {
    const descriptions = {
      'gunshot_wound': 'Circular wound with possible entry/exit points, tissue damage visible',
      'shrapnel_wound': 'Multiple small wounds with embedded foreign objects',
      'burn': 'Reddened skin with possible blistering and tissue damage',
      'fracture_visible': 'Visible bone deformity or abnormal limb positioning',
      'laceration': 'Deep cut with clean edges, significant bleeding possible',
      'blast_injury': 'Multiple trauma patterns including burns, penetrating wounds',
      'abrasion': 'Superficial skin scraping with minor bleeding',
      'normal': 'No visible trauma detected'
    };

    return descriptions[injuryType] || 'Unknown injury pattern';
  }

  getOverallAssessment(detections) {
    if (detections.length === 0 || detections[0].injuryType === 'normal') {
      return 'No immediate medical concerns detected';
    }

    const severeInjuries = detections.filter(d =>
      d.severity === 'severe' || d.severity === 'moderate-severe'
    );

    if (severeInjuries.length > 0) {
      return `CRITICAL: ${severeInjuries.length} severe injuries detected - Immediate medical attention required`;
    }

    return `${detections.length} injuries detected requiring medical assessment`;
  }

  getInjuryFirstAid(primaryInjury) {
    const firstAidMap = {
      'gunshot_wound': [
        "Apply direct pressure to control bleeding",
        "Check for exit wound - treat both entry and exit",
        "Use hemostatic gauze if available",
        "Apply pressure dressing",
        "Treat for shock",
        "Emergency evacuation required"
      ],
      'shrapnel_wound': [
        "Do not remove embedded fragments",
        "Control bleeding with direct pressure",
        "Apply sterile dressing around objects",
        "Monitor for internal bleeding",
        "Treat for shock"
      ],
      'burn': [
        "Cool burn with clean water",
        "Cover with sterile non-stick dressing",
        "Do not break blisters",
        "Monitor breathing if facial burns",
        "Pain management"
      ],
      'fracture_visible': [
        "Immobilize injured area",
        "Apply splint if available",
        "Check circulation beyond injury",
        "Apply cold pack",
        "Do not attempt to realign bone"
      ],
      'laceration': [
        "Apply direct pressure to control bleeding",
        "Clean wound if possible",
        "Apply sterile dressing",
        "Monitor for signs of infection"
      ],
      'blast_injury': [
        "Check for multiple injury types",
        "Primary survey: ABCs (Airway, Breathing, Circulation)",
        "Control bleeding",
        "Treat for shock",
        "Monitor for internal injuries",
        "Emergency evacuation"
      ],
      'abrasion': [
        "Clean wound with water",
        "Apply antibiotic ointment if available",
        "Cover with sterile dressing",
        "Monitor for infection"
      ],
      'normal': [
        "No specific first aid required",
        "Monitor for any changes in condition",
        "Seek medical advice if symptoms develop"
      ]
    };

    return firstAidMap[primaryInjury] || [
      "Ensure scene safety",
      "Provide basic life support if needed",
      "Seek medical assistance"
    ];
  }

  getMilitaryInjuryContext(detections) {
    const combatInjuries = detections.filter(d =>
      ['gunshot_wound', 'shrapnel_wound', 'blast_injury'].includes(d.injuryType)
    );

    return {
      combatRelated: combatInjuries.length > 0,
      evacuationPriority: combatInjuries.length > 0 ? 1 : 3,
      fieldTreatment: combatInjuries.length > 0 ?
        ["Apply combat trauma protocols", "Prepare for tactical evacuation"] :
        ["Standard first aid procedures"],
      tacticalConsiderations: combatInjuries.length > 0 ?
        ["Secure area before treatment", "Consider tactical field care"] :
        ["Standard medical protocols apply"]
    };
  }

  getFallbackDetection() {
    return {
      success: false,
      injuries: [{
        injuryType: 'analysis_failed',
        confidence: 0.1,
        severity: 'unknown',
        description: 'Injury analysis unavailable - using emergency protocols'
      }],
      overallAssessment: 'EMERGENCY: Analysis system offline - assume serious injury',
      confidence: 0.1,
      firstAid: [
        "SYSTEM OFFLINE - USE EMERGENCY PROTOCOLS",
        "Check ABCs (Airway, Breathing, Circulation)",
        "Control any visible bleeding",
        "Treat for shock",
        "Monitor vital signs",
        "Prepare for emergency evacuation"
      ],
      militaryContext: {
        combatRelated: true,
        evacuationPriority: 1,
        fieldTreatment: ["Emergency trauma care required"]
      },
      timestamp: new Date(),
      offline: true
    };
  }
}

export default InjuryDetector;