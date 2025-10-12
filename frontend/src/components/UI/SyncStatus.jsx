import React from 'react';
import { useOfflineSync } from '../../hooks/useOfflineSync';

const SyncStatus = () => {
  const { getSyncStats, forceSync } = useOfflineSync();
  const stats = getSyncStats();

  if (stats.status === 'online' && stats.total === 0) {
    return null; // Don't show when everything is synced
  }

  const getStatusColor = () => {
    if (stats.status === 'offline') return 'bg-red-600';
    if (stats.isSyncing) return 'bg-blue-600';
    if (stats.highPriority > 0) return 'bg-orange-500';
    return 'bg-green-600';
  };

  const getStatusText = () => {
    if (stats.status === 'offline') return 'OFFLINE';
    if (stats.isSyncing) return 'SYNCING...';
    if (stats.highPriority > 0) return `${stats.highPriority} URGENT`;
    return 'SYNCED';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`${getStatusColor()} text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2`}>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{getStatusText()}</span>
          {stats.total > 0 && (
            <span className="text-xs opacity-90">
              {stats.total} record{stats.total !== 1 ? 's' : ''} pending
            </span>
          )}
        </div>
        
        {stats.status === 'online' && stats.total > 0 && !stats.isSyncing && (
          <button 
            onClick={forceSync}
            className="bg-white text-gray-800 px-2 py-1 rounded text-xs font-semibold hover:bg-gray-100 transition-colors"
          >
            SYNC
          </button>
        )}
        
        {stats.lastSync && (
          <div className="text-xs opacity-75">
            Last: {stats.lastSync.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatus;