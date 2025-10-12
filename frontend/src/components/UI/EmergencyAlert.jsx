import React from 'react';
import { useEmergency } from '../../contexts/EmergencyContext';
import { AlertTriangle, X, Volume2, Bell } from 'lucide-react';

const EmergencyAlert = () => {
  const { 
    alerts, 
    acknowledgeAlert, 
    removeAlert, 
    getCriticalAlerts,
    emergencyMode 
  } = useEmergency();

  const criticalAlerts = getCriticalAlerts();

  if (criticalAlerts.length === 0 && !emergencyMode) {
    return null;
  }

  const playAlertSound = () => {
    // In a real app, play an emergency sound
    console.log('Playing emergency alert sound');
  };

  return (
    <>
      {/* Emergency Mode Banner */}
      {emergencyMode && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 z-50 animate-pulse-emergency">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={20} />
              <span className="font-bold">EMERGENCY MODE ACTIVE</span>
            </div>
            <div className="text-sm">
              Battlefield Medical Protocols Engaged
            </div>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {criticalAlerts.map((alert) => (
        <div
          key={alert.id}
          className="fixed top-12 left-1/2 transform -translate-x-1/2 bg-red-700 border border-red-500 text-white p-4 rounded-lg shadow-2xl z-50 max-w-md animate-blink"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Bell size={24} className="text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg mb-1">CRITICAL ALERT</div>
              <div className="text-sm">{alert.message}</div>
              <div className="text-xs opacity-75 mt-1">
                {alert.timestamp.toLocaleTimeString()}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={playAlertSound}
                className="text-white hover:text-gray-200 transition-colors"
                title="Repeat alert sound"
              >
                <Volume2 size={16} />
              </button>
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="text-white hover:text-gray-200 transition-colors"
                title="Acknowledge alert"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Alert Toast Stack */}
      <div className="fixed top-20 right-4 z-40 space-y-2">
        {alerts
          .filter(alert => !alert.acknowledged && alert.priority !== 'critical')
          .map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg shadow-lg border max-w-xs transition-all ${
                alert.priority === 'high'
                  ? 'bg-orange-600 border-orange-500 text-white'
                  : 'bg-blue-600 border-blue-500 text-white'
              }`}
            >
              <div className="flex items-start space-x-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  {alert.message}
                </div>
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default EmergencyAlert;