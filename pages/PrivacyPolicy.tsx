import React from 'react';
import { ArrowLeft, Shield, Mail, Lock, FileCheck, Server, Eye } from 'lucide-react';
import { useNavigate, useTranslation } from '../components/UI.tsx';
import { Button, Card } from '../components/UI.tsx';

interface PrivacyPolicyProps {
  variant?: 'citizen' | 'official';
  backPath?: string;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ variant = 'citizen', backPath }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      window.history.back(); // Fallback
    }
  };

  return (
    <div className="pb-24 md:pb-12 pt-6 px-4 md:px-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={handleBack} className="!p-2 rounded-full">
          <ArrowLeft size={24} />
        </Button>
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white font-display">
             {variant === 'official' ? 'Official Privacy Policy' : t('privacyPolicy')}
           </h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">{t('lastUpdated')}: 2/19/2026</p>
        </div>
      </div>

      {variant === 'official' ? (
        // OFFICIAL DASHBOARD POLICY CONTENT
        <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
            
            {/* 1. Purpose */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">1</span> Purpose
                </h2>
                <p>
                    Rashtra is designed as an internal governance and operational platform for authorized government officials, administrators, and associated personnel. This Privacy Policy explains how information is collected, processed, stored, and protected while using official dashboards and administrative portals.
                </p>
            </section>

            {/* 2. Scope */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">2</span> Scope
                </h2>
                <p>This policy applies only to:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Government officials and departmental users</li>
                    <li>Administrative administrators</li>
                    <li>Authorized contractors or operational staff</li>
                    <li>Verified institutional users accessing Rashtra dashboards</li>
                </ul>
                <p className="text-sm italic opacity-80">The platform is not intended for public or citizen access under this policy.</p>
            </section>

            {/* 3. Information Collected */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">3</span> Information Collected
                </h2>
                <p>Rashtra may collect the following information for official operational purposes:</p>
                
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><UserCheck size={16} /> Official Identity Information</h3>
                        <ul className="list-disc pl-4 text-sm space-y-1">
                            <li>Official email address and contact details</li>
                            <li>Employee or official ID numbers</li>
                            <li>Role and access permissions</li>
                        </ul>
                    </Card>
                    <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Server size={16} /> System & Technical Data</h3>
                        <ul className="list-disc pl-4 text-sm space-y-1">
                            <li>Login timestamps and authentication logs</li>
                            <li>IP address and device information</li>
                            <li>Browser and system configuration</li>
                            <li>Activity logs and audit trails</li>
                        </ul>
                    </Card>
                </div>
                <div className="mt-2">
                    <p className="font-bold text-sm mb-1">Operational Data:</p>
                    <ul className="list-disc pl-5 text-sm">
                        <li>Reports, files, or evidence uploaded for administrative tasks</li>
                        <li>Workflow actions and approvals</li>
                        <li>Geographic or project-related metadata</li>
                    </ul>
                </div>
            </section>

            {/* 4. Purpose of Data Processing */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">4</span> Purpose of Data Processing
                </h2>
                <p>Data is collected and used only for official and administrative purposes, including:</p>
                <ul className="grid md:grid-cols-2 gap-2 text-sm pl-2">
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div> User authentication and secure access management</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div> Role-based authorization and workflow tracking</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div> Monitoring operational performance and accountability</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div> Audit and compliance requirements</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div> Security monitoring and system integrity</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div> Improving dashboard efficiency and usability</li>
                </ul>
            </section>

            {/* 5. Access Control & Security */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">5</span> Access Control & Security
                </h2>
                <p>Rashtra enforces strong security measures, including:</p>
                <div className="flex flex-wrap gap-2">
                    {['Role-based access permissions', 'Encrypted data transmission', 'Secure storage', 'Audit logging of critical actions', 'Periodic security reviews', 'Restricted access'].map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs font-bold border border-green-100 dark:border-green-800">
                            {tag}
                        </span>
                    ))}
                </div>
            </section>

            {/* 6. Data Sharing */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">6</span> Data Sharing
                </h2>
                <p>Information is not sold, disclosed, or shared outside authorized channels. Data may only be shared:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Between authorized departments for workflow execution</li>
                    <li>With approved contractors under controlled access</li>
                    <li>When required under law or official government directives</li>
                    <li>For cybersecurity investigation or incident response</li>
                </ul>
            </section>

            {/* 7. Data Retention */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">7</span> Data Retention
                </h2>
                <p>Official data is retained according to operational, audit, and legal requirements. Data that is no longer necessary is securely archived, anonymized, or deleted following internal policies.</p>
            </section>

            {/* 8. User Responsibilities */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">8</span> User Responsibilities
                </h2>
                <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10">
                    <p className="font-bold text-sm mb-2">Authorized users must:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Maintain confidentiality of login credentials</li>
                        <li>Access only data relevant to their assigned role</li>
                        <li>Avoid unauthorized sharing or downloading of data</li>
                        <li>Report security incidents immediately to administrators</li>
                    </ul>
                </Card>
            </section>

            {/* 9. Monitoring & Audit */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">9</span> Monitoring & Audit
                </h2>
                <p>All dashboard activities may be monitored and logged for security purposes, operational transparency, compliance, and audit reviews. By accessing the platform, users acknowledge such monitoring.</p>
            </section>

            {/* Contact */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact</h2>
                <div className="flex flex-col gap-1">
                    <p className="font-bold">Rashtra System Administrator / Data Protection Team</p>
                    <a href="mailto:kranthikumar3072007@gmail.com" className="flex items-center gap-2 text-rastha-primary dark:text-blue-400 font-bold hover:underline">
                        <Mail size={18} /> kranthikumar3072007@gmail.com
                    </a>
                </div>
            </div>
        </div>
      ) : (
        // CITIZEN POLICY CONTENT (Original)
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
                <a href="mailto:kranthikumar3072007@gmail.com" className="flex items-center gap-2 text-rastha-primary dark:text-blue-400 font-bold hover:underline">
                    <Mail size={18} /> kranthikumar3072007@gmail.com
                </a>
            </div>
        </div>
      )}
    </div>
  );
};

// Helper for icon
const UserCheck = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
);

export default PrivacyPolicy;