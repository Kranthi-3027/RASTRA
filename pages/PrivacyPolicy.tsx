import React from 'react';
import { ArrowLeft, Shield, Mail } from 'lucide-react';
import { useNavigate, useTranslation } from '../components/UI.tsx';
import { Button, Card } from '../components/UI.tsx';

const PrivacyPolicy = () => {
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
           <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white font-display">{t('privacyPolicy')}</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">{t('lastUpdated')}: 2/19/2026</p>
        </div>
      </div>

      <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
        
        {/* Intro */}
        <Card className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
           <p className="font-medium">
             {t('privacyIntro')}
           </p>
        </Card>

        {/* Sections */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
             {t('infoCollect')}
           </h2>
           <p>{t('infoCollectDesc')}</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dataUsage')}</h2>
           <p>{t('dataUsageDesc')}</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('aiProcessing')}</h2>
           <p>{t('aiProcessingDesc')}</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dataSecurity')}</h2>
           <p>{t('dataSecurityDesc')}</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('userRights')}</h2>
           <p>{t('userRightsDesc')}</p>
        </section>

        {/* Contact */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('contactUs')}</h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Data Protection Officer</p>
                <a href="mailto:grievance.rashtra@smc.gov.in" className="flex items-center gap-2 text-rastha-primary dark:text-blue-400 font-semibold hover:underline text-sm">
                    <Mail size={16} /> grievance.rashtra@smc.gov.in
                </a>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Grievance Redressal Officer</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Municipal Commissioner's Office</p>
                <p className="text-xs text-gray-500">Solapur Municipal Corporation, Maharashtra — 413 001</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">RTI Officer</p>
                <p className="text-xs text-gray-500">Under Right to Information Act, 2005 — Requests may be filed at the Corporation Office.</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;