import React, { useState, useRef } from 'react';
import { Button } from '../components/UI.tsx';
import { Camera, MapPin, UploadCloud, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../services/mockApi.ts';
import { MOCK_USER } from '../constants';
import { useNavigate } from 'react-router-dom';

enum Step {
  LOCATION = 1,
  UPLOAD = 2,
  PROCESSING = 3,
  RESULT = 4
}

const ReportDamage = () => {
  const [step, setStep] = useState<Step>(Step.LOCATION);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [loadingText, setLoadingText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleGetLocation = () => {
    setLoadingText("Acquiring precise GPS...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setStep(Step.UPLOAD);
        },
        () => {
          alert("Could not get location. Using default mock location.");
          setLocation({ lat: 17.3850, lng: 78.4867 });
          setStep(Step.UPLOAD);
        }
      );
    } else {
        setLocation({ lat: 17.3850, lng: 78.4867 });
        setStep(Step.UPLOAD);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!image || !location) return;
    
    setStep(Step.PROCESSING);
    
    // UI Updates to show sequential processing
    setLoadingText("Uploading Image...");
    setTimeout(() => setLoadingText("Analyzing Road Surface..."), 1000);
    setTimeout(() => setLoadingText("Verifying Severity Levels..."), 2500);

    try {
      const result = await api.analyzeAndReport(image, location, MOCK_USER.id);
      setAiResult(result);
      setStep(Step.RESULT);
    } catch (error) {
      console.error(error);
      alert("Error processing complaint");
      setStep(Step.UPLOAD);
    }
  };

  return (
    <div className="pb-20 pt-6 px-4 max-w-md mx-auto min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-rastha-primary mb-6">Report Damage</h1>

      {/* Step Indicator */}
      <div className="flex justify-between mb-8 px-4 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded"></div>
        {[1, 2, 3].map((s) => (
          <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-rastha-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
            {s}
          </div>
        ))}
      </div>

      {step === Step.LOCATION && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
          <div className="bg-blue-50 p-8 rounded-full">
            <MapPin size={64} className="text-rastha-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Location Required</h2>
            <p className="text-gray-500 text-sm">We need your GPS coordinates to accurately map the road damage.</p>
          </div>
          <Button onClick={handleGetLocation} className="w-full py-3">
             Enable GPS & Continue
          </Button>
        </div>
      )}

      {step === Step.UPLOAD && (
        <div className="flex-1 flex flex-col space-y-6 animate-fade-in">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-2xl h-64 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera size={48} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 font-medium">Tap to take photo</span>
              </>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          </div>

          {location && (
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-xs flex items-center">
              <CheckCircle size={14} className="mr-2" />
              GPS Locked: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!image} className="w-full py-3">
             Run Analysis
          </Button>
        </div>
      )}

      {step === Step.PROCESSING && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
           <Loader2 size={64} className="text-rastha-secondary animate-spin" />
           <div>
             <h3 className="text-lg font-bold text-rastha-primary">Analyzing...</h3>
             <p className="text-sm text-gray-500 mt-2">{loadingText}</p>
           </div>
        </div>
      )}

      {step === Step.RESULT && aiResult && (
        <div className="flex-1 flex flex-col space-y-6 animate-fade-in">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${aiResult.status === 'Auto-Verified' ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {aiResult.status === 'Auto-Verified' ? (
                <CheckCircle size={32} className="text-green-600" />
              ) : (
                <AlertTriangle size={32} className="text-yellow-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{aiResult.status}</h2>
            <p className="text-sm text-gray-500 mb-4">Token ID: <span className="font-mono text-gray-800 font-bold">{aiResult.id}</span></p>

            <div className="text-left bg-gray-50 p-4 rounded-lg text-sm space-y-2">
               <div className="flex justify-between">
                 <span className="text-gray-500">Severity:</span>
                 <span className={`font-bold ${aiResult.severity === 'High' ? 'text-red-600' : 'text-gray-700'}`}>{aiResult.severity}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500">Analysis Result:</span>
                 <span className="text-gray-800 text-right w-1/2">{aiResult.description}</span>
               </div>
            </div>
          </div>

          <Button onClick={() => navigate('/user/status')} variant="secondary" className="w-full">
            Track Complaint
          </Button>
          <Button onClick={() => { setStep(Step.LOCATION); setLocation(null); setImage(null); setPreview(null); }} variant="ghost" className="w-full">
            Report Another
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReportDamage;