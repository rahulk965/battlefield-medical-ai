import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  soldierId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  encryptedData: {
    type: String,
    required: true
  },
  metadata: {
    triageLevel: {
      type: String,
      enum: ['IMMEDIATE', 'DELAYED', 'MINOR', 'EXPECTANT'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    location: {
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      },
      accuracy: Number,
      timestamp: Date
    },
    deviceInfo: {
      userAgent: String,
      batteryLevel: Number,
      networkType: String,
      offline: {
        type: Boolean,
        default: false
      }
    }
  },
  syncStatus: {
    synced: {
      type: Boolean,
      default: false,
      index: true
    },
    syncAttempts: {
      type: Number,
      default: 0
    },
    lastSyncAttempt: Date,
    syncPriority: {
      type: Number,
      default: 3,
      min: 1,
      max: 3
    },
    syncError: String
  },
  auditTrail: [{
    action: {
      type: String,
      enum: ['CREATED', 'UPDATED', 'SYNCED', 'VIEWED', 'EMERGENCY_ACCESS']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    deviceId: String,
    location: {
      coordinates: [Number],
      accuracy: Number
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
medicalRecordSchema.index({ 'metadata.triageLevel': 1, 'metadata.timestamp': -1 });
medicalRecordSchema.index({ soldierId: 1, 'metadata.timestamp': -1 });
medicalRecordSchema.index({ 'syncStatus.synced': 1, 'syncStatus.syncPriority': 1 });

// Virtual for emergency records
medicalRecordSchema.virtual('isEmergency').get(function() {
  return this.metadata.triageLevel === 'IMMEDIATE';
});

// Methods
medicalRecordSchema.methods.addAuditEntry = function(action, deviceId, location) {
  this.auditTrail.push({
    action,
    deviceId,
    location,
    timestamp: new Date()
  });
};

medicalRecordSchema.methods.markSynced = function() {
  this.syncStatus.synced = true;
  this.syncStatus.lastSyncAttempt = new Date();
  this.addAuditEntry('SYNCED', 'system');
};

medicalRecordSchema.methods.markSyncFailed = function(error) {
  this.syncStatus.syncAttempts += 1;
  this.syncStatus.lastSyncAttempt = new Date();
  this.syncStatus.syncError = error.message;
};

// Static methods
medicalRecordSchema.statics.findBySoldierId = function(soldierId, options = {}) {
  const query = this.find({ soldierId });
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  if (options.sort) {
    query.sort(options.sort);
  }
  
  return query;
};

medicalRecordSchema.statics.findEmergencyRecords = function(hours = 24) {
  const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
  
  return this.find({
    'metadata.triageLevel': 'IMMEDIATE',
    'metadata.timestamp': { $gte: cutoffTime }
  }).sort({ 'metadata.timestamp': -1 });
};

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;