import { Severity } from '../types';

// MODEL 2: YOLO GENERAL DAMAGE EXPERT
// Connects to local Python server running 'damage_model.pt'

export interface Model2Result {
  detected: boolean;
  confidence: number;
  severity: Severity;
  severityScore: number;
  label: string;
}

const BACKEND_URL = 'http://127.0.0.1:5000/api/detect/general-damage';

export const analyzeGeneralDamage = async (image: File): Promise<Model2Result> => {
  console.log("[Model 2] Connecting to Local YOLO Backend...");

  const formData = new FormData();
  formData.append('file', image);

  try {
    // 1. Attempt Real Backend Connection
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    console.log("[Model 2] Real YOLO Result:", data);
    
    const severity = mapConfidenceToSeverity(data.confidence);

    return {
      detected: data.detected,
      confidence: data.confidence,
      severity: severity,
      severityScore: parseFloat((data.confidence * 10).toFixed(1)),
      label: data.label
    };

  } catch (error) {
    // 2. Fallback to Simulation
    console.warn("[Model 2] Local Backend Offline. Switching to Simulation Mode.", error);
    
    await new Promise(r => setTimeout(r, 1500)); 
    
    // Simulation Logic: 50% chance of damage if Model 1 failed
    const isDamage = Math.random() > 0.5;

    if (isDamage) {
      const confidence = 0.6 + (Math.random() * 0.3);
      const severity = mapConfidenceToSeverity(confidence);
      
      return {
        detected: true,
        confidence: confidence,
        severity: severity,
        severityScore: parseFloat((confidence * 10).toFixed(1)),
        label: severity === Severity.HIGH 
          ? 'Simulated: Severe Crack' 
          : 'Simulated: Minor Surface Issue'
      };
    }

    return {
      detected: false,
      confidence: 0.05,
      severity: Severity.LOW,
      severityScore: 0,
      label: 'No Damage Detected (Simulated)'
    };
  }
};

const mapConfidenceToSeverity = (conf: number): Severity => {
  if (conf > 0.85) return Severity.HIGH;
  if (conf > 0.6) return Severity.MEDIUM;
  return Severity.LOW;
};