import React from 'react';

const TriageIndicator = ({ level, size = 'medium' }) => {
  const triageConfig = {
    IMMEDIATE: {
      color: 'bg-red-600',
      text: 'IMMEDIATE',
      icon: '🚨',
      description: 'Critical - Immediate care required'
    },
    DELAYED: {
      color: 'bg-orange-500',
      text: 'DELAYED', 
      icon: '⚠️',
      description: 'Urgent - Treat within 2 hours'
    },
    MINOR: {
      color: 'bg-yellow-500',
      text: 'MINOR',
      icon: 'ℹ️',
      description: 'Minor - Routine care'
    },
    EXPECTANT: {
      color: 'bg-gray-600',
      text: 'EXPECTANT',
      icon: '💤',
      description: 'Expectant - Comfort care'
    }
  };

  const config = triageConfig[level] || triageConfig.MINOR;
  
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  return (
    <div className={`inline-flex items-center ${config.color} text-white font-bold rounded-lg ${sizeClasses[size]} animate-pulse-emergency`}>
      <span className="mr-2">{config.icon}</span>
      <span>{config.text}</span>
      <div className="ml-2 tooltip">
        <span className="text-xs">ℹ️</span>
        <div className="tooltip-text bg-black text-white p-2 rounded text-xs max-w-xs">
          {config.description}
        </div>
      </div>
    </div>
  );
};

export default TriageIndicator;