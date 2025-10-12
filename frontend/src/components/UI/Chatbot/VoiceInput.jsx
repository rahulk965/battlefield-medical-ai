import React, { useState, useEffect } from 'react';
import { Mic, Square, Send, Volume2 } from 'lucide-react';

const VoiceInput = ({ 
  onAnalysis, 
  isListening, 
  transcript, 
  onStartListening, 
  onStopListening, 
  disabled 
}) => {
  const [finalTranscript, setFinalTranscript] = useState('');

  useEffect(() => {
    if (transcript && !isListening) {
      setFinalTranscript(transcript);
    }
  }, [transcript, isListening]);

  const handleSubmit = () => {
    if (finalTranscript.trim()) {
      onAnalysis(finalTranscript);
      setFinalTranscript('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const speakTranscript = () => {
    if ('speechSynthesis' in window && finalTranscript) {
      const utterance = new SpeechSynthesisUtterance(finalTranscript);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-3">
      {/* Voice Control Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={isListening ? onStopListening : onStartListening}
          disabled={disabled}
          className={`flex items-center space-x-2 px-4 py-3 rounded-lg flex-1 justify-center transition-all ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? <Square size={20} /> : <Mic size={20} />}
          <span className="font-semibold">
            {isListening ? 'Stop Listening' : 'Start Voice Input'}
          </span>
        </button>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-200 text-sm font-semibold">
              {isListening ? '🎤 Listening...' : '✅ Voice Captured'}
            </span>
            {!isListening && finalTranscript && (
              <button
                onClick={speakTranscript}
                className="text-yellow-200 hover:text-yellow-100 transition-colors"
                title="Play transcript"
              >
                <Volume2 size={16} />
              </button>
            )}
          </div>
          <div className="text-yellow-100 text-sm whitespace-pre-wrap">
            {transcript}
          </div>
        </div>
      )}

      {/* Final Transcript Editor */}
      {finalTranscript && !isListening && (
        <div className="space-y-2">
          <textarea
            value={finalTranscript}
            onChange={(e) => setFinalTranscript(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Edit voice transcript before sending..."
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            rows="3"
            disabled={disabled}
          />
          
          <div className="flex space-x-2">
            <button
              onClick={handleSubmit}
              disabled={!finalTranscript.trim() || disabled}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
            >
              <Send size={16} />
              <span>Send for Analysis</span>
            </button>
            
            <button
              onClick={() => setFinalTranscript('')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isListening && !transcript && (
        <div className="text-center text-gray-400 text-sm p-4 border-2 border-dashed border-gray-600 rounded-lg">
          <Mic size={32} className="mx-auto mb-2 opacity-50" />
          <p>Click "Start Voice Input" to describe symptoms using your voice</p>
          <p className="text-xs mt-1">Speak clearly and describe the medical situation</p>
        </div>
      )}

      {/* Listening Indicator */}
      {isListening && (
        <div className="flex justify-center space-x-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-2 h-8 bg-green-500 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;