import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Minimize2, Globe, ChevronRight } from 'lucide-react';
import { chatWithGemini, type ChatMessage as GeminiMessage } from '../services/gemini.ts';

type LangCode = 'en' | 'mr' | 'hi';
const LANG_STORAGE_KEY = 'rashtra_chatbot_lang';

const LANGUAGES = [
  { code: 'en' as LangCode, label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'mr' as LangCode, label: 'Marathi', nativeLabel: 'मराठी', flag: '🇮🇳' },
  { code: 'hi' as LangCode, label: 'Hindi', nativeLabel: 'हिंदी', flag: '🇮🇳' },
];

const GREETING: Record<LangCode, string> = {
  en: "🙏 Namaskar! I'm Rashtra AI, your official assistant for the Rashtra Civic Infrastructure Platform.\n\nI can help you:\n• Report civic issues (potholes, leaks, garbage, streetlights)\n• Track your complaint status\n• Understand how Rashtra works\n• Guide you through the platform\n\nHow can I assist you today?",
  mr: "🙏 नमस्कार! मी Rashtra AI आहे, राष्ट्र नागरी पायाभूत सुविधा प्लॅटफॉर्मचा अधिकृत सहाय्यक.\n\nमी आपल्याला मदत करू शकतो:\n• नागरी समस्या नोंदवणे (खड्डे, गळती, कचरा, दिवे)\n• तक्रार स्थिती तपासणे\n• राष्ट्र प्लॅटफॉर्म समजून घेणे\n\nआज मी आपली कशी मदत करू?",
  hi: "🙏 नमस्कार! मैं Rashtra AI हूं, राष्ट्र नागरिक अवसंरचना प्लेटफॉर्म का आधिकारिक सहायक।\n\nमैं आपकी मदद कर सकता हूं:\n• नागरिक समस्या रिपोर्ट करें (गड्ढे, रिसाव, कचरा, स्ट्रीटलाइट)\n• शिकायत की स्थिति ट्रैक करें\n• राष्ट्र प्लेटफॉर्म को समझें\n\nआज मैं आपकी कैसे सहायता करूं?",
};

const LANG_INSTRUCTION: Record<LangCode, string> = {
  en: 'Respond in English only.',
  mr: 'Respond in Marathi (मराठी) only. Do not use English except for technical terms.',
  hi: 'Respond in Hindi (हिंदी) only. Do not use English except for technical terms.',
};

const SYSTEM_PROMPT = `You are Rashtra AI, the official intelligent assistant for the Rashtra platform.

Your purpose is to help citizens understand and use the Rashtra system, answer questions about the platform, and guide users in reporting infrastructure issues.

ABOUT RASHTRA
Rashtra is an AI-powered civic infrastructure monitoring and reporting platform designed to improve public infrastructure management. It allows citizens to easily report issues such as potholes, road damage, garbage dumping, broken streetlights, water leakage, and other municipal problems.

The platform combines artificial intelligence, citizen participation, and modern web technologies to create a transparent and efficient reporting system for civic infrastructure issues.

RASHTRA'S MISSION
Make civic reporting simple, transparent, and effective by empowering citizens and supporting municipalities with AI-powered tools.

RASHTRA'S VISION
Build a smarter civic ecosystem where technology helps governments respond faster to infrastructure problems and where citizens actively participate in improving their cities.

MAIN FEATURES OF RASHTRA
1. AI-Based Pothole Detection - Rashtra uses computer vision models to analyze images of roads and detect potholes or road damage automatically.
2. Citizen Reporting System - Users can report infrastructure problems by uploading an image and providing basic details such as location and description.
3. Image Upload and Storage - Images uploaded by users are stored securely using object storage systems such as MinIO or cloud storage.
4. AI Damage Analysis - The AI system analyzes uploaded images to detect road damage and estimate severity levels.
5. Community Dashboard - Users can view infrastructure issues reported by other citizens in their area.
6. Issue Tracking - Reports submitted by citizens can be tracked and monitored.
7. Administrative Dashboard - Municipal administrators can view reports, analyze data, and prioritize infrastructure repairs.
8. Transparency and Accountability - Rashtra aims to make infrastructure management transparent by making reports visible to the community.

HOW RASHTRA WORKS
Step 1: A citizen notices a road problem such as a pothole.
Step 2: The citizen uploads an image of the problem using the Rashtra platform.
Step 3: The AI model analyzes the image and detects the damage.
Step 4: The report is stored in the system with the image and details.
Step 5: The issue becomes visible on the community dashboard.
Step 6: Municipal authorities can review and prioritize repairs.

TECHNOLOGY USED
Artificial Intelligence and Computer Vision for pothole detection, Frontend web technologies, Backend APIs, Databases, Object storage (MinIO), Dashboards for visualization.

TYPES OF ISSUES THAT CAN BE REPORTED
Potholes, Road cracks or damage, Garbage dumping, Broken streetlights, Water leakage, Damaged public infrastructure.

USER TYPES
1. Citizens - can report issues and view community reports.
2. Administrators - can monitor reports and analyze infrastructure problems.

HOW TO REPORT AN ISSUE
1. Open the Rashtra platform.
2. Upload an image of the infrastructure problem.
3. Add location details and a short description.
4. Submit the report.
The system will analyze the image and create a report.

IMPORTANT RULES
- Always respond clearly and professionally.
- Provide helpful information about Rashtra and civic reporting.
- If a user asks how to report an issue, guide them step-by-step.
- Keep answers concise and easy to understand.
- Focus only on civic issues, infrastructure problems, and the Rashtra platform.
- If a question is unrelated to Rashtra or civic services, politely redirect back to relevant topics.
- Emergency contact: 100 (Police), 108 (Ambulance), Solapur Municipal Corporation: 0217-274-0300.

GOAL
Help citizens understand the Rashtra platform, encourage civic participation, and make infrastructure reporting simple and effective.`;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<'lang_select' | 'chat'>('lang_select');
  const [language, setLanguage] = useState<LangCode>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isTyping]);

  const startChat = (lang: LangCode) => {
    setLanguage(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    const greeting: Message = {
      id: 'greeting-1',
      text: GREETING[lang],
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([greeting]);
    setPhase('chat');
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as LangCode | null;
      if (saved && ['en', 'mr', 'hi'].includes(saved)) {
        startChat(saved);
      } else {
        setPhase('lang_select');
      }
    }
  };

  const handleChangeLanguage = (lang: LangCode) => {
    setLanguage(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    setShowLangPicker(false);
    const labels = { en: 'Language changed to English.', mr: 'भाषा मराठीमध्ये बदलली.', hi: 'भाषा हिंदी में बदली गई।' };
    const systemMsg: Message = {
      id: `lang-${Date.now()}`,
      text: '🌐 ' + labels[lang],
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, systemMsg]);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    const question = inputValue;
    setInputValue('');
    setIsTyping(true);

    const history: GeminiMessage[] = messages
      .filter(m => !m.id.startsWith('greeting') && !m.id.startsWith('lang-'))
      .map(m => ({ role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model', text: m.text }));

    const langInstruction = LANG_INSTRUCTION[language];
    const enhancedQ = `[${langInstruction}]\n\n${question}`;

    try {
      const responseText = await chatWithGemini(enhancedQ, history, SYSTEM_PROMPT);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting. For urgent help, call 0217-274-0300.",
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const currentLang = LANGUAGES.find(l => l.code === language)!;

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-20 right-4 bg-[#0A3D62] text-white p-4 rounded-full shadow-lg hover:bg-[#083252] transition-all z-40 animate-bounce-slow"
        >
          <MessageCircle size={28} />
        </button>
      )}

      <div
        className={`fixed bottom-20 right-4 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        {/* Header */}
        <div className="bg-[#0A3D62] p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg"><Bot size={20} /></div>
            <div>
              <h3 className="font-bold text-sm">Rashtra AI</h3>
              <p className="text-[10px] opacity-80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Gemini AI · Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phase === 'chat' && (
              <div className="relative">
                <button
                  onClick={() => setShowLangPicker(v => !v)}
                  className="flex items-center gap-1 text-[11px] font-semibold bg-white/15 hover:bg-white/25 px-2 py-1 rounded-lg transition-colors"
                >
                  <Globe size={12} /> {currentLang.nativeLabel}
                </button>
                {showLangPicker && (
                  <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20 min-w-[140px]">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleChangeLanguage(lang.code)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${language === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0A3D62] dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.nativeLabel}</span>
                        {language === lang.code && <span className="ml-auto text-[10px]">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => { setIsOpen(false); setShowLangPicker(false); }} className="hover:bg-white/10 p-1 rounded transition-colors">
              <Minimize2 size={18} />
            </button>
          </div>
        </div>

        {/* Language Selection */}
        {phase === 'lang_select' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 space-y-4">
            <div className="bg-[#0A3D62]/10 dark:bg-[#0A3D62]/30 p-4 rounded-full">
              <Globe size={32} className="text-[#0A3D62] dark:text-blue-400" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 dark:text-white">Choose Language</h3>
              <p className="text-xs text-gray-500 mt-1">भाषा निवडा / भाषा चुनें</p>
            </div>
            <div className="w-full space-y-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => startChat(lang.code)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#0A3D62]/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{lang.nativeLabel}</p>
                      <p className="text-[10px] text-gray-400">{lang.label}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0A3D62] dark:group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat */}
        {phase === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 h-80" onClick={() => setShowLangPicker(false)}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-[#0A3D62] text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                    <div className={`text-[9px] mt-1 opacity-70 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-600 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={language === 'en' ? 'Ask me anything...' : language === 'mr' ? 'काहीही विचारा...' : 'कुछ भी पूछें...'}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D62]/50"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="p-2 w-10 h-10 rounded-xl flex items-center justify-center bg-[#0A3D62] text-white hover:bg-[#083252] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Chatbot;
