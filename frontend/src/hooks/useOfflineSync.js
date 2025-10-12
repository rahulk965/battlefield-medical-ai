import { useState, useEffect, useCallback } from 'react';
import battlefieldDB from '../services/offlineDB.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState('online');
  const [queuedRecords, setQueuedRecords] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { soldier } = useAuth();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('online');
      console.log('✅ Back online - starting sync');
      attemptSync();
    };

    const handleOffline = () => {
      setSyncStatus('offline');
      console.log('⚠️ Offline mode activated');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status check
    setSyncStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load queued records on mount
  useEffect(() => {
    loadQueuedRecords();
  }, []);

  const loadQueuedRecords = async () => {
    try {
      const pendingItems = await battlefieldDB.getPendingSyncItems();
      setQueuedRecords(pendingItems);
    } catch (error) {
      console.error('Failed to load queued records:', error);
    }
  };

  const queueRecord = useCallback(async (record) => {
    try {
      // Allow emergency records without authentication
      const recordWithSoldier = soldier ? {
        ...record,
        soldierId: soldier.soldierId,
        unit: soldier.unit
      } : {
        ...record,
        soldierId: 'emergency-unknown',
        unit: 'emergency'
      };

      const recordId = await battlefieldDB.saveMedicalRecord(recordWithSoldier);
      
      // Update local state
      setQueuedRecords(prev => [...prev, {
        id: recordId,
        type: 'medical_record',
        recordId,
        priority: battlefieldDB.calculateSyncPriority(record),
        timestamp: new Date()
      }]);

      // Attempt sync if online
      if (syncStatus === 'online') {
        attemptSync();
      }

      return { success: true, recordId };
    } catch (error) {
      console.error('Failed to queue record:', error);
      return { success: false, error: error.message };
    }
  }, [soldier, syncStatus]);

  const attemptSync = useCallback(async () => {
    if (isSyncing || syncStatus !== 'online') return;

    setIsSyncing(true);
    console.log('🔄 Starting sync process...');

    try {
      // Get all pending items regardless of user status
      const pendingItems = await battlefieldDB.getPendingSyncItems(5); // Sync 5 items at a time
      
      if (pendingItems.length === 0) {
        console.log('✅ No pending items to sync');
        setLastSync(new Date());
        return;
      }

      console.log(`Found ${pendingItems.length} items to sync`);
      
      // Group items by type (emergency vs authenticated)
      const emergencyItems = pendingItems.filter(item => item.emergencyMode);
      const authenticatedItems = pendingItems.filter(item => !item.emergencyMode);

      let successCount = 0;
      let errorCount = 0;

      for (const item of pendingItems) {
        try {
          // Get the full record from medical_records store
          let record;
          if (soldier) {
            // Get authenticated user records
            record = await battlefieldDB.getMedicalRecords(soldier.soldierId)
              .then(records => records.find(r => r.id === item.recordId));
          } else {
            // Get emergency records
            record = await battlefieldDB.getMedicalRecords('emergency-unknown')
              .then(records => records.find(r => r.id === item.recordId));
          }

          if (!record) {
            console.warn(`Record ${item.recordId} not found, skipping`);
            continue;
          }

          // Simulate API call - in real implementation, call your backend
          const syncResult = await simulateAPISync(record);
          
          if (syncResult.success) {
            await battlefieldDB.markAsSynced(item.recordId);
            successCount++;
          } else {
            errorCount++;
          }

          // Small delay between sync attempts
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to sync item ${item.recordId}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Sync completed: ${successCount} successful, ${errorCount} failed`);
      setLastSync(new Date());
      
      // Reload queued records
      await loadQueuedRecords();

    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, syncStatus, soldier]);

  const forceSync = useCallback(async () => {
    console.log('🔄 Manual sync triggered');
    await attemptSync();
  }, [attemptSync]);

  const getSyncStats = useCallback(() => {
    const highPriority = queuedRecords.filter(r => r.priority === 1).length;
    const total = queuedRecords.length;
    
    return {
      total,
      highPriority,
      isSyncing,
      lastSync,
      status: syncStatus
    };
  }, [queuedRecords, isSyncing, lastSync, syncStatus]);

  // Auto-sync when coming online
  useEffect(() => {
    if (syncStatus === 'online' && queuedRecords.length > 0) {
      const autoSyncTimer = setTimeout(() => {
        attemptSync();
      }, 2000); // Wait 2 seconds after coming online

      return () => clearTimeout(autoSyncTimer);
    }
  }, [syncStatus, queuedRecords.length, attemptSync]);

  // Periodic sync when online
  useEffect(() => {
    if (syncStatus !== 'online') return;

    const interval = setInterval(() => {
      if (queuedRecords.length > 0 && !isSyncing) {
        console.log('🔄 Periodic sync check');
        attemptSync();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [syncStatus, queuedRecords.length, isSyncing, attemptSync]);

  return {
    queueRecord,
    attemptSync,
    forceSync,
    getSyncStats,
    syncStatus,
    queuedRecords,
    isSyncing,
    lastSync
  };
};

// Mock API sync function - replace with actual backend calls
const simulateAPISync = async (record) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Simulate occasional failures
  if (Math.random() < 0.1) { // 10% failure rate for testing
    throw new Error('Simulated API failure');
  }
  
  console.log(`✅ Synced record: ${record.id}`, record);
  return { success: true };
};