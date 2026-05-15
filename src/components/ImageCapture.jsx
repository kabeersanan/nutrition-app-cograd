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
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        📷 Scan Your Food
      </h2>

      {/* Drag & drop zone */}
      <label className="flex flex-col items-center justify-center w-full h-44
                         border-2 border-dashed border-green-300 rounded-xl
                         bg-green-50 hover:bg-green-100 cursor-pointer
                         transition-colors duration-200">
        <span className="text-4xl mb-2">🍎</span>
        <span className="text-sm text-green-700 font-medium">
          Click or drag an image here
        </span>
        <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
        <input type="file" accept="image/*" className="hidden"
               onChange={handleFile} />  {/* ✅ was onImageCapture, now handleFile */}
      </label>

      {/* OR divider */}
      <div className="flex items-center my-4 gap-3">
        <hr className="flex-1 border-gray-200" />
        <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
        <hr className="flex-1 border-gray-200" />
      </div>

      <button className="w-full py-2.5 rounded-xl bg-green-600 text-white
                          font-semibold text-sm hover:bg-green-700 active:scale-95
                          transition-all duration-150 shadow-sm">
        Use Camera
      </button>
    </div>
  );
}