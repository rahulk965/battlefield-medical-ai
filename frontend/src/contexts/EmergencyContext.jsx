import React, { createContext, useContext, useState, useEffect } from 'react';

const EmergencyContext = createContext();

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};

export const EmergencyProvider = ({ children }) => {
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [massCasualtyMode, setMassCasualtyMode] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [systemStatus, setSystemStatus] = useState('normal');

  useEffect(() => {
    // Monitor system resources
    const checkSystemStatus = () => {
      if (!navigator.onLine) {
        setSystemStatus('offline');
      } else if (performance.memory && performance.memory.usedJSHeapSize > performance.memory.jsHeapSizeLimit * 0.8) {
        setSystemStatus('high_memory');
      } else {
        setSystemStatus('normal');
      }
    };

    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const activateEmergencyMode = () => {
    setEmergencyMode(true);
    addAlert('EMERGENCY_MODE_ACTIVATED', 'Emergency medical protocols activated', 'high');
    
    // Enable fullscreen if supported
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const deactivateEmergencyMode = () => {
    setEmergencyMode(false);
    addAlert('EMERGENCY_MODE_DEACTIVATED', 'Returning to normal operation', 'medium');
    
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const activateMassCasualtyMode = () => {
    setMassCasualtyMode(true);
    setEmergencyMode(true);
    addAlert('MASS_CASUALTY_ACTIVATED', 'Mass casualty protocols activated', 'critical');
  };

  const addAlert = (type, message, priority = 'medium') => {
    const alert = {
      id: Date.now(),
      type,
      message,
      priority,
      timestamp: new Date(),
      acknowledged: false
    };
    
    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    
    // Auto-remove low priority alerts after 30 seconds
    if (priority === 'low') {
      setTimeout(() => {
        removeAlert(alert.id);
      }, 30000);
    }
  };

  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const acknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const getActiveAlerts = () => {
    return alerts.filter(alert => !alert.acknowledged);
  };

  const getCriticalAlerts = () => {
    return alerts.filter(alert => alert.priority === 'critical' && !alert.acknowledged);
  };

  const value = {
    emergencyMode,
    massCasualtyMode,
    alerts,
    systemStatus,
    activateEmergencyMode,
    deactivateEmergencyMode,
    activateMassCasualtyMode,
    addAlert,
    removeAlert,
    acknowledgeAlert,
    clearAlerts,
    getActiveAlerts,
    getCriticalAlerts
  };

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
};