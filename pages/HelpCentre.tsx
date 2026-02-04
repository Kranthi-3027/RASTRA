import React from 'react';
import { ArrowLeft, Mail, AlertTriangle, HelpCircle, FileText, Shield, MapPin, Smartphone, UserX } from 'lucide-react';
import { useNavigate, Link } from '../components/UI.tsx';
import { Button, Card } from '../components/UI.tsx';

const HelpCentre = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-24 md:pb-12 pt-6 px-4 md:px-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/user/settings')} className="!p-2 rounded-full">
          <ArrowLeft size={24} />
        </Button>
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white font-display">Help Centre</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">We’re here to help you use the platform effectively.</p>
        </div>
      </div>

      <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
        
        {/* Intro */}
        <Card className="p-6 bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800">
           <h2 className="text-lg font-bold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
             <HelpCircle size={20} /> Welcome to the Rashtra Help Centre
           </h2>
           <p className="font-medium">
             We’re here to help you use the platform effectively and responsibly. Below you'll find answers to common questions.
           </p>
        </Card>

        {/* Getting Started */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Getting Started</h2>
           
           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200">What is Rashtra?</h3>
               <p>Rashtra is a civic-technology platform that allows citizens to report:</p>
               <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
                   <li>Potholes and road damage</li>
                   <li>Flooding or waterlogging</li>
                   <li>Public road hazards</li>
               </ul>
               <p className="text-sm text-gray-500">Reports are analyzed using AI and shared with administrators or authorities to help improve road safety.</p>
           </div>

           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200">Who can use Rashtra?</h3>
               <p>Anyone aged 13 years or above can use Rashtra by creating an account and agreeing to our Terms of Service.</p>
           </div>
        </section>

        {/* Reporting an Issue */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Reporting an Issue</h2>
           
           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200">How do I report a road issue?</h3>
               <ol className="list-decimal pl-5 space-y-1 marker:font-bold marker:text-gray-500">
                   <li>Open the Rashtra app or website</li>
                   <li>Select <strong>Report Issue</strong></li>
                   <li>Capture or upload a photo/video</li>
                   <li>Allow location access (required)</li>
                   <li>Add a brief description</li>
                   <li>Submit the report</li>
               </ol>
           </div>

           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2"><MapPin size={16} className="text-rastha-primary"/> Why is location required?</h3>
               <p>Location helps accurately identify where the issue exists so that authorities can take action. Location is collected only at the time of reporting.</p>
           </div>

           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200">What happens after I submit a report?</h3>
               <ul className="list-disc pl-5 space-y-1">
                   <li>The report is analyzed using AI</li>
                   <li>Severity is classified</li>
                   <li>It appears on the admin dashboard</li>
                   <li>Authorities may review and act on it</li>
               </ul>
               <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-yellow-800 dark:text-yellow-400 inline-block">⚠️ Action timelines depend on the responsible authorities.</p>
           </div>
        </section>

        {/* AI & Accuracy */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">AI & Accuracy</h2>
           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200">Is AI always accurate?</h3>
               <p>No. AI helps with classification and prioritization but may not always be 100% accurate. Human review may be involved where required.</p>
           </div>
        </section>

        {/* False or Rejected Reports */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">False or Rejected Reports</h2>
           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200">Why was my report rejected or removed?</h3>
               <p>Reports may be removed if they are:</p>
               <ul className="list-disc pl-5 space-y-1 marker:text-red-500">
                   <li>False or misleading</li>
                   <li>Spam or duplicate</li>
                   <li>Offensive or illegal</li>
                   <li>Technically invalid (blurred image, wrong location)</li>
               </ul>
               <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-2">⚠️ Repeated false reporting may lead to account suspension or legal action as per the Terms of Service.</p>
           </div>
        </section>

        {/* Account & Privacy */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Account & Privacy</h2>
           <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2">
                        <UserX size={18} /> How do I delete my account?
                    </h3>
                    <p className="text-sm">You can request account deletion by emailing us from your registered email ID.</p>
                </Card>
                <Card className="p-4">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2">
                        <Shield size={18} /> Is my data safe?
                    </h3>
                    <p className="text-sm">Yes. Rashtra uses industry-standard security practices and secure cloud infrastructure. For details, please read our Privacy Policy.</p>
                </Card>
           </div>
        </section>

        {/* Legal & Policy */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Legal & Policy</h2>
           <div className="grid md:grid-cols-2 gap-4">
               <Link to="/user/privacy" className="block group">
                   <Card className="p-4 h-full border hover:border-rastha-primary transition-colors">
                       <h3 className="font-bold text-rastha-primary dark:text-blue-400 mb-1 flex items-center gap-2">
                           <Shield size={18} /> Privacy Policy
                       </h3>
                       <p className="text-sm text-gray-600 dark:text-gray-400">Explains how your data is handled.</p>
                   </Card>
               </Link>
               <Link to="/user/terms" className="block group">
                   <Card className="p-4 h-full border hover:border-rastha-primary transition-colors">
                       <h3 className="font-bold text-rastha-primary dark:text-blue-400 mb-1 flex items-center gap-2">
                           <FileText size={18} /> Terms of Service
                       </h3>
                       <p className="text-sm text-gray-600 dark:text-gray-400">Explains usage rules and legal responsibilities.</p>
                   </Card>
               </Link>
           </div>
           <p className="text-sm text-gray-500 italic">Using Rashtra means you agree to both.</p>
        </section>

        {/* Troubleshooting */}
        <section className="space-y-4">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Troubleshooting</h2>
           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2"><Smartphone size={18}/> App not working properly?</h3>
               <p>Try the following:</p>
               <ul className="list-disc pl-5 space-y-1">
                   <li>Check your internet connection</li>
                   <li>Restart the app</li>
                   <li>Log out and log in again</li>
               </ul>
           </div>
           <div className="space-y-3">
               <h3 className="font-bold text-gray-800 dark:text-gray-200">Can I edit or delete a submitted report?</h3>
               <p>Currently, reports cannot be edited after submission. For serious corrections, please contact support.</p>
           </div>
        </section>

        {/* Contact Support */}
        <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact Support</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">If you need help or have concerns, contact us at:</p>
            <a href="mailto:kranthikumar3072007@gmail.com" className="flex items-center gap-2 text-rastha-primary dark:text-blue-400 font-bold hover:underline mb-2">
                <Mail size={18} /> kranthikumar3072007@gmail.com
            </a>
            <p className="text-xs text-gray-500">We usually respond within 24–72 hours.</p>
        </section>

        {/* Important Notice */}
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 flex items-start gap-3">
            <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={24} />
            <div>
                <h3 className="font-bold text-red-800 dark:text-red-400">Important Notice</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                    Rashtra is not an emergency service. For emergencies, contact local emergency services immediately.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default HelpCentre;