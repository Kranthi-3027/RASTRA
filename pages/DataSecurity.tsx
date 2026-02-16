import React from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate, useTranslation } from '../components/UI.tsx';
import { Button } from '../components/UI.tsx';

interface DataSecurityProps {
  backPath?: string;
}

const DataSecurity: React.FC<DataSecurityProps> = ({ backPath }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      window.history.back();
    }
  };

  return (
    <div className="pb-24 md:pb-12 pt-6 px-4 md:px-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={handleBack} className="!p-2 rounded-full">
          <ArrowLeft size={24} />
        </Button>
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white font-display">
             Data Security Statement
           </h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Official Dashboard Platform</p>
        </div>
      </div>

      <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
            <section className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                    <Lock size={32} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"/>
                    <p className="font-medium text-emerald-900 dark:text-emerald-100 text-sm">
                        Rashtra is committed to maintaining a secure digital environment for all authorized users. The platform follows industry-standard security practices to protect operational data, system integrity, and user access.
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h3 className="font-bold text-sm uppercase text-gray-500 mb-4 tracking-wider">Security Measures</h3>
                        <ul className="list-disc pl-5 text-sm space-y-2">
                            <li>Role-based access control to restrict data visibility</li>
                            <li>Encrypted data transmission and secure storage practices</li>
                            <li>Authentication and session management controls</li>
                            <li>Continuous logging of critical system activities</li>
                            <li>Periodic security reviews and system monitoring</li>
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                        <div className="mb-6">
                            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 tracking-wider">Access Protection</h3>
                            <p className="text-sm">Only authorized officials and approved personnel are allowed to access dashboard functions based on assigned roles and permissions.</p>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-sm uppercase text-gray-500 mb-2 tracking-wider">Security Monitoring</h3>
                            <p className="text-sm">System activities may be monitored to detect unauthorized access, misuse, or security threats and to maintain operational accountability.</p>
                        </div>
                    </div>
                </div>
            </section>
      </div>
    </div>
  );
};

export default DataSecurity;