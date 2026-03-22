import React from 'react';
import { ArrowLeft, Mail, AlertTriangle } from 'lucide-react';
import { useNavigate, useTranslation } from '../components/UI.tsx';
import { Button, Card } from '../components/UI.tsx';

const TermsOfService = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="pb-24 md:pb-12 pt-6 px-4 md:px-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/user/settings')} className="!p-2 rounded-full">
          <ArrowLeft size={24} />
        </Button>
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white font-display">{t('termsOfService')}</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">{t('lastUpdated')}: 2/19/2026</p>
        </div>
      </div>

      <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
        
        {/* Intro */}
        <Card className="p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700">
           <p className="font-medium">
             {t('termsIntro')}
           </p>
        </Card>

        {/* Sections */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('acceptance')}</h2>
           <p>{t('acceptanceDesc')}</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('eligibility')}</h2>
           <p>{t('eligibilityDesc')}</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('purpose')}</h2>
           <p>{t('purposeDesc')}</p>
           <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 text-sm font-bold text-red-700 dark:text-red-400 mt-2 flex items-center gap-2">
               <AlertTriangle size={16} /> 🚨 {t('emergencyWarning')}
           </div>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('prohibited')}</h2>
           <p>{t('prohibitedDesc')}</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('falseComplaints')}</h2>
           <p>{t('falseComplaintsDesc')}</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('liability')}</h2>
           <p>{t('liabilityDesc')}</p>
        </section>

        {/* Contact */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('contactUs')}</h2>
            <a href="mailto:kranthikumar3072007@gmail.com" className="flex items-center gap-2 text-rastha-primary dark:text-blue-400 font-bold hover:underline">
                <Mail size={18} /> kranthikumar3072007@gmail.com
            </a>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;