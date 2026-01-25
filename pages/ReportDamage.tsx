import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/UI.tsx';
import { Camera, MapPin, UploadCloud, CheckCircle, AlertTriangle, Loader2, X, Image as ImageIcon, RotateCcw, ArrowRight } from 'lucide-react';
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
  const [manualAddress, setManualAddress] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleGetLocation = () => {
    setLoadingText("Acquiring precise GPS...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setManualAddress("GPS Location Detected");
          setStep(Step.UPLOAD);
        },
        () => {
          alert("Could not get location. Please enter address manually.");
          setShowManualInput(true);
        },
        { enableHighAccuracy: true }
      );
    } else {
        alert("Geolocation not supported.");
        setShowManualInput(true);
    }
  };

  const handleManualNext = () => {
      if (manualAddress.trim()) {
          setStep(Step.UPLOAD);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setIsCameraActive(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setImage(null);
      setPreview(null);
      setTimeout(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setImage(file);
            setPreview(URL.createObjectURL(file));
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!image) return;
    if (!location && !manualAddress.trim()) {
        alert("Location missing.");
        setStep(Step.LOCATION);
        return;
    }
    setStep(Step.PROCESSING);
    setLoadingText("Uploading evidence...");

    try {
      const result = await api.analyzeAndReport(
          image, 
          location, 
          manualAddress, 
          MOCK_USER.id,
          (status) => setLoadingText(status) 
      );
      setTimeout(() => {
          setAiResult(result);
          setStep(Step.RESULT);
      }, 800);
    } catch (error) {
      console.error(error);
      alert("Error processing complaint");
      setStep(Step.UPLOAD);
    }
  };

  return (
    <div className="pb-20 md:pb-8 pt-6 md:pt-8 px-4 max-w-xl mx-auto min-h-screen flex flex-col justify-center">
      <h1 className="text-2xl font-bold text-rastha-primary mb-6">Report Damage</h1>

      <div className="flex justify-between mb-8 px-4 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded"></div>
        {[1, 2, 3].map((s) => (
          <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-rastha-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
            {s}
          </div>
        ))}
      </div>

      {step === Step.LOCATION && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[400px]">
          <div className="bg-blue-50 p-8 rounded-full">
            <MapPin size={64} className="text-rastha-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2 dark:text-white">Location Required</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
                {showManualInput ? "Enter the street or landmark where the damage is located." : "Use GPS for precise location or enter address manually."}
            </p>
          </div>
          
          {!showManualInput ? (
            <div className="w-full space-y-3">
                <Button onClick={handleGetLocation} className="w-full py-3">
                    Enable GPS (Recommended)
                </Button>
                <Button onClick={() => setShowManualInput(true)} variant="outline" className="w-full py-3">
                    Enter Address Manually
                </Button>
            </div>
          ) : (
             <div className="w-full space-y-4 animate-fade-in">
                <textarea 
                   value={manualAddress}
                   onChange={(e) => setManualAddress(e.target.value)}
                   placeholder="Enter Street / Area / Landmark..."
                   className="w-full p-4 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rastha-primary transition-all"
                   rows={3}
                   autoFocus
                />
                <div className="flex gap-3">
                    <Button onClick={() => setShowManualInput(false)} variant="ghost" className="flex-1">
                        Cancel
                    </Button>
                    <Button onClick={handleManualNext} disabled={!manualAddress.trim()} className="flex-1">
                        Next <ArrowRight size={16} />
                    </Button>
                </div>
             </div>
          )}
        </div>
      )}

      {step === Step.UPLOAD && (
        <div className="flex-1 flex flex-col space-y-6 animate-fade-in">
          
          {/* Location Summary Only - No Input Field */}
          <div className="flex items-center justify-between px-1 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
             <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <MapPin size={16} className="text-rastha-primary"/>
                <span className="font-medium truncate max-w-[200px]">
                    {location ? "GPS Location Locked" : (manualAddress || "Location Set")}
                </span>
             </div>
             <button onClick={() => { setStep(Step.LOCATION); setLocation(null); setShowManualInput(false); }} className="text-xs text-blue-600 hover:underline">
                Change
             </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl h-80 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 relative overflow-hidden transition-all shadow-sm">
            {preview ? (
              <div className="relative w-full h-full group">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={clearImage} className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white transition-colors">
                     <RotateCcw size={24} />
                  </button>
                </div>
                <button 
                  onClick={clearImage} 
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 md:hidden"
                >
                  <X size={20} />
                </button>
              </div>
            ) : isCameraActive ? (
              <div className="relative w-full h-full bg-black">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-8">
                   <button 
                     onClick={stopCamera} 
                     className="bg-white/20 backdrop-blur-sm p-3 rounded-full text-white hover:bg-white/30"
                   >
                     <X size={24} />
                   </button>
                   <button 
                     onClick={capturePhoto} 
                     className="w-16 h-16 rounded-full border-4 border-white bg-transparent hover:bg-white/20 transition-all flex items-center justify-center"
                   >
                     <div className="w-12 h-12 bg-white rounded-full"></div>
                   </button>
                   <div className="w-12"></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-6 w-full h-full justify-center">
                <UploadCloud size={48} className="text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">Upload evidence of road damage</p>
                <div className="flex flex-col w-full gap-3 max-w-xs">
                   <button 
                     onClick={startCamera}
                     className="flex items-center justify-center gap-2 bg-rastha-primary text-white py-3 px-4 rounded-xl hover:bg-opacity-90 transition-all shadow-sm font-medium"
                   >
                     <Camera size={20} />
                     Take Photo
                   </button>
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm font-medium"
                   >
                     <ImageIcon size={20} />
                     Upload from Gallery
                   </button>
                </div>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
            />
          </div>

          <Button onClick={handleSubmit} disabled={!image} className="w-full py-3">
             Run Analysis
          </Button>
        </div>
      )}

      {step === Step.PROCESSING && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
           <Loader2 size={64} className="text-rastha-secondary animate-spin" />
           <div>
             <h3 className="text-lg font-bold text-rastha-primary dark:text-white">Analyzing Road Surface...</h3>
             <div className="mt-4 bg-gray-100 dark:bg-gray-700/50 px-4 py-2 rounded-full inline-block">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-mono transition-all duration-300">{loadingText}</p>
             </div>
           </div>
        </div>
      )}

      {step === Step.RESULT && aiResult && (
        <div className="flex-1 flex flex-col space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${aiResult.status === 'Verified' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
              {aiResult.status === 'Verified' ? (
                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle size={32} className="text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{aiResult.status}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Token ID: <span className="font-mono text-gray-800 dark:text-gray-200 font-bold">{aiResult.id}</span></p>

            <div className="text-left bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm space-y-2">
               <div className="flex justify-between">
                 <span className="text-gray-500 dark:text-gray-400">Severity:</span>
                 <span className={`font-bold ${aiResult.severity === 'High' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{aiResult.severity}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500 dark:text-gray-400">Analysis Result:</span>
                 <span className="text-gray-800 dark:text-gray-200 text-right w-1/2">{aiResult.description}</span>
               </div>
               <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                 <span className="text-gray-500 dark:text-gray-400">Address:</span>
                 <span className="text-gray-800 dark:text-gray-200 text-right w-1/2 truncate">{aiResult.address}</span>
               </div>
            </div>
          </div>

          <Button onClick={() => navigate('/user/status')} variant="secondary" className="w-full">
            Track Complaint
          </Button>
          <Button onClick={() => { setStep(Step.LOCATION); setLocation(null); setManualAddress(""); setImage(null); setPreview(null); }} variant="ghost" className="w-full">
            Report Another
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReportDamage;