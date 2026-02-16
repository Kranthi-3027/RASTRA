import React from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { useNavigate, useTranslation } from '../components/UI.tsx';
import { Button, Card } from '../components/UI.tsx';

interface DisclaimerProps {
  backPath?: string;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ backPath }) => {
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
             Disclaimer
           </h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Official Dashboard Platform</p>
        </div>
      </div>

      <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
            <Card className="p-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-full shadow-sm">
                        <Eye size={24} className="text-rastha-primary dark:text-white"/>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Legal Disclaimer</h2>
                </div>
                
                <ul className="space-y-4 text-base">
                    <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2.5 shrink-0"></span>
                        <span>The information and services provided through the Rashtra dashboard are intended solely for official operational and administrative purposes.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2.5 shrink-0"></span>
                        <span>Data displayed is based on submissions and system processing and may be subject to verification.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2.5 shrink-0"></span>
                        <span>The platform administrators are not responsible for inaccuracies caused by incorrect user inputs or delayed updates.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2.5 shrink-0"></span>
                        <span>System availability may be temporarily interrupted due to maintenance, upgrades, or technical issues.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 shrink-0"></span>
                        <span className="font-bold text-red-600 dark:text-red-400">Unauthorized use or distribution of dashboard data is strictly prohibited.</span>
                    </li>
                </ul>
            </Card>
      </div>
    </div>
  );
};

export default Disclaimer;