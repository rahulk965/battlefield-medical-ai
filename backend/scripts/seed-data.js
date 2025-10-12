import { connectDatabase } from '../config/database.js';
import MedicalRecord from '../models/MedicalRecord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedData = async () => {
  try {
    await connectDatabase();
    console.log('🌱 Seeding demo medical records...');

    const demoRecords = [
      {
        soldierId: 'soldier-001',
        encryptedData: 'demo-encrypted-data-1',
        metadata: {
          triageLevel: 'IMMEDIATE',
          timestamp: new Date('2024-01-15T08:30:00Z'),
          location: {
            coordinates: [34.0522, -118.2437],
            accuracy: 50
          },
          deviceInfo: {
            userAgent: 'Demo Device 1',
            batteryLevel: 85,
            networkType: 'wifi',
            offline: false
          }
        },
        syncStatus: {
          synced: true,
          syncAttempts: 1,
          lastSyncAttempt: new Date('2024-01-15T08:35:00Z'),
          syncPriority: 1
        }
      },
      {
        soldierId: 'soldier-002', 
        encryptedData: 'demo-encrypted-data-2',
        metadata: {
          triageLevel: 'DELAYED',
          timestamp: new Date('2024-01-15T09:15:00Z'),
          location: {
            coordinates: [34.0522, -118.2437],
            accuracy: 75
          },
          deviceInfo: {
            userAgent: 'Demo Device 2',
            batteryLevel: 45,
            networkType: 'cellular',
            offline: true
          }
        },
        syncStatus: {
          synced: false,
          syncAttempts: 2,
          lastSyncAttempt: new Date('2024-01-15T09:20:00Z'),
          syncPriority: 2
        }
      }
    ];

    await MedicalRecord.deleteMany({});
    await MedicalRecord.insertMany(demoRecords);

    console.log('✅ Demo data seeded successfully');
    console.log(`📊 Created ${demoRecords.length} medical records`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();