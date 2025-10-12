import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { MedicalProvider } from './contexts/MedicalContext';
import { EmergencyProvider } from './contexts/EmergencyContext';
import EmergencyChatbot from './components/UI/Chatbot/EmergencyChatbot';
import SyncStatus from './components/UI/SyncStatus';
import EmergencyAlert from './components/UI/EmergencyAlert';

function App() {
  return (
    <AuthProvider>
      <MedicalProvider>
        <EmergencyProvider>
          <div className="min-h-screen bg-military-dark text-white relative">
            {/* Emergency Overlay */}
            <EmergencyAlert />
            
            {/* Sync Status Indicator */}
            <SyncStatus />
            
            {/* Main Application */}
            <div className="container mx-auto px-4 py-6">
              <EmergencyChatbot />
            </div>
            
            {/* Offline Indicator */}
            <div className="offline-indicator hidden fixed bottom-4 right-4 bg-red-600 px-4 py-2 rounded-lg shadow-lg">
              ⚠️ Offline Mode Active
            </div>
          </div>
        </EmergencyProvider>
      </MedicalProvider>
    </AuthProvider>
  );
}

export default App;