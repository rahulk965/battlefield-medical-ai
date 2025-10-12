import React, { useState, useEffect } from 'react';
import { useMedical } from '../../contexts/MedicalContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import TriageIndicator from '../UI/TriageIndicator';
import { 
  Download, 
  Upload, 
  Filter, 
  Search, 
  Calendar,
  AlertTriangle,
  User,
  MapPin,
  Clock
} from 'lucide-react';

const RecordsDashboard = () => {
  const { medicalRecords, isLoading, stats, refreshData } = useMedical();
  const { soldier } = useAuth();
  const { getSyncStats, forceSync } = useOfflineSync();
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const syncStats = getSyncStats();

  useEffect(() => {
    refreshData();
  }, []);

  // Filter and search records
  const filteredRecords = medicalRecords.filter(record => {
    const matchesFilter = filter === 'all' || record.analysis?.triageLevel === filter;
    const matchesSearch = !searchTerm || 
      record.soldierId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.analysis?.primaryDiagnosis?.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatsByTriage = () => {
    const counts = {
      IMMEDIATE: 0,
      DELAYED: 0,
      MINOR: 0,
      EXPECTANT: 0
    };

    medicalRecords.forEach(record => {
      const triage = record.analysis?.triageLevel;
      if (triage && counts.hasOwnProperty(triage)) {
        counts[triage]++;
      }
    });

    return counts;
  };

  const exportRecords = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      soldier: soldier,
      records: filteredRecords,
      stats: {
        total: filteredRecords.length,
        byTriage: getStatsByTriage()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-records-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triageStats = getStatsByTriage();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading medical records...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Medical Records Dashboard</h1>
          <p className="text-gray-400">
            {soldier ? `Viewing records for ${soldier.rank} ${soldier.soldierId}` : 'Emergency Access Mode'}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Records</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-lg">
                <User size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Critical Cases</p>
                <p className="text-2xl font-bold text-red-400">{stats.immediateCases}</p>
              </div>
              <div className="bg-red-600 p-3 rounded-lg">
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Synced Records</p>
                <p className="text-2xl font-bold text-green-400">{stats.syncedRecords}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-lg">
                <Upload size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Sync</p>
                <p className="text-2xl font-bold text-yellow-400">{syncStats.queuedRecords.length}</p>
              </div>
              <div className="bg-yellow-600 p-3 rounded-lg">
                <Clock size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Triage Breakdown */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Triage Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(triageStats).map(([level, count]) => (
              <div key={level} className="text-center">
                <TriageIndicator level={level} size="small" />
                <p className="text-2xl font-bold mt-2">{count}</p>
                <p className="text-gray-400 text-sm">cases</p>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Triage Levels</option>
                <option value="IMMEDIATE">Immediate</option>
                <option value="DELAYED">Delayed</option>
                <option value="MINOR">Minor</option>
                <option value="EXPECTANT">Expectant</option>
              </select>
            </div>

            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400'
                  }`}
                >
                  Grid
                </button>
              </div>

              {/* Sync Button */}
              <button
                onClick={forceSync}
                disabled={syncStats.queuedRecords.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} />
                Sync ({syncStats.queuedRecords.length})
              </button>

              {/* Export Button */}
              <button
                onClick={exportRecords}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Records List/Grid */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Medical Records ({filteredRecords.length})
            </h2>
            <p className="text-gray-400 text-sm">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>No medical records found</p>
              <p className="text-sm">Records will appear here after medical assessments</p>
            </div>
          ) : viewMode === 'list' ? (
            /* List View */
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div
                  key={record.id || record._id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <TriageIndicator level={record.analysis?.triageLevel} size="small" />
                      <div>
                        <p className="font-semibold">
                          {record.analysis?.primaryDiagnosis?.diagnosis || 'Unknown Diagnosis'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Soldier: {record.soldierId} • 
                          Confidence: {Math.round((record.analysis?.confidence || 0) * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map((record) => (
                <div
                  key={record.id || record._id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <TriageIndicator level={record.analysis?.triageLevel} size="small" />
                    <span className="text-xs text-gray-400">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold mb-2">
                    {record.analysis?.primaryDiagnosis?.diagnosis || 'Unknown Diagnosis'}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-3">
                    {record.analysis?.firstAidSteps?.[0] || 'No first aid steps recorded'}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Soldier: {record.soldierId}</span>
                    <span>{Math.round((record.analysis?.confidence || 0) * 100)}% conf.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Medical Record Details</h2>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Soldier ID</p>
                      <p>{selectedRecord.soldierId}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Timestamp</p>
                      <p>{new Date(selectedRecord.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Triage Level</p>
                      <TriageIndicator level={selectedRecord.analysis?.triageLevel} />
                    </div>
                    <div>
                      <p className="text-gray-400">Confidence</p>
                      <p>{Math.round((selectedRecord.analysis?.confidence || 0) * 100)}%</p>
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                {selectedRecord.analysis?.primaryDiagnosis && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Diagnosis</h3>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="font-semibold">
                        {selectedRecord.analysis.primaryDiagnosis.diagnosis}
                      </p>
                      {selectedRecord.analysis.primaryDiagnosis.confidence && (
                        <p className="text-gray-400 text-sm mt-1">
                          Confidence: {Math.round(selectedRecord.analysis.primaryDiagnosis.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* First Aid Steps */}
                {selectedRecord.analysis?.firstAidSteps && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">First Aid Instructions</h3>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <ol className="list-decimal list-inside space-y-2">
                        {selectedRecord.analysis.firstAidSteps.map((step, index) => (
                          <li key={index} className="text-sm">{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {/* Emergency Actions */}
                {selectedRecord.analysis?.emergencyActions && selectedRecord.analysis.emergencyActions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-400">Emergency Actions</h3>
                    <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
                      <ul className="space-y-2">
                        {selectedRecord.analysis.emergencyActions.map((action, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Military Context */}
                {selectedRecord.analysis?.militaryContext && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Military Context</h3>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Combat Related</p>
                          <p>{selectedRecord.analysis.militaryContext.combatRelated ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Evacuation Priority</p>
                          <p>{selectedRecord.analysis.militaryContext.evacuationPriority}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsDashboard;