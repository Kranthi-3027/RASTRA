// =============================================================================
// RASHTRA GEMINI SERVICE — Chatbot only
// Responds in English, Hindi, or Marathi based on user language
// =============================================================================

import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('[Gemini] VITE_GEMINI_API_KEY not set in .env.local');
}

function getAI(): GoogleGenAI {
  if (!API_KEY) throw new Error('Gemini API key not configured.');
  return new GoogleGenAI({ apiKey: API_KEY });
}

// ── Chatbot ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const CHATBOT_SYSTEM_CONTEXT = `You are RASHTRA Assistant — the official AI helper for the Rashtra Smart Road Damage Reporting Portal run by Solapur Municipal Corporation, Maharashtra, India.

Your role:
- Help citizens report road damage, potholes, water leaks, garbage, and infrastructure issues
- Explain how the complaint process works (submit → AI verification → department assignment → repair)
- Answer questions about complaint status, timelines, and escalation
- Provide info about portal features
- Do NOT discuss politics, personal topics, or anything unrelated to civic infrastructure

Language rule: Detect the language of the user's message and reply in the same language — English, Hindi (हिंदी), or Marathi (मराठी). If uncertain, reply in English.

Key facts:
- Complaints are auto-verified by AI and routed to the right department
- Users can track complaints via the Status tab
- High severity: 24h SLA | Medium: 48h | Low: 72h
- Emergency: 100 (Police), 108 (Ambulance)
- Solapur Municipal Corporation helpline: 0217-274-0300

Keep responses under 3 sentences unless a detailed explanation is genuinely needed.`;

const FALLBACKS: Record<string, string> = {
  default: "I can help you report road damage, check complaint status, or explain how Rashtra works. What do you need?",
  report: "To report a complaint: tap 'Report' in the bottom nav, allow location access, take a photo, and submit. Our AI will verify it automatically.",
  status: "Check your complaint status under the 'Status' tab. You'll see real-time updates as the department takes action.",
  emergency: "For emergencies call 100 (Police) or 108 (Ambulance). For urgent road hazards, your complaint gets prioritised with a 24h SLA.",
  hello: "Hello! I'm RASHTRA Assistant. How can I help you with road safety or civic issues today?",
};

export async function chatWithGemini(
  userMessage: string,
  history: ChatMessage[],
  customSystemPrompt?: string
): Promise<string> {
  if (!API_KEY) {
    const lower = userMessage.toLowerCase();
    if (lower.includes('report') || lower.includes('pothole')) return FALLBACKS.report;
    if (lower.includes('status') || lower.includes('track')) return FALLBACKS.status;
    if (lower.includes('emergency') || lower.includes('accident')) return FALLBACKS.emergency;
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('नमस्ते') || lower.includes('नमस्कार')) return FALLBACKS.hello;
    return FALLBACKS.default;
  }

  try {
    const contents = [
      { role: 'user' as const, parts: [{ text: customSystemPrompt || CHATBOT_SYSTEM_CONTEXT }] },
      { role: 'model' as const, parts: [{ text: "Understood. I'm RASHTRA Assistant, ready to help citizens of Solapur in English, Hindi, or Marathi." }] },
      ...history.map(m => ({ role: m.role as 'user' | 'model', parts: [{ text: m.text }] })),
      { role: 'user' as const, parts: [{ text: userMessage }] },
    ];

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { temperature: 0.7, maxOutputTokens: 300 },
    });

    return response.text?.trim() || FALLBACKS.default;
  } catch (e) {
    console.warn('[Gemini] Chatbot request failed.', e);
    return "I'm having trouble connecting right now. For urgent help, call Solapur Municipal Corporation: 0217-274-0300.";
  }
}