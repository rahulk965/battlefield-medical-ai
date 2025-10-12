class EmergencyTriage {
  constructor() {
    this.triageProtocols = this.loadTriageProtocols();
    this.massCasualtyGuidelines = this.loadMassCasualtyGuidelines();
  }

  loadTriageProtocols() {
    return {
      // Military Triage Categories
      T1: {
        level: 'IMMEDIATE',
        color: 'RED',
        description: 'Immediate - Life-threatening injuries requiring immediate intervention',
        treatmentPriority: 1,
        evacuationPriority: 1,
        examples: [
          'Airway obstruction',
          'Tension pneumothorax',
          'Massive external hemorrhage',
          'Shock'
        ]
      },
      T2: {
        level: 'DELAYED', 
        color: 'YELLOW',
        description: 'Urgent - Serious injuries not immediately life-threatening',
        treatmentPriority: 2,
        evacuationPriority: 2,
        examples: [
          'Major fractures',
          'Burns 15-40% BSA',
          'Soft tissue injuries',
          'Eye injuries'
        ]
      },
      T3: {
        level: 'MINOR',
        color: 'GREEN',
        description: 'Minor - Walking wounded with minor injuries',
        treatmentPriority: 3,
        evacuationPriority: 3,
        examples: [
          'Minor lacerations',
          'Contusions',
          'Minor burns <15% BSA',
          'Sprains'
        ]
      },
      T4: {
        level: 'EXPECTANT',
        color: 'BLACK',
        description: 'Expectant - Victims unlikely to survive given available resources',
        treatmentPriority: 4,
        evacuationPriority: 4,
        examples: [
          'Unsurvivable injuries',
          'Cardiac arrest in trauma',
          'Severe burns >85% BSA'
        ]
      }
    };
  }

  loadMassCasualtyGuidelines() {
    return {
      initialAssessment: [
        "Clear airway and control major hemorrhage",
        "Assess breathing and circulation",
        "Check neurological status",
        "Perform rapid trauma survey"
      ],
      resourceAllocation: {
        high: ["Tourniquets", "Hemostatic agents", "Chest seals", "Airway adjuncts"],
        medium: ["Pressure dressings", "Splints", "Burn dressings"],
        low: ["Bandages", "Antiseptics", "Analgesics"]
      },
      evacuationPriorities: {
        1: "Immediate - Within 1 hour",
        2: "Urgent - Within 2-4 hours", 
        3: "Delayed - Within 4-8 hours",
        4: "Minimal - When resources available"
      }
    };
  }

  // Primary triage decision algorithm
  performPrimaryTriage(patientAssessment) {
    const { 
      breathing, 
      perfusion, 
      mentalStatus, 
      injuries,
      mechanismOfInjury 
    } = patientAssessment;

    let triageCategory = 'T3'; // Default to minor

    // Step 1: Check breathing
    if (!breathing || breathing === 'absent') {
      return this.triageProtocols.T4; // Expectant
    }

    // Step 2: Check perfusion (circulation)
    if (perfusion === 'absent' || perfusion === 'weak') {
      return this.triageProtocols.T1; // Immediate
    }

    // Step 3: Check mental status
    if (mentalStatus === 'unresponsive' || mentalStatus === 'confused') {
      return this.triageProtocols.T1; // Immediate
    }

    // Step 4: Assess injuries
    const severeInjuries = this.assessInjurySeverity(injuries);
    if (severeInjuries.includes('life_threatening')) {
      return this.triageProtocols.T1; // Immediate
    } else if (severeInjuries.includes('serious')) {
      return this.triageProtocols.T2; // Delayed
    }

    // Step 5: Consider mechanism of injury
    if (this.isHighRiskMechanism(mechanismOfInjury)) {
      // Upgrade triage for high-risk mechanisms
      if (triageCategory === 'T3') triageCategory = 'T2';
    }

    return this.triageProtocols[triageCategory];
  }

  assessInjurySeverity(injuries) {
    const severity = [];

    injuries.forEach(injury => {
      const injuryType = injury.type?.toLowerCase();
      const location = injury.location?.toLowerCase();

      // Life-threatening injuries
      if (
        injuryType.includes('gunshot') && 
        ['chest', 'abdomen', 'head', 'neck'].includes(location)
      ) {
        severity.push('life_threatening');
      } else if (injuryType.includes('massive hemorrhage')) {
        severity.push('life_threatening');
      } else if (injuryType.includes('airway compromise')) {
        severity.push('life_threatening');
      } else if (injuryType.includes('tension pneumothorax')) {
        severity.push('life_threatening');
      }
      // Serious injuries
      else if (
        injuryType.includes('fracture') ||
        injuryType.includes('burn') ||
        injuryType.includes('penetrating')
      ) {
        severity.push('serious');
      }
      // Minor injuries
      else {
        severity.push('minor');
      }
    });

    return severity;
  }

  isHighRiskMechanism(mechanism) {
    const highRiskMechanisms = [
      'blast', 'explosion', 'gunshot', 'vehicle_rollover',
      'fall_height', 'crush', 'chemical_exposure'
    ];

    return highRiskMechanisms.some(risk => 
      mechanism?.toLowerCase().includes(risk)
    );
  }

  // Mass casualty incident triage
  performMassCasualtyTriage(casualties) {
    const triagedCasualties = casualties.map(casualty => ({
      ...casualty,
      triage: this.performPrimaryTriage(casualty.assessment)
    }));

    // Sort by triage priority
    const priorityOrder = { T1: 1, T2: 2, T3: 3, T4: 4 };
    triagedCasualties.sort((a, b) => 
      priorityOrder[a.triage.level] - priorityOrder[b.triage.level]
    );

    // Generate resource requirements
    const resourceRequirements = this.calculateResourceNeeds(triagedCasualties);

    return {
      casualties: triagedCasualties,
      summary: this.generateTriageSummary(triagedCasualties),
      resourceRequirements,
      recommendations: this.generateTriageRecommendations(triagedCasualties)
    };
  }

  calculateResourceNeeds(casualties) {
    const resources = {
      immediate: { count: 0, needs: [] },
      delayed: { count: 0, needs: [] },
      minor: { count: 0, needs: [] }
    };

    casualties.forEach(casualty => {
      const triageLevel = casualty.triage.level;
      
      if (triageLevel === 'IMMEDIATE') {
        resources.immediate.count++;
        resources.immediate.needs.push(...this.getImmediateNeeds(casualty));
      } else if (triageLevel === 'DELAYED') {
        resources.delayed.count++;
        resources.delayed.needs.push(...this.getDelayedNeeds(casualty));
      } else if (triageLevel === 'MINOR') {
        resources.minor.count++;
        resources.minor.needs.push(...this.getMinorNeeds(casualty));
      }
    });

    // Remove duplicates and count frequencies
    Object.keys(resources).forEach(key => {
      const needCounts = {};
      resources[key].needs.forEach(need => {
        needCounts[need] = (needCounts[need] || 0) + 1;
      });
      resources[key].needs = needCounts;
    });

    return resources;
  }

  getImmediateNeeds(casualty) {
    const needs = ['Medevac', 'Surgical Team', 'Blood Products'];
    
    if (casualty.assessment.injuries.some(i => i.type?.includes('bleeding'))) {
      needs.push('Tourniquets', 'Hemostatic Agents');
    }
    
    if (casualty.assessment.injuries.some(i => i.type?.includes('airway'))) {
      needs.push('Airway Kit', 'Oxygen');
    }
    
    return needs;
  }

  getDelayedNeeds(casualty) {
    return ['IV Fluids', 'Analgesia', 'Antibiotics', 'Splints', 'Burn Dressings'];
  }

  getMinorNeeds(casualty) {
    return ['Bandages', 'Antiseptics', 'Basic First Aid'];
  }

  generateTriageSummary(casualties) {
    const counts = {
      T1: 0, T2: 0, T3: 0, T4: 0
    };

    casualties.forEach(casualty => {
      counts[casualty.triage.level]++;
    });

    return {
      total: casualties.length,
      immediate: counts.T1,
      delayed: counts.T2,
      minor: counts.T3,
      expectant: counts.T4,
      mortalityPrediction: this.predictMortality(counts)
    };
  }

  predictMortality(counts) {
    // Simple mortality prediction based on triage distribution
    const total = counts.T1 + counts.T2 + counts.T3 + counts.T4;
    if (total === 0) return 0;

    const weightedMortality = 
      (counts.T1 * 0.6) +  // 60% mortality for immediate
      (counts.T2 * 0.2) +  // 20% mortality for delayed  
      (counts.T3 * 0.02) + // 2% mortality for minor
      (counts.T4 * 0.95);  // 95% mortality for expectant

    return Math.round((weightedMortality / total) * 100);
  }

  generateTriageRecommendations(casualties) {
    const recommendations = [];
    const summary = this.generateTriageSummary(casualties);

    if (summary.immediate > 0) {
      recommendations.push(`URGENT: ${summary.immediate} immediate casualties require medevac`);
    }

    if (summary.delayed > 5) {
      recommendations.push(`ALERT: ${summary.delayed} delayed casualties - consider additional medical teams`);
    }

    if (summary.mortalityPrediction > 30) {
      recommendations.push(`CRITICAL: High mortality risk predicted (${summary.mortalityPrediction}%)`);
    }

    if (casualties.length > 10) {
      recommendations.push('MASS CASUALTY: Activate mass casualty protocols');
    }

    return recommendations.length > 0 ? recommendations : ['Situation manageable with current resources'];
  }

  // Re-triage assessment (for changing conditions)
  performReTriage(initialTriage, currentAssessment) {
    const newTriage = this.performPrimaryTriage(currentAssessment);
    
    return {
      initial: initialTriage,
      current: newTriage,
      changed: initialTriage.level !== newTriage.level,
      direction: this.getTriageChangeDirection(initialTriage.level, newTriage.level),
      timestamp: new Date()
    };
  }

  getTriageChangeDirection(initial, current) {
    const priority = { IMMEDIATE: 1, DELAYED: 2, MINOR: 3, EXPECTANT: 4 };
    if (priority[initial] > priority[current]) return 'improved';
    if (priority[initial] < priority[current]) return 'deteriorated';
    return 'stable';
  }
}

export default EmergencyTriage;