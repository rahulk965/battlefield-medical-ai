import React, { useState, useRef } from 'react';
import { Upload, Camera, X, Image as ImageIcon, AlertTriangle } from 'lucide-react';

const ImageInput = ({ onAnalysis, disabled }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const captureFromCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create video element for camera preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Create canvas for capturing image
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Wait for video to be ready
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Create modal for camera preview
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modal.style.zIndex = '1000';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
        const videoContainer = document.createElement('div');
        videoContainer.style.position = 'relative';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.background = 'red';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '1001';
        
        const captureButton = document.createElement('button');
        captureButton.textContent = '📷 Capture';
        captureButton.style.background = 'blue';
        captureButton.style.color = 'white';
        captureButton.style.border = 'none';
        captureButton.style.padding = '10px 20px';
        captureButton.style.borderRadius = '5px';
        captureButton.style.marginTop = '20px';
        captureButton.style.cursor = 'pointer';
        
        video.style.maxWidth = '100%';
        video.style.maxHeight = '70vh';
        
        closeButton.onclick = () => {
          document.body.removeChild(modal);
          stream.getTracks().forEach(track => track.stop());
        };
        
        captureButton.onclick = () => {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            handleFileSelect(file);
            document.body.removeChild(modal);
            stream.getTracks().forEach(track => track.stop());
          }, 'image/jpeg', 0.8);
        };
        
        videoContainer.appendChild(video);
        videoContainer.appendChild(closeButton);
        modal.appendChild(videoContainer);
        modal.appendChild(captureButton);
        document.body.appendChild(modal);
      });
      
    } catch (error) {
      console.error('Camera error:', error);
      alert('Camera access denied or not available. Please upload an image file instead.');
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    try {
      // Convert image to base64 for analysis
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = {
          filename: selectedImage.name,
          data: e.target.result,
          type: selectedImage.type,
          size: selectedImage.size
        };
        
        onAnalysis(null, imageData);
        // Don't clear image immediately - wait for analysis to complete
      };
      reader.readAsDataURL(selectedImage);
      
    } catch (error) {
      console.error('Image analysis error:', error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!previewUrl && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging 
              ? 'border-blue-500 bg-blue-900/20' 
              : 'border-gray-600 bg-gray-700/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-300 mb-2">Upload Injury Image</p>
          <p className="text-sm text-gray-400 mb-4">
            Drag & drop an image or click to browse
          </p>
          
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Browse Files
            </button>
            
            <button
              onClick={captureFromCamera}
              disabled={disabled}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Camera size={16} />
              <span>Use Camera</span>
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-gray-300">
              <ImageIcon size={20} />
              <span className="font-semibold">Image Preview</span>
            </div>
            <button
              onClick={clearImage}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-col items-center space-y-3">
            <img
              src={previewUrl}
              alt="Injury preview"
              className="max-w-full max-h-64 rounded-lg border border-gray-600"
            />
            
            <div className="text-xs text-gray-400">
              {selectedImage?.name} • {(selectedImage?.size / 1024 / 1024).toFixed(2)} MB
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={analyzeImage}
                disabled={disabled || isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    <span>Analyze Injury</span>
                  </>
                )}
              </button>
              
              <button
                onClick={clearImage}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Change Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
          <div className="text-yellow-200 text-sm">
            <p className="font-semibold">Image Analysis Guidelines:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Ensure good lighting and clear focus</li>
              <li>Capture the injury area clearly</li>
              <li>Include scale reference if possible</li>
              <li>Maximum file size: 10MB</li>
              <li>Supported formats: JPEG, PNG, GIF, WEBP</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageInput;