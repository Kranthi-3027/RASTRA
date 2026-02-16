import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, useNavigate, useTranslation } from '../components/UI.tsx';
import { Camera, MapPin, UploadCloud, CheckCircle, AlertTriangle, Loader2, X, Image as ImageIcon, RotateCcw, ArrowRight, Crosshair, Navigation, Map as MapIcon, FileText } from 'lucide-react';
import { api } from '../services/mockApi.ts';
import { MOCK_USER } from '../constants';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Workaround for type compatibility with some React-Leaflet versions
const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;
const MarkerAny = Marker as any;

enum Step {
  LOCATION = 1,
  UPLOAD = 2,
  PROCESSING = 3,
  RESULT = 4
}

// Component to force Leaflet to resize correctly when container becomes visible
const MapRefresher = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

// Helper to recenter map
const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
};

// Map Event Component for Picking Location
const LocationPicker = ({ onPick, position, icon }: { onPick: (latlng: {lat: number, lng: number}) => void, position: {lat: number, lng: number} | null, icon: any }) => {
    useMapEvents({
        click(e) {
            onPick(e.latlng);
        }
    });
    return position ? (
        <MarkerAny 
            position={position} 
            icon={icon}
        />
    ) : null;
};

const ReportDamage = () => {
  const [step, setStep] = useState<Step>(Step.LOCATION);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  // Removed selectedDept state as tagging is no longer required by user

  const [aiResult, setAiResult] = useState<any>(null);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Initialize icon safely inside component to prevent module-level crashes
  const pinIcon = useMemo(() => {
      try {
          if (typeof L !== 'undefined') {
              return new L.Icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              });
          }
      } catch (e) {
          console.error("Failed to initialize Leaflet icon", e);
      }
      return null;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleGetLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setLocation(coords);
          setManualAddress(t('gpsDetected'));
          setStep(Step.UPLOAD);
          setIsLocating(false);
          setShowManualInput(false);
        },
        (error) => {
          console.error(error);
          setIsLocating(false);
          alert("Could not get location. Please enter address manually.");
          setShowManualInput(true);
        },
        { enableHighAccuracy: true }
      );
    } else {
        alert("Geolocation not supported.");
        setIsLocating(false);
        setShowManualInput(true);
    }
  };

  const handleManualNext = () => {
      if (pinnedLocation) {
          setLocation(pinnedLocation);
          setManualAddress("Pinned Location");
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
    setStep(Step.PROCESSING);
    setLoadingText("Uploading evidence...");

    try {
      const result = await api.analyzeAndReport(
          image, 
          location, 
          manualAddress, 
          MOCK_USER.id,
          { description, department: 'Engineering' }, // Defaulting to Engineering as user no longer selects
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

  // Render Steps Logic
  const steps = [
      { id: 1, label: t('location') },
      { id: 2, label: t('details') },
      { id: 3, label: t('review') }
  ];

  return (
    <div className="relative min-h-screen pb-20 md:pb-8 pt-6 px-4 md:px-8 w-full max-w-[1920px] mx-auto flex flex-col transition-all duration-300">
      {/* Background Ambient Glow */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rastha-primary/5 dark:bg-rastha-primary/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      {/* Header & Stepper */}
      <div className="mb-10 text-center md:text-left max-w-4xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-rastha-primary dark:text-white mb-8 tracking-tight text-center md:text-left">{t('reportPageTitle')}</h1>
        
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between relative px-2 md:px-6">
                {/* Connecting Line - Responsive Thickness */}
                <div className="absolute top-[20px] md:top-[28px] left-0 w-full h-1 md:h-2 bg-gray-200 dark:bg-gray-700 -z-10 rounded-full"></div>
                
                {steps.map((s) => {
                    const isActive = step >= s.id;
                    const isCurrent = step === s.id;
                    return (
                        <div key={s.id} className="flex flex-col items-center gap-2 md:gap-4 bg-gray-50 dark:bg-slate-950 px-2 md:px-6 rounded-full">
                            <div className={`
                                w-10 h-10 md:w-14 md:h-14 
                                rounded-full flex items-center justify-center 
                                text-sm md:text-lg font-bold 
                                transition-all duration-300 
                                ring-[4px] md:ring-[8px] ring-gray-50 dark:ring-slate-950 
                                ${isActive 
                                ? 'bg-rastha-primary text-white scale-110 shadow-lg shadow-rastha-primary/30' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}
                            `}>
                                {isActive ? <CheckCircle size={20} className="md:w-7 md:h-7" /> : s.id}
                            </div>
                            <span className={`text-[10px] md:text-sm uppercase tracking-wider font-bold transition-colors ${isCurrent ? 'text-rastha-primary dark:text-white' : 'text-gray-400'}`}>
                                {s.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
      </div>

      {/* CONTENT AREA - Using w-full to allow map to expand */}
      <div className="flex-1 flex flex-col relative z-0 w-full">
          
      {step === Step.LOCATION && (
        <div className="flex-1 flex flex-col animate-fade-in w-full">
          {!showManualInput ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm min-h-[400px] max-w-3xl mx-auto w-full">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full ring-1 ring-blue-100 dark:ring-blue-800">
                    <MapPin size={48} className="text-rastha-primary dark:text-blue-400 md:w-16 md:h-16" />
                </div>
                <div className="max-w-md">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 dark:text-white font-display">{t('whereIsIssue')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                        {t('locationDesc')}
                    </p>
                </div>
                
                <div className="w-full space-y-3 max-w-sm">
                    <Button onClick={handleGetLocation} isLoading={isLocating} className="w-full py-4 text-base md:text-lg shadow-xl shadow-rastha-primary/10">
                        <Navigation size={20} /> {t('useGps')}
                    </Button>
                    <Button onClick={() => setShowManualInput(true)} variant="white" className="w-full py-4 text-base md:text-lg">
                        <MapIcon size={20} /> {t('pickOnMap')}
                    </Button>
                </div>
            </div>
          ) : (
             <div className="flex-1 flex flex-col animate-fade-in space-y-4 w-full">
                {/* LARGE MAP CONTAINER - Width reduced to 70% on desktop */}
                <div className="w-full md:w-[70%] mx-auto h-[500px] md:h-[70vh] min-h-[600px] rounded-3xl overflow-hidden relative border border-gray-200 dark:border-slate-700 shadow-2xl shadow-gray-200/50 dark:shadow-none group bg-gray-100 dark:bg-gray-800">
                    <MapContainerAny center={[17.6599, 75.9064]} zoom={15} style={{ height: "100%", width: "100%" }}>
                        <MapRefresher />
                        <TileLayerAny url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {pinIcon && <LocationPicker onPick={setPinnedLocation} position={pinnedLocation} icon={pinIcon} />}
                        {pinnedLocation && <RecenterMap lat={pinnedLocation.lat} lng={pinnedLocation.lng} />}
                    </MapContainerAny>
                    
                    {/* Centered Crosshair Helper */}
                    {!pinnedLocation && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400]">
                             <Crosshair size={32} className="text-gray-800/50 dark:text-gray-800 drop-shadow-md" />
                             <div className="absolute mt-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 shadow-lg border border-gray-200 dark:border-slate-700">
                                Tap map to pin
                             </div>
                        </div>
                    )}

                    {/* Coordinates Box */}
                    {pinnedLocation && (
                        <div className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-[500] flex justify-between md:justify-start items-center gap-4 transition-all animate-slide-up">
                            <div className="text-left overflow-hidden">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-0.5">Selected Coordinates</p>
                                <p className="text-sm font-mono font-bold text-rastha-primary dark:text-white truncate">
                                    {pinnedLocation.lat.toFixed(6)}, {pinnedLocation.lng.toFixed(6)}
                                </p>
                            </div>
                            <div className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 p-2 rounded-full shrink-0">
                                <CheckCircle size={20} />
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={() => setShowManualInput(false)}
                        className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-2 rounded-full shadow-md z-[500] hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                        <ArrowRight size={20} className="rotate-180 text-gray-700 dark:text-white" />
                    </button>
                </div>

                <div className="pt-2 max-w-2xl mx-auto w-full">
                    <Button 
                        onClick={handleManualNext} 
                        disabled={!pinnedLocation} 
                        className="w-full py-4 text-base shadow-xl"
                    >
                        {t('confirmLocation')} <ArrowRight size={18} />
                    </Button>
                </div>
             </div>
          )}
        </div>
      )}

      {step === Step.UPLOAD && (
        <div className="flex-1 flex flex-col space-y-6 animate-fade-in pb-10 max-w-3xl mx-auto w-full">
          
          {/* Location Summary */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-4 rounded-2xl shadow-sm">
             <div className="flex items-center gap-3 text-sm">
                <div className="bg-rastha-primary/10 dark:bg-rastha-primary/20 p-2 rounded-full">
                    <MapPin size={18} className="text-rastha-primary dark:text-blue-400"/>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">{t('locationLocked')}</p>
                    <p className="font-medium dark:text-gray-200 truncate max-w-[180px] sm:max-w-xs">
                        {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "GPS Position"}
                    </p>
                </div>
             </div>
             <button onClick={() => { setStep(Step.LOCATION); setLocation(null); setShowManualInput(false); }} className="text-xs font-bold text-rastha-primary dark:text-blue-400 hover:underline px-2">
                {t('edit')}
             </button>
          </div>

          <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-3xl relative overflow-hidden transition-all group hover:border-rastha-primary/50 dark:hover:border-blue-500/50 flex flex-col justify-center min-h-[300px]">
            {preview ? (
              <div className="relative w-full h-full">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={clearImage} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-full text-white transition-all font-medium flex items-center gap-2">
                     <RotateCcw size={18} /> {t('retake')}
                  </button>
                </div>
                <button 
                  onClick={clearImage} 
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 md:hidden backdrop-blur-sm"
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
                <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8 z-10">
                   <button 
                     onClick={stopCamera} 
                     className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/30 transition-all"
                   >
                     <X size={24} />
                   </button>
                   <button 
                     onClick={capturePhoto} 
                     className="w-20 h-20 rounded-full border-[6px] border-white/30 bg-white/20 hover:bg-white/40 transition-all flex items-center justify-center relative"
                   >
                     <div className="w-14 h-14 bg-white rounded-full shadow-lg"></div>
                   </button>
                   <div className="w-14"></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 p-8 w-full h-full justify-center text-center">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-2">
                    <UploadCloud size={32} className="text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('evidenceRequired')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">{t('evidenceDesc')}</p>
                </div>
                <div className="flex flex-col w-full gap-3 max-w-xs mt-2">
                   <button 
                     onClick={startCamera}
                     className="flex items-center justify-center gap-2 bg-rastha-primary text-white py-4 px-6 rounded-2xl hover:bg-[#082F4D] transition-all shadow-lg shadow-rastha-primary/20 font-bold"
                   >
                     <Camera size={20} />
                     {t('takePhoto')}
                   </button>
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white py-4 px-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-medium"
                   >
                     <ImageIcon size={20} />
                     {t('uploadGallery')}
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

          {/* Description Input */}
          <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FileText size={16} /> {t('describeIssue')}
              </label>
              <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Deep pothole in center lane, Water pipe burst..."
                  className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-rastha-primary outline-none text-sm min-h-[100px] resize-none text-gray-800 dark:text-gray-200"
              />
          </div>

          <Button onClick={handleSubmit} disabled={!image || !description.trim()} className="w-full py-4 text-base shadow-xl">
             {t('startAnalysis')}
          </Button>
        </div>
      )}

      {step === Step.PROCESSING && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-pulse min-h-[50vh]">
           <div className="relative">
                <div className="absolute inset-0 bg-rastha-secondary/20 blur-xl rounded-full"></div>
                <Loader2 size={80} className="text-rastha-secondary animate-spin relative z-10" />
           </div>
           <div>
             <h3 className="text-2xl font-bold text-rastha-primary dark:text-white font-display">{t('analyzing')}</h3>
             <div className="mt-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-6 py-3 rounded-full inline-block shadow-sm">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-mono transition-all duration-300 flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {loadingText}
                </p>
             </div>
           </div>
        </div>
      )}

      {step === Step.RESULT && aiResult && (
        <div className="flex-1 flex flex-col space-y-6 animate-fade-in max-w-2xl mx-auto w-full">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-slate-800 text-center relative overflow-hidden">
            {/* Status Glow */}
            <div className={`absolute top-0 left-0 w-full h-2 ${aiResult.status === 'Verified' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${aiResult.status === 'Verified' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>
              {aiResult.status === 'Verified' ? (
                <CheckCircle size={40} />
              ) : (
                <AlertTriangle size={40} />
              )}
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-display">{aiResult.status}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Reference Token: <span className="font-mono text-gray-900 dark:text-gray-200 font-bold bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded ml-1">{aiResult.id}</span></p>

            <div className="text-left bg-gray-50 dark:bg-slate-950/50 p-5 rounded-2xl text-sm space-y-4 border border-gray-100 dark:border-slate-800">
               <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-800">
                 <span className="text-gray-500 dark:text-gray-400 font-medium">{t('severityAssessment')}</span>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${aiResult.severity === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-gray-300'}`}>
                    {aiResult.severity}
                 </span>
               </div>
               
               <div className="flex justify-between items-start pt-1">
                 <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">{t('registeredAddress')}</span>
                 <span className="text-gray-900 dark:text-gray-200 text-right font-medium max-w-[60%] leading-snug">{aiResult.address}</span>
               </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button onClick={() => navigate('/user/status')} variant="secondary" className="w-full py-4 text-base shadow-lg shadow-rastha-secondary/20">
                {t('trackStatus')}
            </Button>
            <Button onClick={() => { setStep(Step.LOCATION); setLocation(null); setManualAddress(""); setImage(null); setPreview(null); setDescription(""); }} variant="ghost" className="w-full py-4">
                {t('reportAnother')}
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ReportDamage;