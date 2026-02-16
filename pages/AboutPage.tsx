import React from 'react';
import { Card, Button, useNavigate, Logo, useTranslation } from '../components/UI.tsx';
import { ArrowLeft, Camera, Shield, Truck, CheckCircle2, Activity, Zap, Users } from 'lucide-react';

interface AboutPageProps {
  backPath?: string;
}

const AboutPage: React.FC<AboutPageProps> = ({ backPath }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      // Default behavior if no backPath provided
      window.history.back();
    }
  };

  return (
    <div className="pb-24 md:pb-12 pt-6 px-4 md:px-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={handleBack} className="!p-2 rounded-full">
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-rastha-primary dark:text-white tracking-tight">{t('aboutRashtra')}</h1>
      </div>

      <div className="space-y-8">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-rastha-primary to-[#06243A] rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl mb-6 shadow-inner border border-white/10">
                    <Logo className="h-16 w-auto" layout="vertical" showText={false} variant="light" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold font-display mb-4 tracking-wide">RASHTRA</h2>
                <p className="text-lg md:text-xl text-gray-300 max-w-2xl font-light">
                    {t('aboutSubtitle')}
                </p>
                <div className="mt-8 flex gap-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-mono backdrop-blur-sm border border-white/10">v1.2.4</span>
                    <span className="px-3 py-1 bg-green-500/20 rounded-full text-xs font-bold text-green-300 backdrop-blur-sm border border-green-500/30 flex items-center gap-1">
                        <Activity size={12} /> Systems Nominal
                    </span>
                </div>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 md:p-8 flex flex-col justify-center bg-white dark:bg-gray-800 border-l-4 border-l-rastha-secondary">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('ourMission')}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t('missionText')}
                </p>
            </Card>
            <Card className="p-6 md:p-8 flex flex-col justify-center bg-white dark:bg-gray-800 border-l-4 border-l-rastha-primary">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('coreTech')}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t('coreTechText')}
                </p>
            </Card>
        </div>

        {/* How It Works */}
        <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center md:text-left">{t('howItWorks')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 rounded"></div>

                {[
                    { title: t('step1Title'), icon: Camera, desc: t('step1Desc'), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                    { title: t('step2Title'), icon: Shield, desc: t('step2Desc'), color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
                    { title: t('step3Title'), icon: Truck, desc: t('step3Desc'), color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
                    { title: t('step4Title'), icon: CheckCircle2, desc: t('step4Desc'), color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
                ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative z-0 md:bg-transparent md:dark:bg-transparent md:shadow-none md:border-0 md:p-0">
                        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center ${step.bg} ${step.color} shadow-lg mb-4 ring-4 ring-white dark:ring-gray-900`}>
                            <step.icon size={32} />
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">{step.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-[200px]">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Features List */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-8 border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('keyFeatures')}</h3>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600 shrink-0">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{t('feat1Title')}</h4>
                        <p className="text-sm text-gray-500 mt-1">{t('feat1Desc')}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shrink-0">
                        <Users size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{t('feat2Title')}</h4>
                        <p className="text-sm text-gray-500 mt-1">{t('feat2Desc')}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 shrink-0">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{t('feat3Title')}</h4>
                        <p className="text-sm text-gray-500 mt-1">{t('feat3Desc')}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-400 text-sm">{t('footerRights')}</p>
            <p className="text-gray-500 text-xs mt-2">Developed for Smart City Initiative</p>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;