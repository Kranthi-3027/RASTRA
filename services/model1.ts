import { Severity } from '../types';

// MODEL 1: YOLO POTHOLE EXPERT
// Connects to local Python server running 'pothole_model.pt'

export interface Model1Result {
  detected: boolean;
  confidence: number;
  severity: Severity;
  severityScore: number;
  label: string;
}

const BACKEND_URL = 'http://127.0.0.1:5000/api/detect/potholes';

export const analyzePotholes = async (image: File): Promise<Model1Result> => {
  console.log("[Model 1] Connecting to Local YOLO Backend...");

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
    console.log("[Model 1] Real YOLO Result:", data);

    return {
      detected: data.detected,
      confidence: data.confidence,
      severity: data.confidence > 0.8 ? Severity.HIGH : Severity.MEDIUM,
      severityScore: parseFloat((data.confidence * 10).toFixed(1)),
      label: data.label
    };

  } catch (error) {
    // 2. Fallback to Simulation
    console.warn("[Model 1] Local Backend Offline. Switching to Simulation Mode.", error);
    console.info("To use real models: Run 'python server.py' locally.");

    await new Promise(r => setTimeout(r, 1500)); 
    
    // Simulation Logic: 40% chance of pothole
    const isPothole = Math.random() > 0.6; 
    
    if (isPothole) {
      const confidence = 0.7 + (Math.random() * 0.25);
      return {
        detected: true,
        confidence: confidence,
        severity: confidence > 0.85 ? Severity.HIGH : Severity.MEDIUM,
        severityScore: parseFloat((confidence * 10).toFixed(1)),
        label: `Simulated Pothole (Backend Offline)`
      };
    }

    return {
      detected: false,
      confidence: 0.1,
      severity: Severity.LOW,
      severityScore: 0,
      label: 'No Pothole Found (Simulated)'
    };
  }
};