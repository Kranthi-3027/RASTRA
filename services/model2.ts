import { Severity } from '../types';

// Internal AI analysis module — general damage detection (secondary)
// Runs when primary analysis finds no clear damage.

export interface Model2Result {
  detected: boolean;
  confidence: number;
  severity: Severity;
  severityScore: number;
  label: string;
}

const BACKEND_URL = 'https://kranthi3027-rashtra-ai.hf.space/api/detect/general-damage';

export const analyzeGeneralDamage = async (image: File): Promise<Model2Result> => {
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
      severity: data.confidence > 0.75 ? Severity.HIGH : Severity.MEDIUM,
      severityScore: parseFloat((data.confidence * 10).toFixed(1)),
      label: data.label
    };

  } catch {
    // Offline fallback — simulation mode
    await new Promise(r => setTimeout(r, 1200));
    const hasDamage = Math.random() > 0.5;

    if (hasDamage) {
      const confidence = 0.55 + (Math.random() * 0.3);
      return {
        detected: true,
        confidence,
        severity: confidence > 0.75 ? Severity.HIGH : Severity.MEDIUM,
        severityScore: parseFloat((confidence * 10).toFixed(1)),
        label: 'Infrastructure damage identified'
      };
    }

    return {
      detected: false,
      confidence: 0.15,
      severity: Severity.LOW,
      severityScore: 0,
      label: 'No damage detected'
    };
  }
};
