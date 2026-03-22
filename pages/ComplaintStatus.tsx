import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/mockApi.ts';
import { Complaint, ComplaintStatus, EscalationLevel } from '../types';
import { Card, StatusBadge, SeverityBadge, Button, useNavigate, useTranslation } from '../components/UI.tsx';
import { useCurrentUser } from '../context/UserContext';
import { ChevronRight, X, Trash2, MapPin, Calendar, Lock, Clock, AlertTriangle, ArrowUpCircle, CheckCircle2, Building, Shield } from 'lucide-react';

// ============================================================
// SLA CLOCK — live countdown, updates every second
// ============================================================
const SLAClock = ({ complaint }: { complaint: Complaint }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!complaint.slaDeadline) return null;

  const deadline = new Date(complaint.slaDeadline);
  const msLeft = deadline.getTime() - now.getTime();
  const isBreached = msLeft <= 0;
  const isWarning = !isBreached && msLeft < 6 * 60 * 60 * 1000; // < 6h left

  const totalMs = (complaint.slaHours || 48) * 60 * 60 * 1000;
  const elapsed = totalMs - Math.max(msLeft, 0);
  const progressPct = Math.min(100, (elapsed / totalMs) * 100);

  const formatCountdown = () => {
    if (isBreached) return 'SLA Breached';
    const h = Math.floor(msLeft / (1000 * 60 * 60));
    const m = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((msLeft % (1000 * 60)) / 1000);
    return `${h}h ${m}m ${s}s remaining`;
  };

  const dept = complaint.departments?.[0] || complaint.autoRoutedDept || 'Department';

  return (
    <div className={`rounded-xl border p-4 ${
      isBreached 
        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
        : isWarning 
          ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
          : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className={isBreached ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-blue-600'} />
          <span className={`text-xs font-bold uppercase tracking-wider ${isBreached ? 'text-red-700 dark:text-red-400' : isWarning ? 'text-orange-700 dark:text-orange-400' : 'text-blue-700 dark:text-blue-400'}`}>
            Response SLA
          </span>
        </div>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
          isBreached ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
          : isWarning ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 animate-pulse'
          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {formatCountdown()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            isBreached ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progressPct}%` }}
        ></div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400">
        <span className="font-semibold">{dept} Dept</span> must acknowledge by{' '}
        <span className="font-bold">{deadline.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
      </p>
      {isBreached && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
          <AlertTriangle size={12} /> Auto-escalation triggered
        </p>
      )}
    </div>
  );
};

// ============================================================
// ESCALATION CHAIN DISPLAY
// ============================================================
const EscalationChain = ({ complaint }: { complaint: Complaint }) => {
  const level = complaint.escalationLevel || EscalationLevel.NONE;
  const history = complaint.escalationHistory || [];

  const levels = [
    { id: EscalationLevel.NONE, label: 'Department', icon: Building, color: 'bg-blue-500' },
    { id: EscalationLevel.DEPT_HEAD, label: 'Dept Head', icon: ArrowUpCircle, color: 'bg-orange-500' },
    { id: EscalationLevel.COMMISSIONER, label: 'Commissioner', icon: Shield, color: 'bg-red-500' },
    { id: EscalationLevel.STATE, label: 'State Authority', icon: AlertTriangle, color: 'bg-purple-600' },
  ];

  const currentIdx = levels.findIndex(l => l.id === level);

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Escalation Chain</p>
      
      <div className="flex items-center gap-1">
        {levels.map((lvl, idx) => {
          const isActive = idx === currentIdx;
          const isPast = idx < currentIdx;
          const IcoComponent = lvl.icon;
          return (
            <React.Fragment key={lvl.id}>
              <div className={`flex flex-col items-center flex-1 ${idx > currentIdx ? 'opacity-30' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                  isActive ? `${lvl.color} text-white ring-4 ring-offset-1 ring-current/30 scale-110` 
                  : isPast ? `${lvl.color} text-white` 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                } transition-all`}>
                  <IcoComponent size={14} />
                </div>
                <span className={`text-[9px] font-semibold mt-1 text-center leading-tight ${
                  isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                }`}>
                  {lvl.label}
                </span>
              </div>
              {idx < levels.length - 1 && (
                <div className={`flex-1 max-w-[20px] h-0.5 mb-4 ${idx < currentIdx ? levels[idx+1].color : 'bg-gray-200 dark:bg-gray-700'}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Escalation history */}
      {history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
          {history.map((entry, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <ArrowUpCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{entry.level}</span>
                <span className="mx-1">—</span>
                {entry.reason}
                <span className="block text-[10px] text-gray-400">{new Date(entry.timestamp).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {level === EscalationLevel.NONE && history.length === 0 && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-green-500" />
          Within SLA — no escalation triggered
        </p>
      )}
    </div>
  );
};

// ============================================================
// ROUTING BADGE
// ============================================================
const RoutingBadge = ({ complaint }: { complaint: Complaint }) => {
  if (!complaint.autoRoutedDept) return null;
  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl">
      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
        <Building size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Assigned Department</p>
        <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{complaint.autoRoutedDept}</p>
      </div>
    </div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
const ComplaintStatusPage = () => {
  const currentUser = useCurrentUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchComplaints = async () => {
    const data = await api.getUserComplaints(currentUser.id);
    setComplaints(data);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Refresh selected complaint when complaints list updates
  useEffect(() => {
    if (selectedComplaint) {
      const updated = complaints.find(c => c.id === selectedComplaint.id);
      if (updated) setSelectedComplaint(updated);
    }
  }, [complaints]);

  const sortedComplaints = useMemo(() => {
    return [...complaints].sort((a, b) => {
      const isARepaired = a.status === ComplaintStatus.REPAIRED;
      const isBRepaired = b.status === ComplaintStatus.REPAIRED;
      if (isARepaired && !isBRepaired) return 1;
      if (!isARepaired && isBRepaired) return -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [complaints]);

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      setLoading(true);
      try {
        await api.deleteComplaint(id, {
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: 'USER',
          reason: 'Withdrawn by citizen',
        });
        setSelectedComplaint(null);
        await fetchComplaints();
      } catch (error) {
        console.error("Delete failed", error);
        alert("Failed to delete complaint. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const isComplaintLocked = (status: ComplaintStatus) =>
    status === ComplaintStatus.ASSIGNED || status === ComplaintStatus.REPAIRED;

  return (
    <div className="pb-20 md:pb-8 pt-6 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white mb-6">{t('myComplaints')}</h1>

      {sortedComplaints.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <p>{t('noComplaints')}</p>
          <Button variant="ghost" className="mt-4 text-rastha-primary" onClick={() => navigate('/user/report')}>
            {t('startReporting')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedComplaints.map(c => {
            // Determine SLA urgency for card indicator
            const hasDeadline = !!c.slaDeadline;
            const msLeft = hasDeadline ? new Date(c.slaDeadline!).getTime() - Date.now() : Infinity;
            const isBreached = hasDeadline && msLeft <= 0;
            const isWarning = hasDeadline && !isBreached && msLeft < 6 * 60 * 60 * 1000;
            const isEscalated = c.escalationLevel && c.escalationLevel !== EscalationLevel.NONE;

            return (
              <Card
                key={c.id}
                className="flex p-4 items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group hover:shadow-md border border-gray-100 dark:border-gray-700 relative overflow-hidden"
                onClick={() => setSelectedComplaint(c)}
              >
                {/* SLA urgency left border */}
                {isBreached && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                {isWarning && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>}

                <img src={c.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-gray-200 dark:bg-gray-700 shrink-0" alt="thumb" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-rastha-primary transition-colors">{c.id}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.description}</p>

                  {/* Dept routing tag */}
                  {c.autoRoutedDept && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded mt-1">
                      <Building size={9} /> {c.autoRoutedDept}
                    </span>
                  )}

                  {/* Escalation badge */}
                  {isEscalated && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded mt-1 ml-1">
                      <ArrowUpCircle size={9} /> Escalated
                    </span>
                  )}

                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar size={10} />
                    {c.timestamp.toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-rastha-primary transition-colors shrink-0" size={20} />
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-slide-up sm:animate-none">

            {/* Modal Header/Image */}
            <div className="relative h-56 shrink-0 bg-gray-100 dark:bg-gray-700">
              <img src={selectedComplaint.imageUrl} className="w-full h-full object-cover" alt="Evidence" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/60"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold">#{selectedComplaint.id}</h2>
                <div className="flex items-center gap-2 text-xs opacity-90 mt-1">
                  <Calendar size={12} />
                  {selectedComplaint.timestamp.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex justify-between items-center">
                <StatusBadge status={selectedComplaint.status} />
                <SeverityBadge severity={selectedComplaint.severity} />
              </div>

              {/* Location */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl flex items-start gap-3 border border-gray-100 dark:border-gray-700">
                <MapPin size={18} className="text-rastha-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">{t('location')}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{selectedComplaint.address}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2 dark:text-gray-200 text-xs uppercase text-gray-500">{t('description')}</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-xl">
                  {selectedComplaint.description || "No specific description provided."}
                </p>
              </div>

              {/* === AI ROUTING BADGE === */}
              <RoutingBadge complaint={selectedComplaint} />

              {/* === SLA CLOCK === */}
              {selectedComplaint.status !== ComplaintStatus.REPAIRED && (
                <SLAClock complaint={selectedComplaint} />
              )}

              {/* === ESCALATION CHAIN === */}
              <EscalationChain complaint={selectedComplaint} />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 pb-safe">
              {isComplaintLocked(selectedComplaint.status) ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-800">
                  <Lock size={18} />
                  <div className="text-xs">
                    <p className="font-bold">{t('deleteLocked')}</p>
                    <p>{t('deleteLockedDesc')}</p>
                  </div>
                </div>
              ) : (
                <Button
                  variant="danger"
                  className="w-full flex items-center justify-center gap-2 py-3"
                  onClick={() => handleDelete(selectedComplaint.id)}
                  isLoading={loading}
                >
                  <Trash2 size={18} />
                  {t('deleteComplaint')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintStatusPage;