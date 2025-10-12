import { useState, useEffect, useCallback } from 'react';
import { useEmergency } from '../contexts/EmergencyContext';

export const useEmergencyMode = () => {
  const { 
    emergencyMode, 
    massCasualtyMode, 
    activateEmergencyMode, 
    deactivateEmergencyMode,
    activateMassCasualtyMode,
    addAlert 
  } = useEmergency();

  const [batteryLevel, setBatteryLevel] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [systemResources, setSystemResources] = useState({});

  // Monitor battery level
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
      if (emergencyMode) {
        addAlert('NETWORK_RESTORED', 'Internet connection restored', 'medium');
      }
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
      if (emergencyMode) {
        addAlert('NETWORK_LOST', 'Operating in offline mode', 'high');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [emergencyMode, addAlert]);

  // Monitor system resources
  useEffect(() => {
    const monitorResources = () => {
      if ('memory' in performance) {
        setSystemResources({
          memory: {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576),
            total: Math.round(performance.memory.totalJSHeapSize / 1048576),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
          }
        });
      }
    };

    const interval = setInterval(monitorResources, 30000);
    monitorResources(); // Initial call

    return () => clearInterval(interval);
  }, []);

  // Auto-activate emergency mode in critical situations
  useEffect(() => {
    if (batteryLevel !== null && batteryLevel < 10 && !emergencyMode) {
      addAlert('LOW_BATTERY', 'Battery critically low - activating emergency mode', 'high');
      activateEmergencyMode();
    }

    if (networkStatus === 'offline' && !emergencyMode) {
      // Auto-activate emergency mode when going offline in combat situations
      const shouldActivate = confirm(
        'Network connection lost. Activate emergency mode for offline operation?'
      );
      if (shouldActivate) {
        activateEmergencyMode();
      }
    }
  }, [batteryLevel, networkStatus, emergencyMode, activateEmergencyMode, addAlert]);

  // Emergency mode optimizations
  useEffect(() => {
    if (emergencyMode) {
      // Reduce animations for better performance
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      
      // Enable performance optimizations
      if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.saveData) {
          // Implement data saving measures
          console.log('📱 Data saving mode enabled for emergency operation');
        }
      }
    } else {
      // Restore normal settings
      document.documentElement.style.removeProperty('--animation-duration');
    }
  }, [emergencyMode]);

  const requestFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  const enableHighContrast = useCallback(() => {
    document.documentElement.classList.add('high-contrast');
    addAlert('HIGH_CONTRAST', 'High contrast mode enabled', 'low');
  }, [addAlert]);

  const disableHighContrast = useCallback(() => {
    document.documentElement.classList.remove('high-contrast');
  }, []);

  const getEmergencyStatus = useCallback(() => {
    return {
      emergencyMode,
      massCasualtyMode,
      batteryLevel,
      networkStatus,
      systemResources,
      timestamp: new Date()
    };
  }, [emergencyMode, massCasualtyMode, batteryLevel, networkStatus, systemResources]);

  const performEmergencyShutdown = useCallback(() => {
    if (emergencyMode) {
      // Clear sensitive data
      localStorage.removeItem('battlefield_auth');
      sessionStorage.clear();
      
      // Close the app
      if (window.ReactNativeWebView) {
        // React Native WebView
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'EMERGENCY_SHUTDOWN'
        }));
      } else {
        // Regular web app - reload to clear state
        window.location.reload();
      }
      
      addAlert('SYSTEM_SHUTDOWN', 'Emergency shutdown completed', 'critical');
    }
  }, [emergencyMode, addAlert]);

  const exportEmergencyData = useCallback(() => {
    const emergencyData = {
      timestamp: new Date(),
      status: getEmergencyStatus(),
      medicalRecords: [], // This would fetch from IndexedDB
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    const blob = new Blob([JSON.stringify(emergencyData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency-data-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addAlert('DATA_EXPORTED', 'Emergency data exported', 'medium');
  }, [getEmergencyStatus, addAlert]);

  return {
    // State
    emergencyMode,
    massCasualtyMode,
    batteryLevel,
    networkStatus,
    systemResources,

    // Actions
    activateEmergencyMode,
    deactivateEmergencyMode,
    activateMassCasualtyMode,
    requestFullscreen,
    exitFullscreen,
    enableHighContrast,
    disableHighContrast,
    performEmergencyShutdown,
    exportEmergencyData,

    // Status
    getEmergencyStatus,

    // Utilities
    isCriticalSituation: batteryLevel !== null && batteryLevel < 5,
    shouldOptimize: emergencyMode || networkStatus === 'offline' || (batteryLevel !== null && batteryLevel < 20)
  };
};

export default useEmergencyMode;