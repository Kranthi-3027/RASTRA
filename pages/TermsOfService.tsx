import React from 'react';
import { ArrowLeft, Mail, AlertTriangle } from 'lucide-react';
import { useNavigate } from '../components/UI.tsx';
import { Button, Card } from '../components/UI.tsx';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-24 md:pb-12 pt-6 px-4 md:px-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/user/settings')} className="!p-2 rounded-full">
          <ArrowLeft size={24} />
        </Button>
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white font-display">Terms of Service</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Last Updated: 2/19/2026</p>
        </div>
      </div>

      <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
        
        {/* Intro */}
        <Card className="p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700">
           <p className="font-medium">
             By accessing or using Rashtra (“we”, “our”, “us”), including its website, mobile application, and related services, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
           </p>
        </Card>

        {/* Section 1 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
           <p>By using Rashtra, you confirm that:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>You have read and understood these Terms of Service</li>
               <li>You agree to be legally bound by them</li>
               <li>You will comply with all applicable laws and regulations of India</li>
           </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Eligibility</h2>
           <p>To use Rashtra:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>You must be at least 13 years old</li>
               <li>You must provide accurate, truthful, and complete information</li>
               <li>You must not be restricted from using the service under any law</li>
           </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Purpose of the Service</h2>
           <p>Rashtra is a civic-technology platform intended to:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Report potholes, road damage, flooding, and public infrastructure issues</li>
               <li>Assist administrators and authorities in identifying and prioritizing repairs</li>
               <li>Improve public safety using AI-assisted analysis</li>
           </ul>
           <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 text-sm font-bold text-red-700 dark:text-red-400 mt-2 flex items-center gap-2">
               <AlertTriangle size={16} /> 🚨 Rashtra is not an emergency service and should not be used for immediate rescue or life-threatening situations.
           </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. User Responsibilities</h2>
           <p>You agree to:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Submit only genuine, accurate, and truthful reports</li>
               <li>Upload images or videos that you own or have permission to use</li>
               <li>Use the platform responsibly and lawfully</li>
               <li>Avoid actions that may disrupt public systems or mislead authorities</li>
           </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Prohibited Activities</h2>
           <p>Users must not:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Submit false, misleading, malicious, or spam complaints</li>
               <li>Upload illegal, abusive, offensive, or copyrighted content</li>
               <li>Manipulate location, images, or data to fabricate incidents</li>
               <li>Attempt to hack, reverse-engineer, overload, or disrupt the platform</li>
               <li>Misuse AI systems or exploit platform vulnerabilities</li>
               <li>Use Rashtra for political propaganda, commercial misuse, or harassment</li>
           </ul>
           <p className="text-sm font-bold text-red-600 dark:text-red-400">Violation may lead to immediate action without prior notice.</p>
        </section>

        {/* Section 6 - False Complaints */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. False Complaints & Legal Consequences</h2>
           <p className="font-medium">Submission of false, fabricated, misleading, or malicious complaints is strictly prohibited.</p>
           <p>This includes:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Fake road damage or hazard reports</li>
               <li>Intentionally incorrect locations, images, or descriptions</li>
               <li>Repeated abuse of the reporting system</li>
           </ul>
           <p>In such cases, Rashtra reserves the right to:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Suspend or permanently terminate the user’s account</li>
               <li>Remove related reports and content</li>
               <li>Restrict future access to the platform</li>
           </ul>
           <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800 space-y-2 text-sm mt-2">
               <p className="font-bold text-gray-800 dark:text-gray-200">Legal Action Policy</p>
               <p>In cases involving intentional misuse, public disruption, defamation, or abuse of government-related infrastructure, Rashtra may:</p>
               <ul className="list-disc pl-5 space-y-1 marker:text-yellow-500">
                   <li>Preserve relevant logs, metadata, and user information</li>
                   <li>Report the matter to appropriate authorities</li>
                   <li>Initiate legal action under applicable laws of India, including but not limited to:
                        <ul className="list-disc pl-5 mt-1">
                            <li>The Information Technology Act, 2000</li>
                            <li>The Indian Penal Code (IPC) or its successor criminal laws</li>
                            <li>Relevant civil or criminal legal provisions</li>
                        </ul>
                   </li>
               </ul>
               <p className="italic mt-2">Users shall be solely responsible for any legal consequences arising from such actions.</p>
           </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. User Content & Permissions</h2>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Users retain ownership of the content they upload</li>
               <li>By submitting content, users grant Rashtra a non-exclusive, royalty-free, worldwide license to use the content for:
                   <ul className="list-disc pl-5 mt-1">
                       <li>Issue analysis and classification</li>
                       <li>Infrastructure reporting and dashboards</li>
                       <li>Research, analytics, and public safety purposes</li>
                   </ul>
               </li>
           </ul>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">8. AI & Automated Systems Disclaimer</h2>
           <p>Rashtra uses AI systems to:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Detect road damage and hazards from images</li>
               <li>Classify severity levels and prioritize reports</li>
           </ul>
           <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-yellow-800 dark:text-yellow-400">⚠️ AI outputs are assistive tools only and may not always be accurate. Final actions depend on human review and decisions by authorities.</p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">9. Account Suspension & Termination</h2>
           <p>Rashtra reserves the right to:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Suspend or terminate accounts violating these Terms</li>
               <li>Remove false, harmful, or abusive content</li>
               <li>Restrict access to protect platform integrity and public safety</li>
           </ul>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">10. Service Availability</h2>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Rashtra is provided on an “as-is” and “as-available” basis</li>
               <li>Continuous or error-free operation is not guaranteed</li>
               <li>Features may change, be modified, or discontinued without notice</li>
           </ul>
        </section>

        {/* Section 11 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">11. Limitation of Liability</h2>
           <p>Rashtra shall not be liable for:</p>
           <ul className="list-disc pl-5 space-y-1 marker:text-rastha-primary">
               <li>Road accidents, injuries, or damages</li>
               <li>Delays or failures in action by authorities</li>
               <li>Losses caused by third parties</li>
               <li>Decisions made based on AI-generated insights</li>
           </ul>
           <p className="font-semibold">Use of the platform is entirely at the user’s own risk.</p>
        </section>

        {/* Section 12 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">12. Privacy</h2>
           <p>Your use of Rashtra is also governed by our Privacy Policy, which explains how we collect, store, and protect user data.</p>
        </section>

        {/* Section 13 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">13. Changes to Terms</h2>
           <p>We may update these Terms of Service at any time. Continued use of Rashtra after updates constitutes acceptance of the revised terms.</p>
        </section>

        {/* Section 14 */}
        <section className="space-y-3">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">14. Governing Law & Jurisdiction</h2>
           <p>These Terms are governed by and interpreted in accordance with the laws of India. Any disputes shall be subject to the jurisdiction of courts within India.</p>
        </section>

        {/* Contact */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">15. Contact Us</h2>
            <p className="mb-2">If you have questions or concerns regarding these Terms of Service, contact us at:</p>
            <a href="mailto:kranthikumar3072007@gmail.com" className="flex items-center gap-2 text-rastha-primary dark:text-blue-400 font-bold hover:underline">
                <Mail size={18} /> kranthikumar3072007@gmail.com
            </a>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;