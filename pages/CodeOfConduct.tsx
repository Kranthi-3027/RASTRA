import React from 'react';
import { ArrowLeft, FileCheck } from 'lucide-react';
import { useNavigate, useTranslation } from '../components/UI.tsx';
import { Button, Card } from '../components/UI.tsx';

interface CodeOfConductProps {
  backPath?: string;
}

const CodeOfConduct: React.FC<CodeOfConductProps> = ({ backPath }) => {
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
             User Responsibility & Code of Conduct
           </h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Official Dashboard Platform</p>
        </div>
      </div>

      <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <FileCheck size={20} className="text-rastha-primary"/>
                    <p className="font-medium">All authorized users of the Rashtra dashboard are expected to maintain responsible and ethical usage standards.</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="p-6 bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800 h-full">
                        <h3 className="font-bold text-green-800 dark:text-green-400 mb-4 text-lg border-b border-green-200 dark:border-green-800 pb-2">User Responsibilities</h3>
                        <ul className="list-disc pl-5 text-sm space-y-3 text-green-900 dark:text-green-100">
                            <li>Use the platform strictly for official and authorized purposes</li>
                            <li>Keep login credentials secure and confidential</li>
                            <li>Access only information relevant to assigned responsibilities</li>
                            <li>Ensure accuracy of uploaded reports and data</li>
                            <li>Immediately report suspected security incidents or unauthorized activity</li>
                        </ul>
                    </Card>

                    <Card className="p-6 bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800 h-full flex flex-col">
                        <h3 className="font-bold text-red-800 dark:text-red-400 mb-4 text-lg border-b border-red-200 dark:border-red-800 pb-2">Prohibited Actions</h3>
                        <ul className="list-disc pl-5 text-sm space-y-3 text-red-900 dark:text-red-100 flex-1">
                            <li>Sharing credentials or unauthorized data access</li>
                            <li>Downloading or distributing data without permission</li>
                            <li>Attempting to alter system functionality or bypass permissions</li>
                            <li>Misuse of dashboard information for personal or non-official purposes</li>
                        </ul>
                        <div className="mt-6 pt-4 border-t border-red-200 dark:border-red-800">
                            <p className="text-xs font-bold text-red-700 dark:text-red-300">Violation of these guidelines may result in suspension of access and administrative action.</p>
                        </div>
                    </Card>
                </div>
            </section>
      </div>
    </div>
  );
};

export default CodeOfConduct;