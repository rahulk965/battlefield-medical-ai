import MedicalRecord from '../../models/MedicalRecord.js';

class SyncManager {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.syncInterval = null;
    this.maxRetries = 3;
    this.syncBatchSize = 10;
  }

  // Add record to sync queue
  async queueForSync(record, priority = 3) {
    const syncItem = {
      id: this.generateSyncId(),
      record,
      priority,
      attempts: 0,
      lastAttempt: null,
      timestamp: new Date(),
      status: 'queued'
    };

    this.syncQueue.push(syncItem);
    
    // Sort by priority and timestamp
    this.syncQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    console.log(`📋 Queued record for sync: ${syncItem.id}, Priority: ${priority}`);
    
    // Start sync process if not already running
    if (!this.isSyncing) {
      this.startSyncProcess();
    }

    return syncItem.id;
  }

  // Start background sync process
  startSyncProcess() {
    if (this.isSyncing) return;

    this.isSyncing = true;
    console.log('🔄 Starting background sync process...');

    this.syncInterval = setInterval(async () => {
      await this.processSyncBatch();
    }, 5000); // Process every 5 seconds
  }

  // Stop sync process
  stopSyncProcess() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isSyncing = false;
    console.log('🛑 Sync process stopped');
  }

  // Process a batch of sync items
  async processSyncBatch() {
    if (this.syncQueue.length === 0) {
      console.log('✅ Sync queue empty');
      this.stopSyncProcess();
      return;
    }

    const batch = this.syncQueue.splice(0, this.syncBatchSize);
    console.log(`🔄 Processing sync batch: ${batch.length} items`);

    const results = {
      successful: 0,
      failed: 0,
      retried: 0
    };

    for (const item of batch) {
      try {
        await this.syncSingleItem(item);
        results.successful++;
      } catch (error) {
        console.error(`❌ Sync failed for item ${item.id}:`, error);
        
        if (item.attempts < this.maxRetries) {
          item.attempts++;
          item.lastAttempt = new Date();
          item.status = 'retrying';
          item.priority = Math.min(item.priority + 1, 1); // Increase priority on retry
          this.syncQueue.push(item);
          results.retried++;
        } else {
          results.failed++;
          await this.handleSyncFailure(item, error);
        }
      }
    }

    console.log(`📊 Sync batch completed: ${results.successful} successful, ${results.failed} failed, ${results.retried} retried`);
  }

  // Sync single item to database
  async syncSingleItem(syncItem) {
    const { record } = syncItem;

    console.log(`📤 Syncing record: ${syncItem.id}`);

    // Check if record already exists (for update)
    let existingRecord = null;
    if (record._id) {
      existingRecord = await MedicalRecord.findById(record._id);
    }

    if (existingRecord) {
      // Update existing record
      await MedicalRecord.findByIdAndUpdate(record._id, {
        encryptedData: record.encryptedData,
        metadata: record.metadata,
        'syncStatus.synced': true,
        'syncStatus.lastSyncAttempt': new Date(),
        'syncStatus.syncAttempts': existingRecord.syncStatus.syncAttempts + 1
      });
    } else {
      // Create new record
      const medicalRecord = new MedicalRecord({
        soldierId: record.soldierId,
        encryptedData: record.encryptedData,
        metadata: record.metadata,
        syncStatus: {
          synced: true,
          syncAttempts: 1,
          lastSyncAttempt: new Date(),
          syncPriority: syncItem.priority
        }
      });

      await medicalRecord.save();
    }

    syncItem.status = 'synced';
    syncItem.lastAttempt = new Date();

    console.log(`✅ Successfully synced record: ${syncItem.id}`);
  }

  // Handle sync failure
  async handleSyncFailure(syncItem, error) {
    console.error(`💥 Permanent sync failure for item ${syncItem.id}:`, error);
    
    syncItem.status = 'failed';
    syncItem.error = error.message;
    syncItem.lastAttempt = new Date();

    // In production, you might want to:
    // 1. Send alert to administrators
    // 2. Store failed items for manual intervention
    // 3. Notify the user

    // For now, we'll just log the failure
    await this.logSyncFailure(syncItem);
  }

  // Log sync failures for monitoring
  async logSyncFailure(syncItem) {
    const failureLog = {
      syncItemId: syncItem.id,
      recordId: syncItem.record._id,
      soldierId: syncItem.record.soldierId,
      timestamp: new Date(),
      error: syncItem.error,
      attempts: syncItem.attempts,
      priority: syncItem.priority
    };

    // In production, save to a separate failures collection
    console.error('📝 Sync failure logged:', failureLog);
  }

  // Get sync status and statistics
  getSyncStatus() {
    const status = {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      queuePriorities: this.getQueuePriorityBreakdown(),
      lastSync: this.getLastSyncTime(),
      statistics: this.getSyncStatistics()
    };

    return status;
  }

  getQueuePriorityBreakdown() {
    const breakdown = { 1: 0, 2: 0, 3: 0 };
    
    this.syncQueue.forEach(item => {
      breakdown[item.priority] = (breakdown[item.priority] || 0) + 1;
    });
    
    return breakdown;
  }

  getLastSyncTime() {
    if (this.syncQueue.length === 0) return null;
    
    return this.syncQueue
      .filter(item => item.status === 'synced')
      .sort((a, b) => new Date(b.lastAttempt) - new Date(a.lastAttempt))[0]?.lastAttempt;
  }

  getSyncStatistics() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    // This would query actual database in production
    return {
      totalSynced: 'N/A', // Would be from database
      syncSuccessRate: 'N/A',
      averageSyncTime: 'N/A',
      failuresLastHour: 'N/A'
    };
  }

  // Manual sync trigger
  async forceSync() {
    console.log('🔄 Manual sync triggered');
    await this.processSyncBatch();
  }

  // Clear sync queue (for emergency situations)
  clearQueue() {
    const queueSize = this.syncQueue.length;
    this.syncQueue = [];
    console.log(`🧹 Cleared sync queue: ${queueSize} items removed`);
  }

  // Generate unique sync ID
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Emergency mode - prioritize all items
  activateEmergencySync() {
    console.log('🚨 Emergency sync mode activated');
    
    // Increase priority of all items
    this.syncQueue.forEach(item => {
      item.priority = 1;
    });
    
    // Sort by priority
    this.syncQueue.sort((a, b) => a.priority - b.priority);
    
    // Process immediately
    this.processSyncBatch();
  }
}

// Create singleton instance
const syncManager = new SyncManager();

export default syncManager;