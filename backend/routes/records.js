import express from 'express';
import MedicalRecord from '../models/MedicalRecord.js';
import MilitaryAuth from '../middleware/auth.js';
import EncryptionService from '../services/ai/storage/EncryptionService.js';

const router = express.Router();
const encryptionService = new EncryptionService();

// Save medical record
router.post('/save', MilitaryAuth.authenticate, async (req, res) => {
  try {
    const { encryptedData, metadata, syncInfo } = req.body;
    const soldierId = req.soldier.soldierId;

    if (!encryptedData) {
      return res.status(400).json({
        success: false,
        error: 'Encrypted medical data is required'
      });
    }

    console.log(`💾 Saving medical record for soldier ${soldierId}`);

    const medicalRecord = new MedicalRecord({
      soldierId,
      encryptedData,
      metadata: metadata || {},
      syncStatus: syncInfo || {
        synced: true,
        syncAttempts: 0,
        syncPriority: 3
      }
    });

    // Add audit entry
    medicalRecord.addAuditEntry('CREATED', req.headers['x-device-fingerprint'] || 'unknown');

    await medicalRecord.save();

    res.json({
      success: true,
      data: {
        recordId: medicalRecord._id,
        soldierId: medicalRecord.soldierId,
        timestamp: medicalRecord.metadata.timestamp,
        triageLevel: medicalRecord.metadata.triageLevel,
        synced: medicalRecord.syncStatus.synced
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Save medical record error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save medical record',
      offlineFallback: true,
      timestamp: new Date()
    });
  }
});

// Get soldier's medical records
router.get('/soldier/:soldierId', MilitaryAuth.authenticate, async (req, res) => {
  try {
    const { soldierId } = req.params;
    const requestingSoldierId = req.soldier.soldierId;

    // Check permissions - soldiers can only view their own records
    // Medics and officers can view others
    if (soldierId !== requestingSoldierId) {
      try {
        MilitaryAuth.verifyPermissions(req, 'medic:read');
      } catch {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to view other soldier records'
        });
      }
    }

    const { limit = 50, offset = 0, sort = 'newest' } = req.query;

    const records = await MedicalRecord.findBySoldierId(soldierId, {
      limit: parseInt(limit),
      sort: sort === 'newest' ? { 'metadata.timestamp': -1 } : { 'metadata.timestamp': 1 }
    }).skip(parseInt(offset));

    // Add audit entry for access
    if (records.length > 0) {
      await MedicalRecord.findByIdAndUpdate(records[0]._id, {
        $push: {
          auditTrail: {
            action: 'VIEWED',
            deviceId: req.headers['x-device-fingerprint'] || 'unknown',
            timestamp: new Date()
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        soldierId,
        records,
        total: records.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve medical records',
      timestamp: new Date()
    });
  }
});

// Sync pending records (for offline-first sync)
router.post('/sync', MilitaryAuth.authenticate, async (req, res) => {
  try {
    const { pendingRecords } = req.body;
    const soldierId = req.soldier.soldierId;

    if (!Array.isArray(pendingRecords)) {
      return res.status(400).json({
        success: false,
        error: 'Pending records array is required'
      });
    }

    console.log(`🔄 Syncing ${pendingRecords.length} records for soldier ${soldierId}`);

    const syncResults = {
      successful: [],
      failed: [],
      total: pendingRecords.length
    };

    for (const record of pendingRecords) {
      try {
        const medicalRecord = new MedicalRecord({
          soldierId,
          encryptedData: record.encryptedData,
          metadata: record.metadata,
          syncStatus: {
            synced: true,
            syncAttempts: 0,
            lastSyncAttempt: new Date(),
            syncPriority: record.syncPriority || 3
          }
        });

        await medicalRecord.save();
        medicalRecord.markSynced();

        syncResults.successful.push({
          localId: record.localId,
          cloudId: medicalRecord._id,
          timestamp: medicalRecord.metadata.timestamp
        });

      } catch (error) {
        console.error(`Failed to sync record ${record.localId}:`, error);
        syncResults.failed.push({
          localId: record.localId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: syncResults,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Sync records error:', error);
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      offlineFallback: true,
      timestamp: new Date()
    });
  }
});

// Get emergency records (for medics and officers)
router.get('/emergency/recent', MilitaryAuth.authenticate, async (req, res) => {
  try {
    MilitaryAuth.verifyPermissions(req, 'medic:read');

    const { hours = 24, limit = 20 } = req.query;

    const emergencyRecords = await MedicalRecord.findEmergencyRecords(parseInt(hours))
      .limit(parseInt(limit))
      .sort({ 'metadata.timestamp': -1 });

    console.log(`🚨 Retrieved ${emergencyRecords.length} emergency records from last ${hours} hours`);

    res.json({
      success: true,
      data: {
        records: emergencyRecords,
        timeframe: `${hours} hours`,
        total: emergencyRecords.length
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Get emergency records error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve emergency records',
      timestamp: new Date()
    });
  }
});

// Search medical records
router.get('/search', MilitaryAuth.authenticate, async (req, res) => {
  try {
    const { soldierId, triageLevel, startDate, endDate, unit } = req.query;
    
    MilitaryAuth.verifyPermissions(req, 'medic:read');

    let query = {};

    if (soldierId) {
      query.soldierId = soldierId;
    }

    if (triageLevel) {
      query['metadata.triageLevel'] = triageLevel;
    }

    if (startDate || endDate) {
      query['metadata.timestamp'] = {};
      if (startDate) query['metadata.timestamp'].$gte = new Date(startDate);
      if (endDate) query['metadata.timestamp'].$lte = new Date(endDate);
    }

    // Note: In production, you'd have a unit field to query by unit
    const records = await MedicalRecord.find(query)
      .sort({ 'metadata.timestamp': -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        records,
        total: records.length,
        query: {
          soldierId,
          triageLevel,
          startDate,
          endDate,
          unit
        }
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Search medical records error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      timestamp: new Date()
    });
  }
});

// Get sync status
router.get('/sync-status', MilitaryAuth.authenticate, async (req, res) => {
  try {
    const soldierId = req.soldier.soldierId;

    const stats = await MedicalRecord.aggregate([
      { $match: { soldierId } },
      {
        $group: {
          _id: '$syncStatus.synced',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRecords = await MedicalRecord.countDocuments({ soldierId });
    const syncedRecords = stats.find(stat => stat._id === true)?.count || 0;
    const unsyncedRecords = totalRecords - syncedRecords;

    res.json({
      success: true,
      data: {
        soldierId,
        totalRecords,
        syncedRecords,
        unsyncedRecords,
        syncPercentage: totalRecords > 0 ? Math.round((syncedRecords / totalRecords) * 100) : 0,
        lastSync: new Date()
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      timestamp: new Date()
    });
  }
});

export default router;