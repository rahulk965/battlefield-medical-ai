import React, { useState } from 'react';
import { Send, AlertTriangle, Clock } from 'lucide-react';

const TextInput = ({ onAnalysis, disabled }) => {
  const [symptoms, setSymptoms] = useState('');
  const [vitalSigns, setVitalSigns] = useState({
    heartRate: '',
    respiratoryRate: '',
    bloodPressure: '',
    oxygenSaturation: ''
  });

  const handleSubmit = () => {
    if (symptoms.trim()) {
      const analysisData = {
        symptoms: symptoms.trim(),
        vitalSigns: Object.fromEntries(
          Object.entries(vitalSigns).filter(([_, value]) => value.trim())
        )
      };
      onAnalysis(analysisData);
      setSymptoms('');
      setVitalSigns({
        heartRate: '',
        respiratoryRate: '',
        bloodPressure: '',
        oxygenSaturation: ''
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertQuickSymptom = (symptom) => {
    setSymptoms(prev => prev ? `${prev}, ${symptom}` : symptom);
  };

  const quickSymptoms = [
    'bleeding', 'pain', 'unconscious', 'difficulty breathing',
    'burn', 'fracture', 'gunshot wound', 'shrapnel injury'
  ];

  return (
    <div className="space-y-4">
      {/* Quick Symptoms */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quick Symptoms
        </label>
        <div className="flex flex-wrap gap-2">
          {quickSymptoms.map((symptom) => (
            <button
              key={symptom}
              onClick={() => insertQuickSymptom(symptom)}
              disabled={disabled}
              className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded-full text-sm transition-colors disabled:opacity-50"
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>

      {/* Symptoms Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Describe Symptoms & Injuries *
        </label>
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe the medical situation in detail. Include symptoms, mechanism of injury, location of pain, and any other relevant information..."
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
          rows="4"
          disabled={disabled}
        />
      </div>

      {/* Vital Signs */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Vital Signs (Optional)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Heart Rate</label>
            <input
              type="number"
              value={vitalSigns.heartRate}
              onChange={(e) => setVitalSigns(prev => ({ ...prev, heartRate: e.target.value }))}
              placeholder="bpm"
              className="w-full bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Respiratory Rate</label>
            <input
              type="number"
              value={vitalSigns.respiratoryRate}
              onChange={(e) => setVitalSigns(prev => ({ ...prev, respiratoryRate: e.target.value }))}
              placeholder="breaths/min"
              className="w-full bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Blood Pressure</label>
            <input
              type="text"
              value={vitalSigns.bloodPressure}
              onChange={(e) => setVitalSigns(prev => ({ ...prev, bloodPressure: e.target.value }))}
              placeholder="120/80"
              className="w-full bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Oxygen Saturation</label>
            <input
              type="number"
              value={vitalSigns.oxygenSaturation}
              onChange={(e) => setVitalSigns(prev => ({ ...prev, oxygenSaturation: e.target.value }))}
              placeholder="%"
              min="0"
              max="100"
              className="w-full bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Emergency Guidelines */}
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <AlertTriangle size={16} className="text-red-400 mt-0.5" />
          <div className="text-red-200 text-sm">
            <p className="font-semibold">EMERGENCY SYMPTOMS - SEEK IMMEDIATE HELP:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Unconsciousness or unresponsiveness</li>
              <li>Severe bleeding that won't stop</li>
              <li>Difficulty breathing or choking</li>
              <li>Chest pain or pressure</li>
              <li>Severe burns or traumatic injuries</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!symptoms.trim() || disabled}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
      >
        <Send size={18} />
        <span>ANALYZE MEDICAL SITUATION</span>
      </button>

      {/* Timestamp */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-1 text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
          <Clock size={12} />
          <span>System Time: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default TextInput;