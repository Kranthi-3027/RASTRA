import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Shield, Users, BarChart3, Bell, Wrench, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, HardHat, Database, Settings, MessageSquare, FileText, Lock } from 'lucide-react';
import { Card, Button, useNavigate } from '../components/UI.tsx';

interface Section {
  id: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  subtitle: string;
  content: { heading: string; body: string }[];
}

const SECTIONS: Section[] = [
  {
    id: 'overview',
    icon: BookOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    title: 'System Overview',
    subtitle: 'What RASHTRA does and how it works',
    content: [
      { heading: 'What is RASHTRA?', body: 'RASHTRA (Road And Street Hazard Tracking & Response Application) is Solapur Municipal Corporation\'s official platform for reporting, tracking, and resolving road damage and civic infrastructure issues. Citizens report issues, AI verifies them, and departments manage resolution through this portal.' },
      { heading: 'System Architecture', body: 'The platform operates in three tiers: Citizen Portal (mobile + web), Department Dashboards (per-role), and the Super Admin Command Center. All data flows through a PostgreSQL backend, with MinIO for image storage and Gemini AI for auto-analysis.' },
      { heading: 'AI Auto-Routing', body: 'Every complaint is automatically analyzed by the AI pipeline and routed to the most appropriate department based on keywords, image analysis, and location context. Routing confidence is shown on each ticket. Admins can override routing at any time.' },
    ],
  },
  {
    id: 'complaints',
    icon: FileText,
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    title: 'Complaint Lifecycle',
    subtitle: 'How complaints move through the system',
    content: [
      { heading: 'Status Flow', body: 'Complaints follow this lifecycle: Submitted → AI Verified (or Waiting List) → Workers Assigned → Repaired. Waiting List complaints require manual admin approval before entering the main workflow. Rejected complaints are soft-deleted and recoverable for 30 days.' },
      { heading: 'SLA Clock', body: 'Each complaint has an SLA (Service Level Agreement) based on severity: High severity = 24h, Medium = 48h, Low = 72h. Traffic Department complaints are capped at 12h regardless of severity. SLA breaches trigger automatic escalation.' },
      { heading: 'Auto-Escalation', body: 'If a complaint is not acknowledged within its SLA window, it escalates: Department → Dept Head → Municipal Commissioner → State Authority. All escalation events are logged with timestamps and reasons in the Audit Centre.' },
    ],
  },
  {
    id: 'departments',
    icon: HardHat,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    title: 'Department Management',
    subtitle: 'Managing departments and assignments',
    content: [
      { heading: 'Department Roles', body: 'Engineering handles road repairs, Water Supply manages pipe/drainage issues, Ward Office handles sanitation/garbage, Traffic Control manages hazard alerting and signal issues. Each department sees only their assigned complaints by default.' },
      { heading: 'Assigning Tickets', body: 'From the Admin Command Center, select any Verified complaint and click "Manage Ticket" to open the assignment panel. You can dispatch to Engineering, Ward, or manually alert Traffic. Once assigned, the complaint moves to that department\'s dashboard.' },
      { heading: 'Department Dashboard Access', body: 'The Departments page shows all 4 departments with a workload view. Each is password-protected for demo access (password: admin123). Click a department card to view its active task list and contractor assignments.' },
    ],
  },
  {
    id: 'contractors',
    icon: Wrench,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    title: 'Contractor System',
    subtitle: 'Managing service providers',
    content: [
      { heading: 'Contractor Roster', body: 'The Contractors page lists all verified service providers, their specialization, performance rating, and current workload. Admins can view full profiles including work history. Contractors with "Probation" status require closer monitoring.' },
      { heading: 'Assigning Contractors', body: 'Department officials can assign a specific contractor to a complaint from the department dashboard. Once assigned, the contractor receives the work order in their portal and can submit completion evidence.' },
      { heading: 'Contractor Portal Login', body: 'Contractors access the system via the Login page, selecting the "Official/Department" login and using the contractor credentials. The demo contractor login uses password: admin123.' },
    ],
  },
  {
    id: 'audit',
    icon: Shield,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    title: 'Audit & Compliance',
    subtitle: 'Activity logs, deletions, and appeals',
    content: [
      { heading: 'Activity Logs', body: 'Every admin and department action is logged with timestamp, actor, type, and details. Logged events include: logins, complaint assignments, deletions, restores, announcements, escalations, and appeal decisions. Logs are non-editable.' },
      { heading: 'Deleted Complaints', body: 'Complaints are never hard-deleted immediately. They enter a soft-delete state for 30 days. Admins can restore any deleted complaint within this window. After 30 days they are permanently purged. All deletions are logged with the reason provided.' },
      { heading: 'Department Appeals', body: 'Departments can raise appeals to reassign tickets they believe were misrouted. Appeals arrive in the Audit Centre → Appeals tab. Admins review them and either approve (selecting the correct department) or reject with a reason.' },
    ],
  },
  {
    id: 'data',
    icon: Database,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    title: 'Data Center & Reports',
    subtitle: 'Exports, reports, and analytics',
    content: [
      { heading: 'Monthly Reports', body: 'From the Data Center, select a month to generate a CSV report of all complaints for that period. The export includes complaint ID, timestamp, address, severity, status, assigned department, and resolution date.' },
      { heading: 'Audit Export', body: 'The Audit Data Export generates a full CSV of all admin activity logs. Useful for compliance reviews, municipal council reporting, or RTI requests.' },
      { heading: 'Department CSV Export', body: 'From the Departments page, after unlocking a department view, click "Export CSV" to download a task list for that department including ticket IDs, locations, severity, status, and timeline data.' },
    ],
  },
  {
    id: 'comms',
    icon: MessageSquare,
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    title: 'Internal Messaging',
    subtitle: 'Department-to-department communication',
    content: [
      { heading: 'Group Channel', body: 'The GROUP channel is visible to all departments. Use it for city-wide alerts, cross-department coordination, or announcements that all officials should see.' },
      { heading: 'Direct Department Channels', body: 'Each department can message any other department directly via a dedicated bilateral channel (e.g., Engineering ↔ Water). Messages are threaded per channel and persist across sessions.' },
      { heading: 'Admin Messaging', body: 'The Super Admin has access to all channels via the Messages tab in the Command Center dashboard. Admins can participate in any department channel and monitor all communications for escalation or intervention.' },
    ],
  },
  {
    id: 'broadcast',
    icon: Bell,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    title: 'Broadcast System',
    subtitle: 'Sending alerts and announcements',
    content: [
      { heading: 'Alert Levels', body: 'Three broadcast levels are available: INFO (blue) for routine updates, WARNING (orange) for situations requiring attention, and CRITICAL (red) for emergencies or immediate action required. Choose the appropriate level carefully.' },
      { heading: 'Target Audience', body: 'Broadcasts can be sent to: Everyone (citizens + officials), Officials Only (department staff only), or Citizens Only (public users only). Target selection determines who sees the announcement banner.' },
      { heading: 'Managing Active Broadcasts', body: 'Active announcements are shown in the Settings → Broadcast Console. Click the stop icon to deactivate any running broadcast. Announcements auto-expire if deactivated. All broadcasts are logged in the activity audit.' },
    ],
  },
  {
    id: 'security',
    icon: Lock,
    color: 'text-gray-600',
    bg: 'bg-gray-50 dark:bg-gray-800',
    title: 'Access & Security',
    subtitle: 'Roles, permissions, and data protection',
    content: [
      { heading: 'Role Hierarchy', body: 'Super Admin has full system access. Department officials (Engineering, Traffic, Ward, Water) have scoped access to their assigned complaints and personnel. Contractors can only see their own work orders. Citizens see only public complaint feeds.' },
      { heading: 'Data Protection', body: 'All complaint images are stored in MinIO (S3-compatible) object storage. Personal citizen data is encrypted at rest. The system is hosted on MeitY Government Cloud, compliant with the IT Act 2000 and applicable data protection policies.' },
      { heading: 'Session Management', body: 'Official sessions do not persist after logout. For demo purposes, department passwords are shown inline. In production deployment, these are replaced with LDAP/AD-integrated credentials managed by the NIC.' },
    ],
  },
];

const AdminHelpCentre = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>('overview');

  return (
    <div className="pb-24 md:pb-12 pt-6 px-4 md:px-8 max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/settings')} className="!p-2 rounded-full">
          <ArrowLeft size={24} />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white">System Documentation</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Administrator Reference — RASHTRA v1.2.4</p>
        </div>
      </div>

      {/* Quick Status Banner */}
      <div className="bg-gradient-to-r from-rastha-primary to-blue-800 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-xl">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Admin Documentation</h2>
            <p className="text-blue-200 text-sm">8 sections · Solapur Municipal Corporation</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-green-400/20 border border-green-400/30 px-3 py-1.5 rounded-full">
          <CheckCircle2 size={14} className="text-green-300" />
          <span className="text-green-200 text-xs font-bold uppercase tracking-wide">System Operational</span>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const isOpen = openSection === section.id;
          const Icon = section.icon;
          return (
            <Card key={section.id} className={`overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-rastha-primary/30 shadow-md' : 'hover:shadow-sm'}`}>
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setOpenSection(isOpen ? null : section.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center ${section.color} shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{section.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.subtitle}</p>
                  </div>
                </div>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} shrink-0 ml-4`}>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/50 animate-fade-in">
                  {section.content.map((item, i) => (
                    <div key={i} className="px-5 py-4 flex gap-4">
                      <div className="mt-1 shrink-0">
                        <ChevronRight size={14} className="text-rastha-primary dark:text-rastha-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">{item.heading}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400 font-mono">RASHTRA v1.2.4 — Solapur Municipal Corporation</p>
        <p className="text-xs text-gray-400 mt-1">Government of Maharashtra · National Informatics Centre</p>
        <p className="text-xs text-gray-400 mt-1">Support: grievance@solapur-mc.gov.in</p>
      </div>
    </div>
  );
};

export default AdminHelpCentre;
