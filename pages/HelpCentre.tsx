import React from 'react';
import { ArrowLeft, Mail, AlertTriangle, HelpCircle, FileText, Shield, MapPin, Smartphone, UserX } from 'lucide-react';
import { useNavigate, Link, useTranslation } from '../components/UI.tsx';
import { Button, Card } from '../components/UI.tsx';

const HelpCentre = () => {
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
           <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white font-display">{t('helpCenter')}</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">{t('helpIntro')}</p>
        </div>
      </div>

      <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
        
        {/* Intro */}
        <Card className="p-6 bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800">
           <h2 className="text-lg font-bold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
             <HelpCircle size={20} /> {t('helpWelcome')}
           </h2>
           <p className="font-medium">
             {t('helpIntro')}
           </p>
        </Card>

        {/* Getting Started */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{t('gettingStarted')}</h2>
           
           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200">{t('whatIsRashtra')}</h3>
               <p>{t('whatIsRashtraDesc')}</p>
           </div>
        </section>

        {/* Reporting an Issue */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{t('reportingIssue')}</h2>
           
           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200">{t('howToReport')}</h3>
               <ol className="list-decimal pl-5 space-y-1 marker:font-bold marker:text-gray-500">
                   <li>{t('step1Title')} - {t('step1Desc')}</li>
                   <li>{t('step2Title')} - {t('step2Desc')}</li>
                   <li>{t('step3Title')} - {t('step3Desc')}</li>
                   <li>{t('step4Title')} - {t('step4Desc')}</li>
               </ol>
           </div>

           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2"><MapPin size={16} className="text-rastha-primary"/> {t('locationWhy')}</h3>
               <p>{t('locationWhyDesc')}</p>
           </div>
        </section>

        {/* False or Rejected Reports */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{t('falseReports')}</h2>
           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200">{t('whyRejected')}</h3>
               <p>{t('whyRejectedDesc')}</p>
           </div>
        </section>

        {/* Troubleshooting */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{t('troubleshooting')}</h2>
           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2"><Smartphone size={18}/> {t('appNotWorking')}</h3>
               <p>{t('contactUs')}</p>
           </div>
        </section>

        {/* Legal & Policy */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">{t('systemDocumentation')}</h2>
           <div className="grid md:grid-cols-2 gap-4">
               <Link to="/user/privacy" className="block group">
                   <Card className="p-4 h-full border hover:border-rastha-primary transition-colors">
                       <h3 className="font-bold text-rastha-primary dark:text-blue-400 mb-1 flex items-center gap-2">
                           <Shield size={18} /> {t('privacyPolicy')}
                       </h3>
                   </Card>
               </Link>
               <Link to="/user/terms" className="block group">
                   <Card className="p-4 h-full border hover:border-rastha-primary transition-colors">
                       <h3 className="font-bold text-rastha-primary dark:text-blue-400 mb-1 flex items-center gap-2">
                           <FileText size={18} /> {t('termsOfService')}
                       </h3>
                   </Card>
               </Link>
           </div>
        </section>

        {/* Contact Support */}
        <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('contactUs')}</h2>
            <a href="mailto:kranthikumar3072007@gmail.com" className="flex items-center gap-2 text-rastha-primary dark:text-blue-400 font-bold hover:underline mb-2">
                <Mail size={18} /> kranthikumar3072007@gmail.com
            </a>
        </section>

        {/* Important Notice */}
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 flex items-start gap-3">
            <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={24} />
            <div>
                <h3 className="font-bold text-red-800 dark:text-red-400">{t('importantNotice')}</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                    {t('emergencyWarning')}
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default HelpCentre;