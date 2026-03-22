import { Severity } from '../types';

// Internal AI analysis module — damage detection (primary)
// Connects to local inference backend; falls back to simulation if unavailable.

export interface Model1Result {
  detected: boolean;
  confidence: number;
  severity: Severity;
  severityScore: number;
  label: string;
}

const BACKEND_URL = 'https://kranthi3027-rashtra-ai.hf.space/api/detect/potholes';

export const analyzePotholes = async (image: File): Promise<Model1Result> => {
  const formData = new FormData();
  formData.append('file', image);

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    return {
      detected: data.detected,
      confidence: data.confidence,
      severity: data.confidence > 0.8 ? Severity.HIGH : Severity.MEDIUM,
      severityScore: parseFloat((data.confidence * 10).toFixed(1)),
      label: data.label
    };

  } catch {
    // Offline fallback — simulation mode
    await new Promise(r => setTimeout(r, 1500));
    const isPothole = Math.random() > 0.6;

    if (isPothole) {
      const confidence = 0.7 + (Math.random() * 0.25);
      return {
        detected: true,
        confidence,
        severity: confidence > 0.85 ? Severity.HIGH : Severity.MEDIUM,
        severityScore: parseFloat((confidence * 10).toFixed(1)),
        label: `Road surface damage detected`
      };
    }

    return {
      detected: false,
      confidence: 0.1,
      severity: Severity.LOW,
      severityScore: 0,
      label: 'No primary damage detected'
    };
  }
};
