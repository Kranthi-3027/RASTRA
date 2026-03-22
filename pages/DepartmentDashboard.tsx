import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/mockApi.ts';
import { Complaint, ComplaintStatus, Severity, UserRole, DepartmentType, AdminLog, Constable, Contractor, AppealRequest } from '../types';
import { Card, Button, StatusBadge, useLocation } from '../components/UI.tsx';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'; 
import { List, Filter, CheckCircle2, AlertCircle, HardHat, RefreshCw, Calendar, ChevronDown, XCircle, Activity, Users, ThumbsUp, Flag, Lock, Trash2, Clock, Globe, Briefcase, ClipboardList, AlertTriangle, Siren, Phone, MapPin, User, Send, BadgeCheck, RotateCcw, MessageSquareWarning, MessageSquare, Loader2 } from 'lucide-react';
import { COLORS } from '../constants';
import MessagesPage from './MessagesPage.tsx';

// --- HELPER COMPONENTS (Mirrored from AdminDashboard) ---

// Workaround for react-leaflet type issues in some environments
const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;
const CircleMarkerAny = CircleMarker as any;

const getMarkerColor = (score: number) => {
  if (score >= 7.5) return COLORS.alert; 
  if (score >= 3.5) return COLORS.warning; 
  return COLORS.secondary; 
};

const MapRefresher = ({ timestamp }: { timestamp: number }) => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);
        return () => clearTimeout(timer);
    }, [timestamp, map]);
    return null;
};

const RealMap = ({ complaints, onSelect, selectedId, refreshTrigger }: { complaints: Complaint[], onSelect: (c: Complaint) => void, selectedId?: string, refreshTrigger: number }) => {
  const center: [number, number] = [17.6599, 75.9064]; 

  return (
    <div className="w-full h-[400px] md:h-[600px] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0 shadow-inner group isolate">
        <MapContainerAny key={`map-${refreshTrigger}`} center={center} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
            <MapRefresher timestamp={refreshTrigger} />
            <TileLayerAny
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="map-tiles"
            />
            {complaints.map(c => (
                <CircleMarkerAny 
                    key={c.id} 
                    center={[c.latitude, c.longitude]}
                    pathOptions={{ 
                        color: selectedId === c.id ? '#000' : '#fff',
                        fillColor: c.assignedConstable ? '#3b82f6' : getMarkerColor(c.severityScore), // Blue if police/volunteer assigned
                        fillOpacity: 0.85, 
                        weight: selectedId === c.id ? 3 : 1 
                    }}
                    radius={selectedId === c.id ? 12 : 8}
                    eventHandlers={{
                        click: () => {
                            onSelect(c);
                        }
                    }}
                >
                </CircleMarkerAny>
            ))}
        </MapContainerAny>
        
        <div className="absolute bottom-4 right-4 left-4 md:left-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-3 md:p-4 rounded-xl shadow-xl text-xs border border-gray-100 dark:border-gray-700 z-[400] flex flex-row md:flex-col justify-between md:justify-start gap-2 md:gap-0">
            <div className="hidden md:block font-bold mb-3 text-gray-700 dark:text-gray-200 uppercase tracking-wider">Severity Indicators</div>
            <div className="flex items-center gap-2 md:gap-3 md:mb-2">
                <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{background: '#3b82f6'}}></span> 
                <span className="text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Volunteer Assigned</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 md:mb-2">
                <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{background: COLORS.alert}}></span> 
                <span className="text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Critical</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 md:mb-2">
                <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{background: COLORS.warning}}></span> 
                <span className="text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Medium</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
                <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{background: COLORS.secondary}}></span> 
                <span className="text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Low</span>
            </div>
        </div>
    </div>
  );
};

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, bgClass }: any) => (
    <Card className="p-5 flex items-start justify-between border-l-4" style={{ borderLeftColor: colorClass }}>
        <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</h3>
            <p className="text-xs text-gray-400 mt-1">{subtext}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgClass}`}>
            <Icon size={24} style={{ color: colorClass }} />
        </div>
    </Card>
);

// --- DEPARTMENT AUDIT / WORK ORDER HISTORY VIEW ---
// =============================================================================
// DEPT AUDIT VIEW — shows dept's deleted complaints + option to restore within 5 days
// =============================================================================
const DeptAuditView = ({ role }: { role: UserRole }) => {
    const [deletedComplaints, setDeletedComplaints] = React.useState<any[]>([]);
    const [auditLogs, setAuditLogs] = React.useState<AdminLog[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [previewComplaint, setPreviewComplaint] = React.useState<any | null>(null);
    const [activeTab, setActiveTab] = React.useState<'logs' | 'deleted'>('logs');

    const deptId = `dept-${role}`;
    const roleLabel = String(role).replace(/_/g, ' ');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [deleted, stats] = await Promise.all([
                    api.getDeletedComplaints(),
                    api.getAdminStats(),
                ]);
                // Only show deleted by this dept
                setDeletedComplaints(deleted.filter((c: any) => c.deletedBy === deptId || c.deletedByRole === role));
                // Only show this dept's relevant logs
                setAuditLogs(stats.logs.filter((l: AdminLog) =>
                    l.details?.includes(`[${role}]`) || l.details?.includes(roleLabel)
                ));
            } catch (e) {
                console.error('DeptAuditView load error', e);
            }
            setLoading(false);
        };
        load();
    }, [role]);

    const canRestore = (deletedAt: any) => {
        const days = (Date.now() - new Date(deletedAt).getTime()) / 86400000;
        return days <= 5;
    };

    const daysAgo = (date: any) => {
        const d = (Date.now() - new Date(date).getTime()) / 86400000;
        if (d < 1) return 'today';
        return `${Math.floor(d)}d ago`;
    };

    const handleRestore = async (cid: string) => {
        if (!window.confirm("Restore this complaint to active status?")) return;
        try {
            await api.restoreComplaint(cid, { actorId: deptId, actorRole: role });
            await api.logAdminActivity('RESTORE_CASE', `[${role}] Restored complaint ${cid}`);
            setDeletedComplaints(prev => prev.filter((c: any) => c.id !== cid));
            setPreviewComplaint(null);
        } catch (e: any) { alert(e.message || 'Restore failed'); }
    };

    const TABS = [
        { id: 'logs', label: 'My Activity Log' },
        { id: 'deleted', label: `My Deletions${deletedComplaints.length > 0 ? ` (${deletedComplaints.length})` : ''}` },
    ];

    if (loading) return <div className="flex items-center justify-center p-16 text-gray-400">Loading audit data...</div>;

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Department Audit Log</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Your department's activity history and deleted complaints. Deletions are permanently logged. You can restore your own deletions within 5 days.</p>
            </div>

            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-amber-500 text-amber-700 dark:text-amber-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'logs' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Timestamp</th>
                                    <th className="px-5 py-3 font-medium">Action</th>
                                    <th className="px-5 py-3 font-medium">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {auditLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-5 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap
                                                ${log.type === 'DELETE_CASE' ? 'bg-red-100 text-red-700' :
                                                  log.type === 'RESTORE_CASE' ? 'bg-green-100 text-green-700' :
                                                  log.type === 'APPEAL_RAISED' ? 'bg-amber-100 text-amber-700' :
                                                  'bg-gray-100 text-gray-700'}`}>
                                                {log.type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-700 dark:text-gray-300 text-xs">{log.details}</td>
                                    </tr>
                                ))}
                                {auditLogs.length === 0 && (
                                    <tr><td colSpan={3} className="text-center py-10 text-gray-400">No activity logs found for your department.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'deleted' && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Complaints deleted by your department in the last 30 days. You can restore within 5 days of deletion.</p>
                    {deletedComplaints.length === 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">No deleted complaints found.</div>
                    )}
                    {deletedComplaints.map((c: any) => (
                        <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-4 items-start">
                            <button onClick={() => setPreviewComplaint(c)} className="shrink-0">
                                <img src={c.imageUrl} alt="complaint" className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-mono text-xs text-gray-500">{c.id}</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">DELETED</span>
                                    <span className="text-xs text-gray-400">{daysAgo(c.deletedAt)}</span>
                                    {!canRestore(c.deletedAt) && <span className="text-xs text-red-400">Restore window expired</span>}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{c.description || 'No description'}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{c.address}</p>
                                {c.deleteReason && <p className="text-xs text-red-500 mt-1">Reason: {c.deleteReason}</p>}
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                                <button onClick={() => setPreviewComplaint(c)} className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">View Image</button>
                                {canRestore(c.deletedAt) && (
                                    <button onClick={() => handleRestore(c.id)}
                                        className="px-3 py-1.5 text-xs bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-green-700 font-medium flex items-center gap-1">
                                        <RotateCcw size={12} /> Restore
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {previewComplaint && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewComplaint(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{previewComplaint.id}</p>
                                <p className="text-xs text-red-500">
                                    Deleted {daysAgo(previewComplaint.deletedAt)} · {Math.max(0, 30 - Math.floor((Date.now() - new Date(previewComplaint.deletedAt).getTime()) / 86400000))} days until image expiry
                                </p>
                            </div>
                            <button onClick={() => setPreviewComplaint(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><XCircle size={16} /></button>
                        </div>
                        <img src={previewComplaint.imageUrl} alt="deleted complaint" className="w-full object-contain max-h-72" />
                        <div className="p-5 space-y-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{previewComplaint.description}</p>
                            <p className="text-xs text-gray-500">{previewComplaint.address}</p>
                            <p className="text-xs text-red-500">Deleted by: {previewComplaint.deletedByName} ({previewComplaint.deletedByRole})</p>
                            {previewComplaint.deleteReason && <p className="text-xs text-gray-500">Reason: {previewComplaint.deleteReason}</p>}
                            {canRestore(previewComplaint.deletedAt) && (
                                <button onClick={() => handleRestore(previewComplaint.id)}
                                    className="mt-2 w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">
                                    <RotateCcw size={14} /> Restore Complaint
                                </button>
                            )}
                            {!canRestore(previewComplaint.deletedAt) && (
                                <div className="mt-2 w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm rounded-lg text-center">
                                    Restore window has expired (5-day limit)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const WorkOrdersHistoryView = ({ role, deptType }: { role: UserRole, deptType: DepartmentType | null }) => {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            const stats = await api.getAdminStats();
            // Client-side filter for relevant logs
            const relevantLogs = stats.logs.filter(log => {
                // Must be a repair order or delete action
                if (log.type !== 'REPAIR_ORDER' && log.type !== 'DELETE_CASE' && log.type !== 'CONTRACTOR_ASSIGN') return false;
                
                const details = (log.details || "").toLowerCase();
                const roleLower = role.toLowerCase().replace(/_/g, ' ');
                const deptLower = deptType ? deptType.toLowerCase() : "";
                // Also match the raw role enum string (e.g. WARD_OFFICE)
                const roleEnum = role.toLowerCase();

                return details.includes(roleLower) || details.includes(roleEnum) || (deptLower && details.includes(deptLower));
            });
            setLogs(relevantLogs);
            setLoading(false);
        };
        fetchLogs();
    }, [role, deptType]);

    return (
        <Card className="overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Work Order History</h3>
                    <p className="text-sm text-gray-500">Record of assignments and actions for {role.replace('_', ' ')}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
                    <ClipboardList size={20} />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-4 font-medium">Date & Time</th>
                            <th className="px-6 py-4 font-medium">Action Type</th>
                            <th className="px-6 py-4 font-medium">Description</th>
                            <th className="px-6 py-4 font-medium">Reference ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading history...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">No work orders recorded yet.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap
                                        ${log.type === 'DELETE_CASE' ? 'bg-red-100 text-red-700' : 
                                            log.type === 'REPAIR_ORDER' ? 'bg-blue-100 text-blue-700' :
                                            log.type === 'CONTRACTOR_ASSIGN' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-100 text-gray-700'}
                                        `}>
                                            {log.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 min-w-[200px]">
                                        {log.details || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                                        {log.id}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

interface DeptDashboardProps {
  role: UserRole;
}

const DepartmentDashboard: React.FC<DeptDashboardProps> = ({ role }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [constables, setConstables] = useState<Constable[]>([]); 
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorLoadError, setContractorLoadError] = useState<string | null>(null);
  const [contractorLoading, setContractorLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'main' | 'assigned' | 'work_orders' | 'alerts' | 'dept_audit' | 'messages' | 'all_complaints'>('map');
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  
  // Modals
  const [showDispatchModal, setShowDispatchModal] = useState(false); // For Traffic
  const [showContractorModal, setShowContractorModal] = useState(false); // For Engineering/Ward
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReassign, setRejectReassign] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const { pathname } = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchData = async () => {
    setIsRefreshing(true);
    // Fetch all complaints so every department sees the global verified queue
    const allData = await api.getComplaints();
    setComplaints(allData);
    // Sync selectedComplaint so status/evidence changes from contractor are reflected immediately
    setSelectedComplaint(prev => {
        if (!prev) return null;
        const updated = allData.find(c => c.id === prev.id);
        return updated || prev;
    });
    
    if (role === UserRole.TRAFFIC) {
        const cData = await api.getConstables();
        setConstables(cData);
    } else {
        setContractorLoading(true);
        setContractorLoadError(null);
        try {
            const cData = await api.getContractors();
            setContractors(cData);
            if (cData.length === 0) setContractorLoadError('No contractor teams available.');
        } catch (e: any) {
            setContractorLoadError('Failed to load contractors. Check backend connection.');
            console.error('[RASHTRA] getContractors failed:', e);
        } finally {
            setContractorLoading(false);
        }
    }

    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  // Effect to handle SideNav clicks that update the URL
  useEffect(() => {
    if (pathname.includes('tab=work_orders')) {
        if (role !== UserRole.TRAFFIC) {
            setActiveTab('work_orders');
        }
    } else if (pathname.includes('tab=assigned')) {
        if (role !== UserRole.TRAFFIC) {
            setActiveTab('assigned');
        }
    } else {
        if (pathname === '/admin/dashboard' && (activeTab === 'work_orders' || activeTab === 'assigned')) {
             setActiveTab('map'); 
        }
    }
  }, [pathname, role]);

  // Reset filter when tab changes
  useEffect(() => {
      setSelectedComplaint(null);
      if (activeTab === 'main') {
          setStatusFilter(ComplaintStatus.AUTO_VERIFIED);
      } else if (activeTab === 'assigned') {
          setStatusFilter('ALL'); 
      } else if (activeTab === 'alerts') {
          setStatusFilter('ALL');
      } else if (activeTab === 'all_complaints') {
          setStatusFilter('ALL');
          // Lazy-load all complaints the first time this tab is opened
          if (allComplaints.length === 0) {
              setLoadingAll(true);
              api.getAdminComplaints().then(data => {
                  setAllComplaints(data);
                  setLoadingAll(false);
              }).catch(() => setLoadingAll(false));
          }
      }
  }, [activeTab]);

  const currentDeptType: DepartmentType | null = useMemo(() => {
    if (role === UserRole.ENGINEERING) return 'Engineering';
    if (role === UserRole.WARD_OFFICE) return 'Ward';
    if (role === UserRole.TRAFFIC) return 'Traffic';
    if (role === UserRole.WATER_DEPT) return 'Water';
    return null;
  }, [role]);

  // Resolve assigned contractor name
  const getAssignedContractorName = (id?: string) => {
      if (!id) return null;
      const c = contractors.find(c => c.id === id);
      return c ? c.company : id;
  };

  const handleStatusUpdate = async (id: string, newStatus: ComplaintStatus) => {
    if (newStatus === ComplaintStatus.ASSIGNED) {
        await api.logAdminActivity('REPAIR_ORDER', `${role} Assigned workers to ticket ${id}`);
    } else if (newStatus === ComplaintStatus.REPAIRED) {
        await api.logAdminActivity('REPAIR_ORDER', `${role} Closed ticket ${id} as Repaired`);
    }
    await api.updateComplaintStatus(id, newStatus);
    
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    if (selectedComplaint?.id === id) {
        setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Traffic Logic
  const handleDispatchVolunteer = async (constable: Constable) => {
      if (!selectedComplaint) return;
      try {
          await api.assignConstable(selectedComplaint.id, constable.id);
          await api.logAdminActivity('CONSTABLE_DISPATCH', `Traffic dispatched volunteer ${constable.name} to ${selectedComplaint.id}`);
          setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, assignedConstable: constable, trafficAlert: true } : c));
          setSelectedComplaint(prev => prev ? { ...prev, assignedConstable: constable, trafficAlert: true } : null);
          setShowDispatchModal(false);
      } catch (e) { console.error(e); }
  };

  // Engineering/Ward Logic
  const handleAssignContractor = async (contractor: Contractor) => {
      if (!selectedComplaint) return;
      try {
          await api.assignContractor(selectedComplaint.id, contractor.id);
          await api.logAdminActivity('CONTRACTOR_ASSIGN', `${role} assigned contractor ${contractor.company} to ${selectedComplaint.id}`);
          
          setComplaints(prev => prev.map(c => {
              if (c.id !== selectedComplaint.id) return c;
              const updatedDepts = currentDeptType && !c.departments.includes(currentDeptType)
                  ? [...c.departments, currentDeptType]
                  : c.departments;
              return { ...c, status: ComplaintStatus.ASSIGNED, assignedContractorId: contractor.id, contractorAssignedDate: new Date(), departments: updatedDepts };
          }));
          
          setSelectedComplaint(prev => {
              if (!prev) return null;
              const updatedDepts = currentDeptType && !prev.departments.includes(currentDeptType)
                  ? [...prev.departments, currentDeptType]
                  : prev.departments;
              return { ...prev, status: ComplaintStatus.ASSIGNED, assignedContractorId: contractor.id, contractorAssignedDate: new Date(), departments: updatedDepts };
          });
          setShowContractorModal(false);
          alert(`Contractor ${contractor.company} assigned successfully.`);
      } catch (e) {
          console.error(e);
          alert("Failed to assign contractor.");
      }
  };

  const handleSelfDispatch = async (id: string) => {
      if (!currentDeptType) return;
      // If Department wants to assign a specific contractor
      if (role !== UserRole.TRAFFIC) {
          setShowContractorModal(true);
          return;
      }
      
      // Fallback for simple self-assign
      if (window.confirm("Confirm dispatching your team to this complaint? It will be moved to your Assigned List.")) {
          try {
              await api.assignComplaint(id, currentDeptType);
              await api.logAdminActivity('REPAIR_ORDER', `${role} Self-Dispatched team for ticket ${id}`);
              setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: ComplaintStatus.ASSIGNED, departments: [currentDeptType] } : c));
              setSelectedComplaint(null);
          } catch (e) { console.error(e); }
      }
  };

  const handleDeleteCase = async (id: string, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const reason = window.prompt("Please provide a reason for deleting this case (required):");
    if (reason === null) return; // cancelled
    try {
        await api.deleteComplaint(id, {
          actorId: `dept-${role}`,
          actorName: `${role} Department`,
          actorRole: role,
          reason: reason || 'No reason provided',
        });
        await api.logAdminActivity('DELETE_CASE', `[${role}] Deleted ticket ${id}. Reason: ${reason}`);
        setComplaints(prev => prev.filter(c => c.id !== id));
        setSelectedComplaint(null);
    } catch (e: any) { alert(e.message || 'Failed to delete'); }
  };

  const handleVerifyRepair = async (id: string) => {
    if (!window.confirm("Confirm that the repair work is complete and satisfactory? This will close the ticket.")) return;
    try {
        await api.verifyRepair(id);
        await api.logAdminActivity('WORK_COMPLETE', `${role} verified and closed repair for ticket ${id}`);
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: ComplaintStatus.REPAIRED, repairedDate: new Date() } : c));
        if (selectedComplaint?.id === id) {
            setSelectedComplaint(prev => prev ? { ...prev, status: ComplaintStatus.REPAIRED, repairedDate: new Date() } : null);
        }
    } catch (e) {
        console.error(e);
        alert("Failed to verify repair.");
    }
  };

  const handleRejectRepair = async (newContractorId?: string) => {
    if (!selectedComplaint || !rejectReason.trim()) return;
    setRejectLoading(true);
    try {
        await api.rejectRepair(selectedComplaint.id, rejectReason.trim(), newContractorId);
        await api.logAdminActivity('REPAIR_ORDER', `${role} rejected repair for ticket ${selectedComplaint.id}. Reason: ${rejectReason}`);
        const updated = {
            ...selectedComplaint,
            status: ComplaintStatus.ASSIGNED,
            repairEvidenceUrl: undefined,
            repairedDate: undefined,
            ...(newContractorId ? { assignedContractorId: newContractorId, contractorAssignedDate: new Date() } : {}),
        };
        setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updated : c));
        setSelectedComplaint(updated);
        setShowRejectModal(false);
        setRejectReason('');
        setRejectReassign(false);
    } catch (e) {
        console.error(e);
        alert("Failed to reject repair.");
    } finally {
        setRejectLoading(false);
    }
  };

  const handleRefreshComplaint = async (id: string) => {
    try {
        const fresh = await api.getComplaintById(id);
        setComplaints(prev => prev.map(c => c.id === id ? fresh : c));
        setSelectedComplaint(fresh);
    } catch (e) {
        console.error('[refreshComplaint] failed', e);
    }
  };

  const handleAppeal = async (complaint: Complaint) => {
    const deptLabel = currentDeptType || role.replace('_', ' ');
    const reason = window.prompt(`Appeal this complaint as not belonging to ${deptLabel} department.\n\nEnter reason:`);
    if (!reason) return;
    try {
      // Use currentDeptType for proper DepartmentType mapping (e.g. 'Ward' not 'WARD_OFFICE')
      const deptType: DepartmentType = currentDeptType || (role as unknown as DepartmentType);
      await api.createAppeal(complaint.id, deptType, reason);
      alert("Appeal submitted to Admin for review.");
    } catch (e: any) { alert(e.message || 'Failed to submit appeal'); }
  };

  const timeFilteredData = useMemo(() => {
    const now = new Date();
    return complaints.filter((c: Complaint) => {
        const d = new Date(c.timestamp);
        if (timeFilter === 'all') return true;
        const dDate = new Date(d.toDateString());
        const nDate = new Date(now.toDateString());
        if (timeFilter === 'today') return dDate.getTime() === nDate.getTime();
        if (timeFilter === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            return d > oneWeekAgo;
        }
        if (timeFilter === 'month') {
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(now.getDate() - 30);
            return d > oneMonthAgo;
        }
        return true;
    });
  }, [complaints, timeFilter]);

  const { mainList, assignedList, alertsList } = useMemo(() => {
      let main = [];
      let assigned = [];
      let alerts = [];

      // Main List = unclaimed verified/submitted complaints only.
      // ASSIGNED complaints with a dept owner are exclusively that dept's — hidden from all other depts.
      main = timeFilteredData.filter(c => {
          if (c.status === ComplaintStatus.AUTO_VERIFIED || c.status === ComplaintStatus.SUBMITTED) return true;
          // ASSIGNED is only visible here if this dept already owns it (will also appear in assignedList)
          // — all other depts cannot see or touch it
          if (c.status === ComplaintStatus.ASSIGNED) {
              return currentDeptType ? c.departments.includes(currentDeptType) : false;
          }
          return false;
      });

      if (currentDeptType) {
          assigned = timeFilteredData.filter(c => 
              c.departments.includes(currentDeptType) && 
              (c.status === ComplaintStatus.ASSIGNED || c.status === ComplaintStatus.REPAIRED || c.status === ComplaintStatus.PENDING_DEPT_VERIFICATION)
          );
      }

      alerts = timeFilteredData.filter(c => c.trafficAlert === true);

      return { mainList: main, assignedList: assigned, alertsList: alerts };
  }, [timeFilteredData, role, currentDeptType]);

  const viewData = useMemo(() => {
      let data = [];
      if (activeTab === 'assigned') {
          data = assignedList;
      } else if (activeTab === 'main') {
          data = mainList;
      } else if (activeTab === 'alerts') {
          data = alertsList;
      } else {
          if (role === UserRole.TRAFFIC) {
              data = [...mainList, ...alertsList];
          } else {
              data = [...mainList, ...assignedList];
          }
      }

      if (statusFilter !== 'ALL') {
          data = data.filter(c => c.status === statusFilter);
      }

      return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activeTab, mainList, assignedList, alertsList, statusFilter, role]);

  const totalMyTasks = assignedList.length;
  const pendingMain = mainList.length; 
  const myInProgress = assignedList.filter(c => c.status === ComplaintStatus.ASSIGNED).length;
  const myCompleted = assignedList.filter(c => c.status === ComplaintStatus.REPAIRED).length;
  const totalAlerts = alertsList.length;

  return (
    <div className="p-4 md:p-6 w-full space-y-6 h-full flex flex-col">
       <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
           <div>
               <h1 className="text-2xl font-bold text-rastha-primary dark:text-white capitalize">
                   {role.replace('_', ' ')} Dashboard
               </h1>
               <p className="text-gray-500 text-sm">Jurisdiction Overview</p>
           </div>
       </header>

       <div className="flex-1 overflow-y-auto space-y-6 pb-20 md:pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {role === UserRole.TRAFFIC ? (
                    <>
                        <StatCard title="Hazard Alerts" value={totalAlerts} subtext="Incoming from Admin" icon={AlertTriangle} colorClass={COLORS.alert} bgClass="bg-red-50 dark:bg-red-900/20" />
                        <StatCard title="Verified Issues" value={mainList.filter(c => c.status === ComplaintStatus.AUTO_VERIFIED).length} subtext="Global Pending" icon={CheckCircle2} colorClass={COLORS.secondary} bgClass="bg-green-50 dark:bg-green-900/20" />
                    </>
                ) : (
                    <>
                        <StatCard title="My Active Tasks" value={myInProgress} subtext="Currently Assigned" icon={Briefcase} colorClass={COLORS.primary} bgClass="bg-blue-50 dark:bg-blue-900/20" />
                        <StatCard title="Global Pending" value={pendingMain} subtext="All Verified Issues" icon={Globe} colorClass={COLORS.warning} bgClass="bg-yellow-50 dark:bg-yellow-900/20" />
                        <StatCard title="Total Work Orders" value={totalMyTasks} subtext="History & Active" icon={HardHat} colorClass="#9333ea" bgClass="bg-purple-50 dark:bg-purple-900/20" />
                        <StatCard title="My Repairs" value={myCompleted} subtext="Completed Jobs" icon={CheckCircle2} colorClass={COLORS.secondary} bgClass="bg-green-50 dark:bg-green-900/20" />
                    </>
                )}
            </div>

            <div className="flex flex-col xl:flex-row gap-6 h-full min-h-[600px] relative">
                <div className="flex-1 space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-2 md:gap-4 justify-between items-center sticky top-0 z-10">
                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar max-w-full">
                            <button onClick={() => setActiveTab('map')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'map' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>Live Map</button>
                            <button onClick={() => setActiveTab('main')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'main' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                <Globe size={14} /> Main List
                            </button>
                            {role === UserRole.TRAFFIC && (
                                <button onClick={() => setActiveTab('alerts')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'alerts' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold animate-pulse' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    <AlertTriangle size={14} /> Hazard Alerts {totalAlerts > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{totalAlerts}</span>}
                                </button>
                            )}
                            {role !== UserRole.TRAFFIC && (
                                <button onClick={() => setActiveTab('assigned')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'assigned' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    <Briefcase size={14} /> Assigned Tasks
                                </button>
                            )}
                            <button onClick={() => setActiveTab('dept_audit')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'dept_audit' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                <Activity size={14} /> Audit Log
                            </button>
                            <button onClick={() => setActiveTab('messages')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'messages' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                <MessageSquare size={14} /> Messages
                            </button>
                            <button onClick={() => setActiveTab('all_complaints')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'all_complaints' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                <List size={14} /> All Complaints
                            </button>
                        </div>
                        <div className="flex items-center gap-2 ml-auto flex-wrap sm:flex-nowrap">
                            <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-2 md:px-3 py-1.5 border border-gray-200 dark:border-gray-600">
                                <Filter size={14} className="text-gray-500 mr-2" />
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer w-28 md:w-auto">
                                    <option value="ALL">All Status</option>
                                    {role !== UserRole.TRAFFIC && activeTab === 'assigned' && <><option value={ComplaintStatus.ASSIGNED}>In Progress</option><option value={ComplaintStatus.REPAIRED}>Completed</option></>}
                                    {role !== UserRole.TRAFFIC && activeTab === 'main' && <option value={ComplaintStatus.AUTO_VERIFIED}>Verified</option>}
                                </select>
                            </div>
                            <Button variant="white" onClick={fetchData} className={`text-xs py-2 px-3 ${isRefreshing ? 'opacity-70' : ''}`}><RefreshCw size={14} className={isRefreshing ? 'animate-spin text-rastha-primary' : ''} /></Button>
                        </div>
                    </div>

                    {activeTab === 'work_orders' && role !== UserRole.TRAFFIC ? (
                        <WorkOrdersHistoryView role={role} deptType={currentDeptType} />
                    ) : activeTab === 'map' ? (
                        <RealMap complaints={viewData} selectedId={selectedComplaint?.id} onSelect={setSelectedComplaint} refreshTrigger={complaints.length} />
                    ) : activeTab === 'dept_audit' ? (
                        <DeptAuditView role={role} />
                    ) : activeTab === 'messages' ? (
                        <MessagesPage
                            currentUserId={`dept-${role}`}
                            currentUserName={`${currentDeptType || role} Official`}
                            currentDept={currentDeptType || 'Engineering'}
                        />
                    ) : activeTab === 'all_complaints' ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px]">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                <List size={16} className="text-indigo-500" />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">All City Complaints</span>
                                <span className="ml-auto text-xs text-gray-400">Read-only view — {allComplaints.length} total</span>
                            </div>
                            {loadingAll ? (
                                <div className="p-12 text-center text-gray-400 text-sm">Loading all complaints...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                            <tr>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Severity</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Department</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Date</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Location</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">View</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {allComplaints.length > 0 ? allComplaints.map((c: Complaint) => (
                                                <tr key={c.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${selectedComplaint?.id === c.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                    <td className="p-4 font-mono font-medium text-gray-900 dark:text-white">{c.id}</td>
                                                    <td className="p-4"><StatusBadge status={c.status} /></td>
                                                    <td className="p-4"><span className={`font-bold ${c.severityScore >= 7.5 ? 'text-red-600' : c.severityScore >= 3.5 ? 'text-yellow-600' : 'text-green-600'}`}>{c.severityScore.toFixed(1)}/10</span></td>
                                                    <td className="p-4 text-xs text-gray-500 dark:text-gray-400">{c.autoRoutedDept || (c.departments?.[0]) || '—'}</td>
                                                    <td className="p-4 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                                                        {new Date(c.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-4 text-gray-500 truncate max-w-[150px]">{c.address}</td>
                                                    <td className="p-4"><Button variant="ghost" className="text-xs" onClick={() => setSelectedComplaint(c)}>View</Button></td>
                                                </tr>
                                            )) : <tr><td colSpan={7} className="p-8 text-center text-gray-400">No complaints found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                        <tr>
                                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                                            {activeTab === 'alerts' && <th className="p-4 font-semibold text-red-600 dark:text-red-400">Alert Type</th>}
                                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Severity</th>
                                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Date</th>
                                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Location</th>
                                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {viewData.length > 0 ? viewData.map((c: Complaint) => (
                                            <tr key={c.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${selectedComplaint?.id === c.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                                <td className="p-4 font-mono font-medium text-gray-900 dark:text-white">{c.id}</td>
                                                {activeTab === 'alerts' && <td className="p-4"><span className="flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded text-xs font-bold uppercase w-fit"><AlertTriangle size={12} /> Hazard Alert</span></td>}
                                                <td className="p-4"><StatusBadge status={c.status} /></td>
                                                <td className="p-4"><span className={`font-bold ${c.severityScore >= 7.5 ? 'text-red-600' : c.severityScore >= 3.5 ? 'text-yellow-600' : 'text-green-600'}`}>{c.severityScore.toFixed(1)}/10</span></td>
                                                <td className="p-4 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                                                    {new Date(c.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-4 text-gray-500 truncate max-w-[150px]">{c.address}</td>
                                                <td className="p-4"><Button variant="ghost" className="text-xs" onClick={() => setSelectedComplaint(c)}>View</Button></td>
                                            </tr>
                                        )) : <tr><td colSpan={7} className="p-8 text-center text-gray-400">No pending complaints found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* DETAILS PANEL */}
                <div className={`fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col transition-transform duration-300 ease-in-out ${selectedComplaint ? 'translate-y-0' : 'translate-y-full'} xl:relative xl:inset-auto xl:z-auto xl:bg-transparent xl:w-96 xl:block xl:translate-y-0 ${!selectedComplaint ? 'xl:block hidden' : ''}`}>
                    {selectedComplaint ? (
                        <Card className="p-0 border-0 xl:border xl:border-rastha-primary xl:border-t-4 xl:dark:border-rastha-secondary shadow-lg overflow-hidden h-full flex flex-col rounded-none xl:rounded-2xl">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                <h3 className="font-bold text-gray-900 dark:text-white">Complaint Details</h3>
                                <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <span className="xl:hidden"><ChevronDown size={24} /></span><span className="hidden xl:block"><XCircle className="text-gray-400 hover:text-red-500" size={20}/></span>
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1 p-4 space-y-6">
                                {/* BEFORE / AFTER image block */}
                                {selectedComplaint.status === ComplaintStatus.PENDING_DEPT_VERIFICATION || selectedComplaint.repairEvidenceUrl ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="overflow-hidden rounded-lg bg-gray-200">
                                            <p className="text-[10px] font-bold uppercase tracking-wider bg-gray-700 text-white text-center py-1">📸 Before — User's Report</p>
                                            <img src={selectedComplaint.imageUrl} className="w-full h-36 object-cover" alt="Before" />
                                        </div>
                                        <div className="overflow-hidden rounded-lg bg-gray-200">
                                            <p className="text-[10px] font-bold uppercase tracking-wider bg-green-700 text-white text-center py-1">✅ After — Contractor's Work</p>
                                            {selectedComplaint.repairEvidenceUrl ? (
                                                <img src={selectedComplaint.repairEvidenceUrl} className="w-full h-36 object-cover" alt="After" />
                                            ) : (
                                                <div className="w-full h-36 flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                                                    <Clock size={20} />
                                                    <span>Contractor uploading...</span>
                                                    <button onClick={() => handleRefreshComplaint(selectedComplaint.id)} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border hover:bg-gray-200 text-gray-600">↻ Refresh</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <img src={selectedComplaint.imageUrl} className="w-full h-48 object-cover rounded-lg bg-gray-200" alt="evidence" />
                                )}
                                
                                {selectedComplaint.assignedContractorId && role !== UserRole.TRAFFIC && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg flex items-start gap-3">
                                        <HardHat className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" size={24} />
                                        <div>
                                            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Contractor Assigned</p>
                                            <p className="text-xs font-bold text-blue-900 dark:text-blue-100">{getAssignedContractorName(selectedComplaint.assignedContractorId)}</p>
                                            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">Assigned on: {selectedComplaint.contractorAssignedDate ? new Date(selectedComplaint.contractorAssignedDate).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Traffic Control Section */}
                                {role === UserRole.TRAFFIC && !selectedComplaint.assignedConstable && (
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2"><Siren size={16} /> Traffic Management</h4>
                                        <Button onClick={() => setShowDispatchModal(true)} className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white"><User size={14} className="mr-1"/> Dispatch Volunteer</Button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700"><span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Severity</span><div className={`text-sm font-bold mt-1 ${selectedComplaint.severityScore >= 7.5 ? 'text-red-600' : selectedComplaint.severityScore >= 3.5 ? 'text-yellow-600' : 'text-green-600'}`}>{selectedComplaint.severityScore}/10</div></div>
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700"><span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">ID</span><div className="font-mono text-sm font-bold mt-1">{selectedComplaint.id}</div></div>
                                </div>
                                <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div><span className="text-xs text-gray-500 uppercase font-bold mb-1 block">Description</span><p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{selectedComplaint.description}</p></div>
                                    <div><span className="text-xs text-gray-500 uppercase font-bold mb-1 block">Location</span><div className="text-sm flex gap-2 items-start"><Clock size={14} className="mt-0.5 text-rastha-primary"/> <span>{selectedComplaint.address}</span></div></div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pb-safe">
                                <div className="space-y-2">
                                    {role !== UserRole.TRAFFIC && (
                                        <>
                                            {/* UNOWNED COMPLAINT — only action is claiming it via contractor assignment */}
                                            {(selectedComplaint.status === ComplaintStatus.AUTO_VERIFIED || selectedComplaint.status === ComplaintStatus.SUBMITTED) && (
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" onClick={() => handleSelfDispatch(selectedComplaint.id)}>
                                                    <Briefcase size={18}/> Assign Contractor / Team
                                                </Button>
                                            )}

                                            {/* OWNED COMPLAINT ACTIONS — only shown when this dept owns it */}
                                            {currentDeptType && (selectedComplaint.departments || []).includes(currentDeptType) && (
                                                <>
                                                    {selectedComplaint.status === ComplaintStatus.ASSIGNED && (
                                                        <div className="w-full bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3 flex items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={14} className="shrink-0" />
                                                                <span>Awaiting contractor's repair evidence.</span>
                                                            </div>
                                                            <button onClick={() => handleRefreshComplaint(selectedComplaint.id)} className="text-[10px] px-2 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded font-medium shrink-0">↻ Check</button>
                                                        </div>
                                                    )}
                                                    {selectedComplaint.status === ComplaintStatus.PENDING_DEPT_VERIFICATION && (
                                                        <div className="space-y-3">
                                                            {!selectedComplaint.repairEvidenceUrl && (
                                                                <div className="w-full bg-amber-50 dark:bg-amber-900/10 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock size={14} className="shrink-0" /> Evidence not yet loaded — click refresh.
                                                                    </div>
                                                                    <button onClick={() => handleRefreshComplaint(selectedComplaint.id)} className="text-[10px] px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 text-amber-700 font-medium shrink-0">↻ Refresh</button>
                                                                </div>
                                                            )}
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Button className="w-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20" onClick={() => handleVerifyRepair(selectedComplaint.id)}>
                                                                    <CheckCircle2 size={16}/> Verify & Close
                                                                </Button>
                                                                <Button className="w-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20" onClick={() => { setShowRejectModal(true); setRejectReason(''); setRejectReassign(false); }}>
                                                                    <XCircle size={16}/> Reject Repair
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedComplaint.status === ComplaintStatus.REPAIRED && (
                                                        <Button className="w-full bg-green-600/10 text-green-700 border border-green-200 cursor-default" disabled>
                                                            <CheckCircle2 size={18}/> Completed
                                                        </Button>
                                                    )}
                                                    <div className="flex flex-col gap-2 pt-1">
                                                        <Button variant="white" className="w-full text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 border border-amber-200"
                                                            onClick={() => handleAppeal(selectedComplaint)}>
                                                            <MessageSquareWarning size={14} className="mr-1" /> Appeal to Admin
                                                        </Button>
                                                        <Button variant="white" className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={(e) => handleDeleteCase(selectedComplaint.id, e)}>
                                                            <Trash2 size={14} className="mr-1" /> Delete Task
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                    {role === UserRole.TRAFFIC && !selectedComplaint.assignedConstable && (
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowDispatchModal(true)}>
                                            <User size={18}/> Dispatch Volunteer
                                        </Button>
                                    )}
                                    {role === UserRole.TRAFFIC && selectedComplaint.assignedConstable && (
                                        <Button className="w-full bg-green-600/10 text-green-700 border border-green-200 cursor-default" disabled>
                                            <CheckCircle2 size={18}/> Volunteer Dispatched
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-gray-50/50 border-dashed border-2 rounded-none xl:rounded-2xl border-0 xl:border-2"><List size={32} className="opacity-50 mb-4" /><h3 className="text-lg font-medium">No Task Selected</h3><p className="text-sm">Select a complaint from the list or map.</p></Card>
                    )}
                </div>
            </div>

            {/* VOLUNTEER DISPATCH MODAL (TRAFFIC) */}
            {showDispatchModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20">
                            <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2"><Siren size={18} /> Select Volunteer</h3>
                            <button onClick={() => setShowDispatchModal(false)} className="p-1 hover:bg-white/50 rounded-full"><XCircle size={20} className="text-blue-900 dark:text-blue-100" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-3">
                            {constables.map(cop => (
                                <button key={cop.id} onClick={() => handleDispatchVolunteer(cop)} className="w-full flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3 group-hover:bg-white text-gray-600"><User size={20} /></div>
                                    <div className="flex-1">
                                        <div className="flex flex-col"><p className="font-bold text-gray-900 dark:text-white text-sm">{cop.name}</p><span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-1 rounded w-fit my-0.5">{cop.rank}</span></div>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{cop.badgeNumber} • {cop.currentLocation}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${cop.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{cop.status}</div>
                                    <Send size={16} className="ml-2 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CONTRACTOR ASSIGN MODAL (ENGINEERING/WARD) */}
            {/* REJECT REPAIR MODAL */}
            {showRejectModal && selectedComplaint && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
                            <h3 className="font-bold text-red-900 dark:text-red-100 flex items-center gap-2"><XCircle size={18}/> Reject Repair</h3>
                            <button onClick={() => setShowRejectModal(false)} className="p-1 hover:bg-white/50 rounded-full"><XCircle size={20} className="text-red-900 dark:text-red-100"/></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Rejecting will reset this ticket to <span className="font-bold text-amber-600">Workers Assigned</span> and clear the contractor's submitted evidence. The contractor must redo the work.</p>
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1">Reason for Rejection <span className="text-red-500">*</span></label>
                                <textarea
                                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                                    rows={3}
                                    placeholder="e.g. Pothole still visible, patch is too thin, materials look substandard..."
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="reassign-chk" checked={rejectReassign} onChange={e => setRejectReassign(e.target.checked)} className="rounded"/>
                                <label htmlFor="reassign-chk" className="text-sm text-gray-700 dark:text-gray-300">Re-assign to a different contractor</label>
                            </div>
                            {rejectReassign && (
                                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-xl p-2">
                                    {contractors.filter(c => c.id !== selectedComplaint.assignedContractorId).map(c => (
                                        <button key={c.id}
                                            onClick={() => handleRejectRepair(c.id)}
                                            disabled={rejectLoading || !rejectReason.trim()}
                                            className="w-full flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-left disabled:opacity-50">
                                            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mr-3 text-orange-600"><HardHat size={18}/></div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{c.company}</p>
                                                <p className="text-[10px] text-gray-500">{c.name} • {c.specialization} • {c.activeProjects} active</p>
                                            </div>
                                            <span className="text-yellow-500 font-bold text-sm">{c.rating} ★</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!rejectReassign && (
                                <Button
                                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                                    onClick={() => handleRejectRepair()}
                                    disabled={rejectLoading || !rejectReason.trim()}>
                                    {rejectLoading ? <><Loader2 size={16} className="animate-spin mr-2"/>Rejecting...</> : <><XCircle size={16}/> Confirm Rejection</>}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showContractorModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-orange-50 dark:bg-orange-900/20">
                            <h3 className="font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2"><HardHat size={18} /> Assign Contractor</h3>
                            <button onClick={() => setShowContractorModal(false)} className="p-1 hover:bg-white/50 rounded-full"><XCircle size={20} className="text-orange-900 dark:text-orange-100" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-3">
                            {contractorLoading ? (
                                <div className="flex items-center justify-center py-8 text-gray-400">
                                    <Loader2 size={24} className="animate-spin mr-2" />
                                    <span className="text-sm">Loading contractors...</span>
                                </div>
                            ) : contractorLoadError ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <AlertCircle size={32} className="text-red-400 mb-2" />
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{contractorLoadError}</p>
                                    <button onClick={() => fetchData()} className="mt-3 text-xs text-orange-600 underline hover:text-orange-800">Retry</button>
                                </div>
                            ) : contractors.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                                    <HardHat size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm font-medium">No contractors available</p>
                                    <p className="text-xs mt-1">Contractor teams will appear here once added by admin.</p>
                                </div>
                            ) : (
                            contractors.map(c => (
                                <button key={c.id} onClick={() => handleAssignContractor(c)} className="w-full flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all text-left group">
                                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mr-3 text-orange-600"><HardHat size={20} /></div>
                                    <div className="flex-1">
                                        <div className="flex flex-col"><p className="font-bold text-gray-900 dark:text-white text-sm">{c.company}</p><span className="text-[10px] text-gray-500">{c.name} • {c.specialization}</span></div>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{c.activeProjects} active projects</p>
                                    </div>
                                    <div className="text-yellow-500 font-bold text-sm flex items-center">{c.rating} ★</div>
                                </button>
                            ))
                            )}
                        </div>
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};

export default DepartmentDashboard;