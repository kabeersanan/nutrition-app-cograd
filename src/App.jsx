import React, { useState } from 'react';
import axios from 'axios';
import ImageCapture from './components/ImageCapture/ImageCapture';
import { LoadingState, NutritionResult } from './components/Nutrition/NutritionDisplay';
import TodayView from './components/History/TodayView';
import { AlertCircle, RefreshCw } from 'lucide-react';

function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nutritionData, setNutritionData] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('capture'); // 'capture' | 'today'

  const processPlate = async (base64Data) => {
    setImage(base64Data);
    setLoading(true);
    setError(null);

    try {
      // Convert the image to a Blob for transport
      const fetchResponse = await fetch(base64Data);
      const blob = await fetchResponse.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'plate.jpg');

      // Use the live URL in Vercel, and localhost on your machine.
      // Trim a trailing slash so `${API_BASE_URL}/analyze` never produces `//analyze`.
      const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:10000").replace(/\/+$/, "");

      const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNutritionData(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze the image. Please make sure the backend is running and try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setImage(null);
    setNutritionData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-4">MacroVision</h1>

        {/* Tabs: switch between the capture flow and today's logged history */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
          {[['capture', 'Capture'], ['today', 'Today']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                view === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'today' ? (
          <TodayView />
        ) : (
          <>
            {/* Error State */}
            {error && (
              <div className="bg-red-50 p-4 rounded-xl flex flex-col items-center mb-6 text-center">
                <AlertCircle className="text-red-500 w-10 h-10 mb-2" />
                <p className="text-red-700 font-medium mb-4">{error}</p>
                <button onClick={resetApp} className="flex items-center text-red-600 font-bold hover:underline">
                  <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && <LoadingState />}

            {/* Success State */}
            {!loading && nutritionData && (
              <div>
                <NutritionResult data={nutritionData} />
                <button
                  onClick={resetApp}
                  className="mt-6 w-full bg-blue-50 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-100 transition"
                >
                  Analyze Another Plate
                </button>
              </div>
            )}

            {/* Initial Upload State */}
            {!loading && !nutritionData && !error && (
              <ImageCapture onImageUpload={processPlate} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;