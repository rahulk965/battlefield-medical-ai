import { openDB } from 'idb';

class BattlefieldMedicalDB {
  constructor() {
    this.dbName = 'BattlefieldMedical';
    this.version = 4;
    this.db = null;
  }

  async init() {
    try {
      this.db = await openDB(this.dbName, this.version, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

          // Version 1: Initial schema
          if (oldVersion < 1) {
            const recordsStore = db.createObjectStore('medical_records', {
              keyPath: 'id',
              autoIncrement: true
            });
            
            recordsStore.createIndex('soldierId', 'soldierId');
            recordsStore.createIndex('timestamp', 'timestamp');
            recordsStore.createIndex('triageLevel', 'triageLevel');
            recordsStore.createIndex('synced', 'synced');
            recordsStore.createIndex('syncPriority', 'syncPriority');
            recordsStore.createIndex('emergencyMode', 'emergencyMode');
          }

          // Version 2: Add symptoms cache
          if (oldVersion < 2) {
            const symptomsStore = db.createObjectStore('symptoms_cache', {
              keyPath: 'id'
            });
            symptomsStore.createIndex('timestamp', 'timestamp');
          }

          // Version 3: Add emergency protocols
          if (oldVersion < 3) {
            const protocolsStore = db.createObjectStore('emergency_protocols', {
              keyPath: 'id'
            });
          }

          // Version 4: Add sync queue
          if (oldVersion < 4) {
            const syncStore = db.createObjectStore('sync_queue', {
              keyPath: 'id',
              autoIncrement: true
            });
            syncStore.createIndex('priority', 'priority');
            syncStore.createIndex('timestamp', 'timestamp');
          }
        },
      });

      console.log('✅ Battlefield Medical Database initialized');
      return this.db;
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  // Medical Records Management
  async saveMedicalRecord(record) {
    try {
      const db = await this.init();
      const priority = this.calculateSyncPriority(record);
      
      const recordWithMetadata = {
        ...record,
        encrypted: await this.encryptRecord(record),
        synced: false,
        syncAttempts: 0,
        syncPriority: priority,
        lastSyncAttempt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const id = await db.add('medical_records', recordWithMetadata);
      console.log(`💾 Saved medical record ${id} locally`);
      
      // Also add to sync queue
      await this.addToSyncQueue('medical_record', id, priority);
      
      return id;
    } catch (error) {
      console.error('Failed to save medical record:', error);
      throw error;
    }
  }

  async getMedicalRecords(soldierId, options = {}) {
    try {
      const db = await this.init();
      let transaction = db.transaction('medical_records', 'readonly');
      let store = transaction.objectStore('medical_records');
      
      let index = store.index('soldierId');
      let records = await index.getAll(soldierId);
      
      // Apply filters
      if (options.limit) {
        records = records.slice(0, options.limit);
      }
      
      if (options.sort === 'newest') {
        records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      
      // Decrypt records
      const decryptedRecords = await Promise.all(
        records.map(async record => ({
          ...record,
          data: await this.decryptRecord(record.encrypted)
        }))
      );
      
      return decryptedRecords;
    } catch (error) {
      console.error('Failed to get medical records:', error);
      return [];
    }
  }

  // Sync Management
  async addToSyncQueue(type, recordId, priority = 3) {
    try {
      const db = await this.init();
      await db.add('sync_queue', {
        type,
        recordId,
        priority,
        timestamp: new Date(),
        attempts: 0,
        lastAttempt: null
      });
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  async getPendingSyncItems(limit = 10) {
    try {
      const db = await this.init();
      const transaction = db.transaction('sync_queue', 'readonly');
      const store = transaction.objectStore('sync_queue');
      const index = store.index('priority');
      
      let items = await index.getAll();
      
      // Sort by priority and timestamp
      items.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
      
      return items.slice(0, limit);
    } catch (error) {
      console.error('Failed to get pending sync items:', error);
      return [];
    }
  }

  async markAsSynced(recordId) {
    try {
      const db = await this.init();
      
      // Update medical record
      const record = await db.get('medical_records', recordId);
      if (record) {
        record.synced = true;
        record.updatedAt = new Date();
        await db.put('medical_records', record);
      }
      
      // Remove from sync queue
      const transaction = db.transaction('sync_queue', 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const queueItems = await store.index('recordId').getAll(recordId);
      
      await Promise.all(queueItems.map(item => store.delete(item.id)));
      
      console.log(`✅ Marked record ${recordId} as synced`);
    } catch (error) {
      console.error('Failed to mark as synced:', error);
    }
  }

  // Symptoms Cache
  async cacheSymptomAnalysis(symptoms, analysis) {
    try {
      const db = await this.init();
      const cacheKey = this.generateCacheKey(symptoms);
      
      await db.put('symptoms_cache', {
        id: cacheKey,
        symptoms,
        analysis,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to cache symptom analysis:', error);
    }
  }

  async getCachedAnalysis(symptoms) {
    try {
      const db = await this.init();
      const cacheKey = this.generateCacheKey(symptoms);
      const cached = await db.get('symptoms_cache', cacheKey);
      
      // Check if cache is still valid (1 hour)
      if (cached && (Date.now() - new Date(cached.timestamp).getTime()) < 60 * 60 * 1000) {
        return cached.analysis;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached analysis:', error);
      return null;
    }
  }

  // Emergency Protocols
  async saveEmergencyProtocols(protocols) {
    try {
      const db = await this.init();
      
      for (const [id, protocol] of Object.entries(protocols)) {
        await db.put('emergency_protocols', {
          id,
          ...protocol,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to save emergency protocols:', error);
    }
  }

  async getEmergencyProtocol(protocolId) {
    try {
      const db = await this.init();
      return await db.get('emergency_protocols', protocolId);
    } catch (error) {
      console.error('Failed to get emergency protocol:', error);
      return null;
    }
  }

  // Utility Methods
  calculateSyncPriority(record) {
    if (record.triageLevel === 'IMMEDIATE') return 1;
    if (record.emergencyActions && record.emergencyActions.length > 0) return 1;
    if (record.triageLevel === 'DELAYED') return 2;
    return 3;
  }

  generateCacheKey(symptoms) {
    const symptomString = Array.isArray(symptoms) ? symptoms.join(',') : symptoms;
    return btoa(symptomString).substring(0, 100);
  }

  async encryptRecord(record) {
    // In a real implementation, use proper encryption
    // For demo purposes, we'll use a simple obfuscation
    return btoa(JSON.stringify(record));
  }

  async decryptRecord(encrypted) {
    try {
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.error('Failed to decrypt record:', error);
      return { error: 'Decryption failed' };
    }
  }

  // Database Maintenance
  async clearOldCache(hours = 24) {
    try {
      const db = await this.init();
      const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      // Clear old cache entries
      const transaction = db.transaction('symptoms_cache', 'readwrite');
      const store = transaction.objectStore('symptoms_cache');
      const index = store.index('timestamp');
      
      const oldEntries = await index.getAll(IDBKeyRange.upperBound(cutoff));
      await Promise.all(oldEntries.map(entry => store.delete(entry.id)));
      
      console.log(`🧹 Cleared ${oldEntries.length} old cache entries`);
    } catch (error) {
      console.error('Failed to clear old cache:', error);
    }
  }

  async getDatabaseSize() {
    try {
      const db = await this.init();
      const stores = ['medical_records', 'symptoms_cache', 'emergency_protocols', 'sync_queue'];
      let totalSize = 0;

      for (const storeName of stores) {
        const store = db.transaction(storeName).objectStore(storeName);
        const count = await store.count();
        totalSize += count;
      }

      return {
        totalRecords: totalSize,
        stores: stores.reduce(async (acc, storeName) => {
          const store = db.transaction(storeName).objectStore(storeName);
          const count = await store.count();
          acc[storeName] = count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Failed to get database size:', error);
      return { totalRecords: 0, stores: {} };
    }
  }
}

// Create singleton instance
const battlefieldDB = new BattlefieldMedicalDB();

export default battlefieldDB;