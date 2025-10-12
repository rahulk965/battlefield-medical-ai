// Battlefield Medical Protocols and Emergency Procedures

// Primary Survey Protocol (ABCDE)
export const PRIMARY_SURVEY = {
  A: {
    step: 'A - Airway',
    assessment: 'Check for airway obstruction',
    actions: [
      'Clear airway of foreign bodies',
      'Use jaw thrust maneuver if cervical spine injury suspected',
      'Insert oropharyngeal/nasopharyngeal airway if needed',
      'Prepare for intubation if airway cannot be maintained'
    ],
    criticalFindings: [
      'Complete airway obstruction',
      'Stridor or abnormal breath sounds',
      'Inability to speak or cough'
    ]
  },
  B: {
    step: 'B - Breathing',
    assessment: 'Assess breathing effectiveness',
    actions: [
      'Look for symmetrical chest movement',
      'Listen for breath sounds',
      'Check respiratory rate and pattern',
      'Administer oxygen if available',
      'Assist ventilation if inadequate'
    ],
    criticalFindings: [
      'Respiratory rate <8 or >30',
      'Cyanosis',
      'Use of accessory muscles',
      'Asymmetric chest movement'
    ]
  },
  C: {
    step: 'C - Circulation',
    assessment: 'Assess circulation and hemorrhage',
    actions: [
      'Check pulse rate and quality',
      'Assess skin color and temperature',
      'Control external bleeding',
      'Establish IV access if available',
      'Monitor blood pressure'
    ],
    criticalFindings: [
      'Absent radial pulse',
      'Capillary refill >2 seconds',
      'Uncontrolled hemorrhage',
      'Systolic BP <90 mmHg'
    ]
  },
  D: {
    step: 'D - Disability',
    assessment: 'Assess neurological status',
    actions: [
      'Check level of consciousness (AVPU)',
      'Assess pupil size and reaction',
      'Check for lateralizing signs',
      'Monitor Glasgow Coma Scale'
    ],
    criticalFindings: [
      'Unresponsive (U on AVPU)',
      'Unequal pupils',
      'Seizure activity',
      'GCS <9'
    ]
  },
  E: {
    step: 'E - Exposure/Environment',
    assessment: 'Fully expose patient while maintaining dignity and preventing hypothermia',
    actions: [
      'Remove clothing to assess hidden injuries',
      'Maintain body temperature',
      'Log roll to assess back',
      'Check for medical alert tags'
    ],
    criticalFindings: [
      'Hypothermia',
      'Hidden severe injuries',
      'Environmental hazards'
    ]
  }
};

// Tactical Combat Casualty Care (TCCC) Protocols
export const TCCC_PROTOCOLS = {
  CARE_UNDER_FIRE: {
    phase: 'Care Under Fire',
    situation: 'Direct enemy fire present',
    priorities: [
      'Return fire and take cover',
      'Direct casualty to remain engaged if able',
      'Direct casualty to move to cover and apply self-aid if able',
      'Keep casualty from sustaining additional wounds',
      'Airway management usually deferred until next phase'
    ],
    interventions: [
      'Tourniquet for life-threatening extremity hemorrhage',
      'Move casualty to cover when feasible'
    ]
  },
  TACTICAL_FIELD_CARE: {
    phase: 'Tactical Field Care',
    situation: 'No direct enemy fire, but mission ongoing',
    priorities: [
      'Airway management with cervical spine protection',
      'Breathing - needle decompression for tension pneumothorax',
      'Circulation - bleeding control, IV/IO access, fluid resuscitation',
      'Prevention of hypothermia',
      'Penetrating eye trauma management',
      'Analgesia as needed'
    ],
    interventions: [
      'Jaw thrust or nasopharyngeal airway',
      'Chest seal for open pneumothorax',
      'Tourniquet conversion if possible',
      'Tranexamic acid if within 3 hours of injury',
      'Antibiotics for open wounds'
    ]
  },
  TACTICAL_EVACUATION: {
    phase: 'Tactical Evacuation',
    situation: 'During evacuation to medical facility',
    priorities: [
      'Continue all previous interventions',
      'Advanced airway management if needed',
      'Reassess and adjust tourniquets',
      'Monitor vital signs continuously',
      'Communicate with receiving facility'
    ],
    interventions: [
      'Endotracheal intubation if qualified',
      'Blood product administration if available',
      'Advanced pain management',
      'Documentation of care provided'
    ]
  }
};

// Mass Casualty Incident (MCI) Protocols
export const MCI_PROTOCOLS = {
  INITIAL_RESPONSE: {
    phase: 'Initial Response',
    actions: [
      'Establish incident command',
      'Set up triage area away from hazard',
      'Perform initial triage using START system',
      'Assign treatment areas by triage category',
      'Request additional resources early'
    ],
    triageCategories: {
      RED: 'Immediate - life-threatening injuries, can be saved with immediate care',
      YELLOW: 'Delayed - serious injuries, but stable for 2-4 hours',
      GREEN: 'Minor - walking wounded, minimal treatment needed',
      BLACK: 'Expectant - deceased or unsalvageable given available resources'
    }
  },
  RESOURCE_ALLOCATION: {
    phase: 'Resource Allocation',
    guidelines: [
      'Focus resources on RED category first',
      'Use minimal resources for GREEN category',
      'Re-triage every 15-30 minutes',
      'Document all triage decisions',
      'Maintain security and crowd control'
    ],
    staffingRatios: {
      TRIAGE: '1 medic per 25 casualties',
      TREATMENT: '1 medic per 5 RED casualties',
      TRANSPORT: '1 medic per evacuation vehicle'
    }
  },
  EVACUATION: {
    phase: 'Evacuation',
    priorities: [
      'RED casualties first (most critical)',
      'Coordinate with receiving facilities',
      'Document evacuation destinations',
      'Maintain chain of custody for personal effects',
      'Provide situation reports to command'
    ],
    documentation: [
      'Triage tags on all casualties',
      'Evacuation records',
      'Treatment provided logs',
      'Resource utilization reports'
    ]
  }
};

// Emergency Medical Procedures
export const EMERGENCY_PROCEDURES = {
  HEMORRHAGE_CONTROL: {
    name: 'Hemorrhage Control',
    steps: [
      'Apply direct pressure with sterile dressing',
      'Elevate injured extremity if no fracture suspected',
      'Use pressure points if direct pressure fails',
      'Apply tourniquet 2-3 inches above wound for severe bleeding',
      'Document tourniquet time',
      'Do not remove soaked dressings - add more layers'
    ],
    tourniquetGuidelines: {
      indication: 'Life-threatening extremity hemorrhage not controlled by direct pressure',
      application: 'Tighten until bleeding stops',
      documentation: 'Mark "T" and time on casualty\'s forehead',
      duration: 'Can be left in place for up to 6 hours'
    }
  },
  AIRWAY_MANAGEMENT: {
    name: 'Airway Management',
    steps: [
      'Head-tilt chin-lift (if no spinal injury)',
      'Jaw thrust (if spinal injury suspected)',
      'Clear airway of foreign bodies',
      'Insert nasopharyngeal airway',
      'Consider endotracheal intubation if trained',
      'Surgical cricothyroidotomy as last resort'
    ],
    equipment: [
      'Oral and nasal airways',
      'Suction device',
      'Laryngoscope and endotracheal tubes',
      'Surgical airway kit'
    ]
  },
  CHEST_TRAUMA: {
    name: 'Chest Trauma Management',
    conditions: {
      TENSION_PNEUMOTHORAX: {
        signs: 'Respiratory distress, tracheal deviation, absent breath sounds',
        treatment: 'Needle decompression - 2nd intercostal space, mid-clavicular line'
      },
      OPEN_PNEUMOTHORAX: {
        signs: 'Sucking chest wound, respiratory distress',
        treatment: 'Three-sided occlusive dressing or commercial chest seal'
      },
      MASSIVE_HEMOTHORAX: {
        signs: 'Respiratory distress, dullness to percussion',
        treatment: 'Fluid resuscitation, rapid evacuation to surgical facility'
      }
    }
  },
  SHOCK_MANAGEMENT: {
    name: 'Shock Management',
    types: {
      HYPOVOLEMIC: 'Hemorrhage, dehydration',
      CARDIOGENIC: 'Heart failure, myocardial infarction',
      NEUROGENIC: 'Spinal cord injury',
      SEPTIC: 'Severe infection'
    },
    treatment: [
      'Control bleeding',
      'IV/IO access and fluid resuscitation',
      'Maintain body temperature',
      'Elevate legs if no lower extremity injury',
      'Monitor vital signs frequently',
      'Prepare for rapid evacuation'
    ]
  }
};

// Medication Administration Protocols
export const MEDICATION_PROTOCOLS = {
  ANALGESICS: {
    MORPHINE: {
      indication: 'Severe pain',
      dose: '2-4 mg IV/IO every 5-10 minutes as needed',
      maxDose: '20 mg',
      contraindications: [
        'Head injury with altered mental status',
        'Respiratory depression',
        'Hypotension'
      ],
      monitoring: 'Respiratory rate, blood pressure, pain level'
    },
    FENTANYL: {
      indication: 'Severe pain, especially in hemodynamically unstable patients',
      dose: '50-100 mcg IV/IO every 5-10 minutes',
      advantages: 'Less histamine release, more hemodynamically stable'
    }
  },
  ANTIBIOTICS: {
    CEFTRIAXONE: {
      indication: 'Prophylaxis for open wounds',
      dose: '1-2 grams IV/IM',
      coverage: 'Broad-spectrum including gram-positive and gram-negative'
    }
  },
  TRANEXAMIC_ACID: {
    indication: 'Significant hemorrhage within 3 hours of injury',
    dose: '1 gram IV over 10 minutes, then 1 gram over 8 hours',
    benefits: 'Reduces mortality in traumatic hemorrhage'
  }
};

// Export all protocols
export default {
  PRIMARY_SURVEY,
  TCCC_PROTOCOLS,
  MCI_PROTOCOLS,
  EMERGENCY_PROCEDURES,
  MEDICATION_PROTOCOLS
};