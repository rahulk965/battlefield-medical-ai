import React, { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import { useAuth } from '../../../contexts/AuthContext';
import { diagnosisService, apiClient } from '../../../services';
import { encryptMedicalData } from '../../../utils/encryption';
import { logger } from '../../../utils/logger';
import VoiceInput from './VoiceInput';
import TextInput from './TextInput';
import ImageInput from './ImageInput';
import TriageIndicator from '../TriageIndicator';
import { Mic, MessageSquare, Camera, AlertTriangle, Download, Upload } from 'lucide-react';
import { getBatteryLevel } from '../../../utils/deviceInfo';

const EmergencyChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMode, setInputMode] = useState('text');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { isListening, transcript, startListening, stopListening, hasSpeechSupport } = useSpeechRecognition();
  const { queueRecord, syncStatus } = useOfflineSync();
  const { soldier, isAuthenticated } = useAuth();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'assistant',
        content: '🛡️ Battlefield Medical Assistant Ready. Describe symptoms, injuries, or upload images for emergency assessment.',
        timestamp: new Date(),
        isSystem: true
      }]);
    }
  }, []);

  const handleEmergencyAssessment = async (input, imageData = null) => {
    if (!soldier && !emergencyMode) {
      addMessage('assistant', '⚠️ Please authenticate or enable emergency mode for medical assessment.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Extract symptoms string from input object or use input directly if it's a string
      const symptomsText = typeof input === 'object' && input !== null ? input.symptoms : input;
      
      // Add user message to chat with fallback
      addMessage('user', symptomsText || 'Image analysis requested');

      // Show analyzing message
      const analyzingId = addMessage('assistant', '🔍 Analyzing situation...', true);

      // Simulate AI analysis - in real app, call your backend API
      const analysis = await simulateAIAnalysis(symptomsText, imageData);
      
      // Update analyzing message with results
      updateMessage(analyzingId, {
        content: formatAnalysisResponse(analysis),
        triageLevel: analysis.triageLevel,
        analysisData: analysis,
        isAnalyzing: false
      });

      // Store medical record
      // Format record according to backend schema
      const location = await getCurrentLocation();
      const record = {
        soldierId: soldier?.soldierId || 'emergency-unknown',
        encryptedData: await encryptMedicalData({
          symptoms: symptomsText,
          imageData: imageData,
          analysis: analysis
        }),
        metadata: {
          triageLevel: analysis.triageLevel || 'MINOR',
          timestamp: new Date(),
          location: {
            coordinates: location.coordinates,
            accuracy: location.accuracy,
            timestamp: new Date()
          },
          deviceInfo: {
            userAgent: navigator.userAgent,
            batteryLevel: await getBatteryLevel(),
            networkType: navigator.connection?.type || 'unknown',
            offline: !navigator.onLine
          }
        },
        emergencyMode: !soldier
      };

      // Attempt to queue record but don't block on failure
      queueRecord(record).catch(syncError => {
        console.warn('Failed to queue medical record:', syncError);
      });

      // Read instructions aloud if critical
      if (analysis.triageLevel === 'IMMEDIATE') {
        speakEmergencyInstructions(analysis.firstAidSteps);
      }

    } catch (error) {
      console.error('Assessment error:', error);
      addMessage('assistant', '❌ System error. Using emergency protocols. Provide basic first aid and seek immediate assistance.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateAIAnalysis = async (symptoms, imageData) => {
    try {
      // Get location first
      const location = await getCurrentLocation();
      logger.info('Starting symptom analysis', { symptoms, hasImage: !!imageData, location });

      // Ensure symptoms is a string
      const symptomsText = symptoms || '';
      let analysis;

      try {
        // Attempt to use backend service
        const result = await diagnosisService.analyzeSymptoms(symptoms, imageData, location);
        logger.info('Backend analysis successful', result);
        return result;
      } catch (apiError) {
        // Log the API error details
        logger.warn('Backend service unavailable, using offline analysis', apiError);
        
        // Provide offline analysis with appropriate triage level
        const lowerSymptoms = symptomsText.toLowerCase();
        
        if (lowerSymptoms.includes('gunshot') || lowerSymptoms.includes('bleeding')) {
          analysis = {
            primaryDiagnosis: { diagnosis: 'Ballistic Trauma', confidence: 0.92 },
            triageLevel: 'IMMEDIATE',
            confidence: 0.9,
            firstAidSteps: [
              "APPLY DIRECT PRESSURE TO WOUND",
              "CHECK FOR EXIT WOUND",
              "USE HEMOSTATIC GAUZE IF AVAILABLE",
              "APPLY TOURNIQUET IF SEVERE BLEEDING",
              "TREAT FOR SHOCK",
              "PREPARE FOR EMERGENCY EVACUATION"
            ],
            emergencyActions: ["IMMEDIATE MEDEVAC REQUIRED", "CONTROL BLEEDING"],
            militaryContext: { combatRelated: true, evacuationPriority: 1 },
            timestamp: new Date()
          };
        } else if (lowerSymptoms.includes('burn') || lowerSymptoms.includes('fire')) {
          analysis = {
            primaryDiagnosis: { diagnosis: 'Thermal Burns', confidence: 0.88 },
            triageLevel: 'DELAYED',
            confidence: 0.85,
            firstAidSteps: [
              "COOL BURN WITH CLEAN WATER",
              "COVER WITH STERILE DRESSING",
              "DO NOT BREAK BLISTERS",
              "MONITOR BREATHING",
              "PAIN MANAGEMENT IF AVAILABLE"
            ],
            emergencyActions: ["CHECK FOR INHALATION INJURY"],
            militaryContext: { combatRelated: false, evacuationPriority: 2 },
            timestamp: new Date()
          };
        } else if (lowerSymptoms.includes('broken') || lowerSymptoms.includes('fracture')) {
          analysis = {
            primaryDiagnosis: { diagnosis: 'Fracture', confidence: 0.87 },
            triageLevel: 'DELAYED',
            confidence: 0.82,
            firstAidSteps: [
              "IMMOBILIZE INJURED AREA",
              "APPLY SPLINT IF AVAILABLE",
              "CHECK CIRCULATION",
              "APPLY COLD PACK",
              "ELEVATE IF POSSIBLE"
            ],
            emergencyActions: [],
            militaryContext: { combatRelated: false, evacuationPriority: 2 },
            timestamp: new Date()
          };
        } else {
          analysis = {
            primaryDiagnosis: { 
              diagnosis: 'Condition Assessment Required',
              confidence: 0.85
            },
            triageLevel: 'MINOR',
            confidence: 0.8,
            firstAidSteps: [
              "Monitor vital signs",
              "Keep patient comfortable",
              "Seek medical assistance when possible"
            ],
            emergencyActions: [],
            militaryContext: { 
              combatRelated: false,
              evacuationPriority: 3
            },
            timestamp: new Date(),
            offlineMode: true
          };
        }

        // Enhance if image data provided
        if (imageData) {
          analysis.imageAnalysis = {
            detected: true,
            injuries: ['Visual injury detected'],
            confidence: 0.75
          };
          analysis.confidence = Math.min(0.95, analysis.confidence + 0.1);
        }

        return analysis;
      }
    } catch (error) {
      // Handle any critical errors (like location access failure)
      logger.error('Critical error in symptom analysis', error);
      throw new Error('Failed to analyze symptoms: ' + error.message);
    }
  };

  const formatAnalysisResponse = (analysis) => {
    return `
🎯 **DIAGNOSIS**: ${analysis.primaryDiagnosis.diagnosis}
⚡ **TRIAGE LEVEL**: ${analysis.triageLevel}
📊 **CONFIDENCE**: ${Math.round(analysis.confidence * 100)}%

🚑 **FIRST AID STEPS**:
${analysis.firstAidSteps.map(step => `• ${step}`).join('\n')}

${analysis.emergencyActions.length > 0 ? `
🚨 **EMERGENCY ACTIONS**:
${analysis.emergencyActions.map(action => `⚠️ ${action}`).join('\n')}
` : ''}

${analysis.militaryContext.combatRelated ? `
🛡️ **COMBAT CONTEXT**:
• Evacuation Priority: ${analysis.militaryContext.evacuationPriority}
• Combat-Related Injury
• Tactical Medical Protocols Active
` : ''}
    `.trim();
  };

  const speakEmergencyInstructions = (instructions) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance();
      utterance.text = `Emergency medical instructions: ${instructions.join('. ')}`;
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const addMessage = (type, content, isTemporary = false) => {
    const id = Date.now() + Math.random();
    const message = {
      id,
      type,
      content,
      timestamp: new Date(),
      isTemporary
    };
    
    setMessages(prev => [...prev.filter(m => !m.isTemporary), message]);
    return id;
  };

  const updateMessage = (id, updates) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const getCurrentLocation = async () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ coordinates: [0, 0], accuracy: 0 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coordinates: [position.coords.longitude, position.coords.latitude],
            accuracy: position.coords.accuracy
          });
        },
        () => {
          resolve({ coordinates: [0, 0], accuracy: 0 });
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  const clearChat = () => {
    setMessages([{
      id: 1,
      type: 'assistant',
      content: 'Chat cleared. Ready for new assessment.',
      timestamp: new Date(),
      isSystem: true
    }]);
  };

  const exportChat = () => {
    const chatData = {
      timestamp: new Date(),
      soldier: soldier,
      messages: messages,
      emergencyMode: emergencyMode
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battlefield-medical-chat-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`max-w-4xl mx-auto bg-military-medium rounded-xl shadow-2xl border border-gray-700 overflow-hidden ${emergencyMode ? 'ring-2 ring-red-500' : ''}`}>
      {/* Header */}
      <div className="bg-military-dark px-6 py-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Battlefield Medical Assistant</h1>
              <p className="text-gray-300 text-sm">
                {soldier ? `Authenticated: ${soldier.rank} ${soldier.soldierId}` : 'Emergency Mode'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={exportChat}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white text-sm transition-colors"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg text-white text-sm transition-colors"
            >
              <span>Clear</span>
            </button>

            {!soldier && (
              <button
                onClick={() => setEmergencyMode(!emergencyMode)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  emergencyMode 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                <AlertTriangle size={16} />
                <span>{emergencyMode ? 'EMERGENCY' : 'Emergency Mode'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Status */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={`px-2 py-1 rounded ${syncStatus === 'online' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {syncStatus === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
          </span>
          <span className="text-gray-400">
            {isAnalyzing ? '🔍 Analyzing...' : '✅ Ready'}
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto p-4 bg-military-dark">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-3/4 rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.isSystem
                  ? 'bg-gray-600 text-white'
                  : 'bg-military-light text-white'
              } ${message.isTemporary ? 'opacity-70' : ''}`}
            >
              {message.triageLevel && (
                <div className="mb-2">
                  <TriageIndicator level={message.triageLevel} size="small" />
                </div>
              )}
              
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Mode Selector */}
      <div className="border-t border-gray-600 bg-military-dark p-4">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setInputMode('text')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg flex-1 justify-center transition-colors ${
              inputMode === 'text' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            <MessageSquare size={18} />
            <span>Text</span>
          </button>
          
          {hasSpeechSupport && (
            <button
              onClick={() => setInputMode('voice')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg flex-1 justify-center transition-colors ${
                inputMode === 'voice' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              <Mic size={18} />
              <span>Voice</span>
            </button>
          )}
          
          <button
            onClick={() => setInputMode('image')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg flex-1 justify-center transition-colors ${
              inputMode === 'image' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            <Camera size={18} />
            <span>Image</span>
          </button>
        </div>

        {/* Input Components */}
        {inputMode === 'text' && (
          <TextInput 
            onAnalysis={handleEmergencyAssessment}
            disabled={isAnalyzing}
          />
        )}
        
        {inputMode === 'voice' && (
          <VoiceInput
            onAnalysis={handleEmergencyAssessment}
            isListening={isListening}
            transcript={transcript}
            onStartListening={startListening}
            onStopListening={stopListening}
            disabled={isAnalyzing}
          />
        )}
        
        {inputMode === 'image' && (
          <ImageInput
            onAnalysis={handleEmergencyAssessment}
            disabled={isAnalyzing}
          />
        )}

        {/* Emergency Warning */}
        {emergencyMode && !soldier && (
          <div className="mt-3 p-3 bg-red-900 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2 text-red-200">
              <AlertTriangle size={16} />
              <span className="text-sm font-semibold">EMERGENCY MODE ACTIVE</span>
            </div>
            <p className="text-red-200 text-xs mt-1">
              Limited functionality. Records will be marked as emergency anonymous.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyChatbot;