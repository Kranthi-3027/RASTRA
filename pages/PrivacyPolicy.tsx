import React from 'react';
import { ArrowLeft, Shield, Mail } from 'lucide-react';
import { useNavigate } from '../components/UI.tsx';
import { Button, Card } from '../components/UI.tsx';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-24 md:pb-12 pt-6 px-4 md:px-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/user/settings')} className="!p-2 rounded-full">
          <ArrowLeft size={24} />
        </Button>
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white font-display">Privacy Policy</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Last Updated: 2/19/2026</p>
        </div>
      </div>

      <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
        
        {/* Intro */}
        <Card className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
           <p className="font-medium">
             Rashtra (“we”, “our”, “us”) respects your privacy and is committed to protecting the personal data of its users. This Privacy Policy explains how we collect, use, store, and protect information when you use the Rashtra platform, including its website, mobile application, and related services.
           </p>
        </Card>

        {/* Sections */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
             1. Information We Collect
           </h2>
           <p>We collect information only when it is necessary to provide our services.</p>
           
           <div className="pl-4 space-y-4">
               <div>
                   <h3 className="font-bold text-gray-800 dark:text-gray-200">a. Personal Information</h3>
                   <ul className="list-disc pl-5 space-y-1 mt-1 marker:text-rastha-primary">
                       <li>Name</li>
                       <li>Email address</li>
                       <li>Phone number (if provided)</li>
                       <li>User authentication details (via Firebase or similar services)</li>
                   </ul>
               </div>
               <div>
                   <h3 className="font-bold text-gray-800 dark:text-gray-200">b. Location Data</h3>
                   <ul className="list-disc pl-5 space-y-1 mt-1 marker:text-rastha-primary">
                       <li>Approximate or precise location only when reporting road issues</li>
                       <li>Location is used strictly for identifying and resolving reported infrastructure problems</li>
                   </ul>
               </div>
               <div>
                   <h3 className="font-bold text-gray-800 dark:text-gray-200">c. Media & Report Data</h3>
                   <ul className="list-disc pl-5 space-y-1 mt-1 marker:text-rastha-primary">
                       <li>Photos or videos uploaded while reporting road damage, potholes, flooding, or hazards</li>
                       <li>Description and severity of the reported issue</li>
                   </ul>
               </div>
               <div>
                   <h3 className="font-bold text-gray-800 dark:text-gray-200">d. Technical Information</h3>
                   <ul className="list-disc pl-5 space-y-1 mt-1 marker:text-rastha-primary">
                       <li>Device type and operating system</li>
                       <li>App version or browser type</li>
                       <li>IP address (used for security, analytics, and abuse prevention)</li>
                       <li>Log data related to app usage and errors</li>
                   </ul>
               </div>
           </div>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. How We Use Your Information</h2>
           <p>We use collected data only for legitimate purposes, including:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Reporting and mapping road damage and infrastructure issues</li>
               <li>Verifying and categorizing reports using AI models</li>
               <li>Displaying issues on dashboards for authorities or administrators</li>
               <li>Improving app performance, accuracy, and user experience</li>
               <li>Preventing spam, misuse, or fraudulent reporting</li>
           </ul>
           <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 text-sm font-bold text-red-700 dark:text-red-400 mt-2 flex items-center gap-2">
               <Shield size={16} /> 🚫 We do NOT sell, rent, or trade user data to third parties.
           </div>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. AI & Automated Processing</h2>
           <p>Rashtra uses AI systems for:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Detecting potholes, cracks, flooding, or hazards from images</li>
               <li>Classifying severity levels</li>
               <li>Prioritizing reports for faster action</li>
           </ul>
           <p className="text-sm italic">These systems do not make legal or punitive decisions about users.</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Data Storage & Security</h2>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>User data is securely stored using cloud infrastructure (e.g., Firebase or equivalent)</li>
               <li>Industry-standard security measures are used to protect data</li>
               <li>Access is restricted to authorized administrators only</li>
           </ul>
           <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-yellow-800 dark:text-yellow-400">⚠️ While we strive for maximum security, no system is 100% secure.</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Data Sharing</h2>
           <p>We may share limited data only with:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Government bodies or municipal authorities (for issue resolution)</li>
               <li>Law enforcement only if legally required</li>
           </ul>
           <p className="font-semibold">We never share personal data for advertising or marketing purposes.</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. User Rights</h2>
           <p>You have the right to:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Access your personal data</li>
               <li>Request correction of inaccurate data</li>
               <li>Request deletion of your account and associated data</li>
               <li>Withdraw consent where applicable</li>
           </ul>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Data Retention</h2>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Report data may be retained for research, analytics, or public safety purposes</li>
               <li>Personal identifiers are minimized or anonymized where possible</li>
               <li>Accounts inactive for long periods may be deleted</li>
           </ul>
        </section>

        

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">8. Third-Party Services</h2>
           <p>Rashtra may use trusted third-party services (e.g., authentication, maps, analytics). These services follow their own privacy policies, and we recommend reviewing them.</p>
        </section>

        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">9. Changes to This Policy</h2>
           <p>We may update this Privacy Policy from time to time. Changes will be reflected on this page with an updated “Last Updated” date.</p>
        </section>

        {/* Contact */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">10. Contact Us</h2>
            <p className="mb-2">If you have questions or concerns about this Privacy Policy, contact us at:</p>
            <a href="mailto:kranthikumar3072007@gmail.com" className="flex items-center gap-2 text-rastha-primary dark:text-blue-400 font-bold hover:underline">
                <Mail size={18} /> kranthikumar3072007@gmail.com
            </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;