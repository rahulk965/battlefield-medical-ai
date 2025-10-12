import React, { createContext, useContext, useState, useEffect } from 'react';
import battlefieldDB from '../services/offlineDB';

const MedicalContext = createContext();

export const useMedical = () => {
  const context = useContext(MedicalContext);
  if (!context) {
    throw new Error('useMedical must be used within a MedicalProvider');
  }
  return context;
};

export const MedicalProvider = ({ children }) => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [emergencyProtocols, setEmergencyProtocols] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecords: 0,
    immediateCases: 0,
    syncedRecords: 0
  });

  useEffect(() => {
    loadMedicalData();
    loadEmergencyProtocols();
  }, []);

  const loadMedicalData = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, you would filter by soldier ID
      const records = await battlefieldDB.getMedicalRecords('current');
      setMedicalRecords(records);
      
      // Calculate stats
      const immediateCases = records.filter(r => 
        r.analysis?.triageLevel === 'IMMEDIATE'
      ).length;
      
      const syncedRecords = records.filter(r => r.synced).length;
      
      setStats({
        totalRecords: records.length,
        immediateCases,
        syncedRecords
      });
      
    } catch (error) {
      console.error('Failed to load medical data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmergencyProtocols = async () => {
    try {
      // Load default emergency protocols
      const defaultProtocols = {
        massive_hemorrhage: {
          id: 'massive_hemorrhage',
          title: 'Massive Hemorrhage Control',
          steps: [
            'Apply direct pressure with combat gauze',
            'Use tourniquet for extremity bleeding',
            'Apply hemostatic agents',
            'Consider junctional tourniquet for groin/axilla',
            'Monitor for signs of shock'
          ],
          priority: 1
        },
        airway_management: {
          id: 'airway_management',
          title: 'Airway Management',
          steps: [
            'Check for airway obstruction',
            'Use jaw thrust maneuver',
            'Insert nasopharyngeal airway',
            'Consider surgical airway if needed',
            'Monitor oxygen saturation'
          ],
          priority: 1
        },
        tension_pneumothorax: {
          id: 'tension_pneumothorax',
          title: 'Tension Pneumothorax',
          steps: [
            'Identify decreased breath sounds',
            'Perform needle decompression',
            'Insert chest tube if available',
            'Monitor vital signs',
            'Prepare for evacuation'
          ],
          priority: 1
        }
      };
      
      await battlefieldDB.saveEmergencyProtocols(defaultProtocols);
      setEmergencyProtocols(defaultProtocols);
      
    } catch (error) {
      console.error('Failed to load emergency protocols:', error);
    }
  };

  const addMedicalRecord = async (record) => {
    try {
      await loadMedicalData(); // Reload to get updated records
    } catch (error) {
      console.error('Failed to add medical record:', error);
    }
  };

  const getEmergencyProtocol = (protocolId) => {
    return emergencyProtocols[protocolId] || null;
  };

  const getRecentCases = (limit = 5) => {
    return medicalRecords
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  };

  const getCasesByTriage = (triageLevel) => {
    return medicalRecords.filter(record => 
      record.analysis?.triageLevel === triageLevel
    );
  };

  const value = {
    medicalRecords,
    emergencyProtocols,
    isLoading,
    stats,
    addMedicalRecord,
    getEmergencyProtocol,
    getRecentCases,
    getCasesByTriage,
    refreshData: loadMedicalData
  };

  return (
    <MedicalContext.Provider value={value}>
      {children}
    </MedicalContext.Provider>
  );
};