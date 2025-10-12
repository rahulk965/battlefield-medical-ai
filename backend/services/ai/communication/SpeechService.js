class SpeechService {
  constructor() {
    this.synthesis = null;
    this.recognition = null;
    this.isSpeaking = false;
    this.isListening = false;
    
    this.initializeSpeechSynthesis();
  }

  // Initialize speech synthesis
  initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      
      // Get available voices
      this.loadVoices();
      
      // Voice changed event
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  }

  loadVoices() {
    if (!this.synthesis) return;
    
    this.voices = this.synthesis.getVoices();
    console.log(`🎙️ Loaded ${this.voices.length} speech synthesis voices`);
  }

  // Text-to-Speech for medical instructions
  async speakMedicalInstructions(instructions, options = {}) {
    if (!this.synthesis) {
      console.warn('Speech synthesis not available');
      return false;
    }

    if (this.isSpeaking) {
      this.synthesis.cancel(); // Stop current speech
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance();
      
      // Configure utterance
      utterance.text = this.formatInstructionsForSpeech(instructions);
      utterance.rate = options.rate || 0.9; // Slightly slower for medical instructions
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;
      
      // Select appropriate voice
      const voice = this.selectMedicalVoice();
      if (voice) {
        utterance.voice = voice;
      }
      
      // Event handlers
      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log('🔊 Started speaking medical instructions');
      };
      
      utterance.onend = () => {
        this.isSpeaking = false;
        console.log('🔇 Finished speaking medical instructions');
        resolve(true);
      };
      
      utterance.onerror = (event) => {
        this.isSpeaking = false;
        console.error('❌ Speech synthesis error:', event.error);
        resolve(false);
      };
      
      // Start speaking
      this.synthesis.speak(utterance);
    });
  }

  // Format medical instructions for better speech
  formatInstructionsForSpeech(instructions) {
    if (Array.isArray(instructions)) {
      return instructions.map((instruction, index) => {
        // Add pauses between steps
        const pause = index < instructions.length - 1 ? '. Next, ' : '.';
        return `${instruction}${pause}`;
      }).join(' ');
    }
    
    return instructions;
  }

  // Select appropriate voice for medical context
  selectMedicalVoice() {
    if (!this.voices || this.voices.length === 0) return null;
    
    // Prefer clear, calm voices for medical context
    const preferredVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en-') && // English voices
      !voice.name.includes('Google') && // Avoid robotic voices
      !voice.name.includes('Microsoft')
    );
    
    return preferredVoices.length > 0 ? preferredVoices[0] : this.voices[0];
  }

  // Emergency alert speech
  async speakEmergencyAlert(alertMessage) {
    const options = {
      rate: 1.2, // Faster for emergencies
      pitch: 1.3, // Higher pitch for attention
      volume: 1.0
    };
    
    return this.speakMedicalInstructions(alertMessage, options);
  }

  // Stop all speech
  stopSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      console.log('⏹️ Stopped speech synthesis');
    }
  }

  // Speech recognition for voice commands
  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      return true;
    } else {
      console.warn('Speech recognition not supported in this browser');
      return false;
    }
  }

  // Start listening for voice commands
  startListening(callbacks = {}) {
    if (!this.recognition) {
      if (!this.initializeSpeechRecognition()) {
        return false;
      }
    }
    
    if (this.isListening) {
      this.stopListening();
    }
    
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 Started listening for voice commands');
      if (callbacks.onStart) callbacks.onStart();
    };
    
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (callbacks.onInterimResult) {
        callbacks.onInterimResult(interimTranscript);
      }
      
      if (finalTranscript && callbacks.onFinalResult) {
        callbacks.onFinalResult(finalTranscript);
      }
    };
    
    this.recognition.onerror = (event) => {
      this.isListening = false;
      console.error('🎤 Speech recognition error:', event.error);
      if (callbacks.onError) callbacks.onError(event.error);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🎤 Stopped listening for voice commands');
      if (callbacks.onEnd) callbacks.onEnd();
    };
    
    this.recognition.start();
    return true;
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Medical command recognition
  recognizeMedicalCommand(transcript) {
    const commands = {
      emergency: ['emergency', 'help', 'medic', 'urgent'],
      symptoms: ['symptom', 'pain', 'hurt', 'bleeding', 'burn'],
      instructions: ['repeat', 'again', 'slower', 'stop'],
      navigation: ['next', 'previous', 'back', 'home']
    };
    
    const lowerTranscript = transcript.toLowerCase();
    
    for (const [category, keywords] of Object.entries(commands)) {
      if (keywords.some(keyword => lowerTranscript.includes(keyword))) {
        return {
          category,
          command: transcript,
          confidence: this.calculateCommandConfidence(lowerTranscript, keywords)
        };
      }
    }
    
    return {
      category: 'unknown',
      command: transcript,
      confidence: 0.1
    };
  }

  calculateCommandConfidence(transcript, keywords) {
    const matches = keywords.filter(keyword => transcript.includes(keyword)).length;
    return Math.min(matches / keywords.length, 1.0);
  }

  // Get speech capabilities
  getCapabilities() {
    return {
      synthesis: !!this.synthesis,
      recognition: !!this.recognition,
      isSpeaking: this.isSpeaking,
      isListening: this.isListening,
      voices: this.voices ? this.voices.length : 0
    };
  }
}

// For Node.js backend compatibility
class ServerSpeechService {
  constructor() {
    console.log('🔇 Server-side speech service - actual TTS/STT would require external services');
  }
  
  async synthesizeSpeech(text, options = {}) {
    console.log(`🔊 [Server TTS] Would synthesize: ${text.substring(0, 100)}...`);
    // In production, integrate with AWS Polly, Google TTS, or similar service
    return { success: true, message: 'Speech synthesis would be processed server-side' };
  }
  
  async transcribeAudio(audioBuffer) {
    console.log('🎤 [Server STT] Would transcribe audio buffer');
    // In production, integrate with AWS Transcribe, Google Speech-to-Text, etc.
    return { success: true, transcript: 'Simulated transcription result' };
  }
}

// Export appropriate version based on environment
const SpeechServiceExport = typeof window !== 'undefined' ? SpeechService : ServerSpeechService;

export default SpeechServiceExport;