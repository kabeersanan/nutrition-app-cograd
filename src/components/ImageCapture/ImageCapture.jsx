import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Aperture } from 'lucide-react';

export default function ImageCapture({ onImageUpload }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // 1. File Upload Handler- converts the image upload to a base 64 string
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onImageUpload(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 2. Function-Start Camera Hardware
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied or unavailable:", err);
      setIsCameraActive(false);
      alert("Could not access the camera. Please check your permissions.");
    }
  };

  // 3.Function-Stop Camera Hardware
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop()); 
    }
    setIsCameraActive(false);
  };

  // 4. Capture Frame to Canvas
  //have to do this-to capture the frame of the video "paint" across the canvas
  //  pack it as base 64 string that onImageUpload sends it to ai or a server for processing
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg');
      
      stopCamera();
      onImageUpload(imageData);
    }
  };

  // 5. Cleanup on Unmount
  //we use useEffect: because 
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // --- UI: Active Camera View ---
  if (isCameraActive) {
    return (
      <div className="bg-black rounded-2xl shadow-md p-4 flex flex-col items-center">
        <div className="relative w-full rounded-xl overflow-hidden bg-gray-900 aspect-[3/4]">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          <button 
            onClick={stopCamera}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
          >
            <X size={20} />
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <button 
          onClick={capturePhoto}
          className="mt-6 p-4 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-transform"
        >
          <Aperture size={32} />
        </button>
      </div>
    );
  }

  // --- UI: Default Upload View ---
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        📷 Scan Your Food
      </h2>

      <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-green-300 rounded-xl bg-green-50 hover:bg-green-100 cursor-pointer transition-colors duration-200">
        <span className="text-4xl mb-2">🍎</span>
        <span className="text-sm text-green-700 font-medium">Click or drag an image here</span>
        <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </label>

      <div className="flex items-center my-4 gap-3">
        <hr className="flex-1 border-gray-200" />
        <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
        <hr className="flex-1 border-gray-200" />
      </div>

      <button 
        onClick={startCamera}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 active:scale-95 transition-all duration-150 shadow-sm"
      >
        <Camera size={18} />
        Use Camera
      </button>
    </div>
  );
}