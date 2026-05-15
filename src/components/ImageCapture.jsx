import React from 'react';
import { Camera, Upload } from 'lucide-react';

export default function ImageCapture({ onImageUpload }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onImageUpload(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
      <Camera className="w-12 h-12 text-blue-500 mb-4" />
      <p className="text-gray-600 mb-4 text-center">Snap your meal to see the gains</p>
      <label className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold cursor-pointer hover:bg-blue-700 transition">
        Analyze Food
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleFile} 
        />
      </label>
    </div>
  );
}