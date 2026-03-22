import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/mockApi.ts';
import { Complaint, ComplaintStatus, Severity, AdminStats, DepartmentType } from '../types';
import { Card, Button, StatusBadge, useNotifications } from '../components/UI.tsx';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'; 
import { List, XCircle, Clock, BarChart3, AlertCircle, CheckCircle2, HardHat, RefreshCw, Calendar, Siren, Trash2, FileCheck, History, Download, Lock, Database, LayoutGrid, Activity, Users, Flag, ThumbsUp, ChevronDown, Filter, ArrowRight, Truck, X, ChevronRight, Megaphone, AlertTriangle, CheckSquare, Square, RotateCcw, Shield, Loader2, MessageSquareWarning, MessageSquare, Zap } from 'lucide-react';
import { COLORS } from '../constants';
import MessagesPage from './MessagesPage.tsx';

// --- HELPER COMPONENTS ---

// Workaround for react-leaflet type issues in some environments
const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;
const CircleMarkerAny = CircleMarker as any;

// Severity Color Logic for OSM Dots
const getMarkerColor = (score: number) => {
  if (score >= 7.5) return COLORS.alert; // Red
  if (score >= 3.5) return COLORS.warning; // Orange
  return COLORS.secondary; // Green
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

// OpenStreetMap Component
const RealMap = ({ complaints, onSelect, selectedId, refreshTrigger }: { complaints: Complaint[], onSelect: (c: Complaint) => void, selectedId?: string, refreshTrigger: number }) => {
  // Solapur Coordinates
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
                        color: selectedId === c.id ? '#000' : '#fff', // Border color
                        fillColor: getMarkerColor(c.severityScore),    // Dot color (Red/Orange/Green)
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
        
        {/* Visual Legend for Admin */}
        <div className="absolute bottom-4 right-4 left-4 md:left-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-3 md:p-4 rounded-xl shadow-xl text-xs border border-gray-100 dark:border-gray-700 z-[400] flex flex-row md:flex-col justify-between md:justify-start gap-2 md:gap-0">
            <div className="hidden md:block font-bold mb-3 text-gray-700 dark:text-gray-200 uppercase tracking-wider">Severity Indicators</div>
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

export const AdminAudit = () => {
    const [stats, setStats] = React.useState<AdminStats | null>(null);
    const [deletedComplaints, setDeletedComplaints] = React.useState<any[]>([]);
    const [pendingAppeals, setPendingAppeals] = React.useState<any[]>([]);
    const [activeTab, setActiveTab] = React.useState<'logs' | 'deleted' | 'appeals'>('logs');
    const [previewComplaint, setPreviewComplaint] = React.useState<any | null>(null);
    const [loadingReview, setLoadingReview] = React.useState<string | null>(null);
    const [appealTargets, setAppealTargets] = React.useState<Record<string, string>>({});

    useEffect(() => {
        api.getAdminStats().then(setStats);
        api.getDeletedComplaints().then(setDeletedComplaints).catch(() => {});
        api.getAppeals('PENDING').then(setPendingAppeals).catch(() => {});
    }, []);

    const handleRestoreComplaint = async (cid: string) => {
        if (!window.confirm("Restore this complaint to active status?")) return;
        try {
            await api.restoreComplaint(cid, { actorId: 'admin', actorRole: 'ADMIN' });
            setDeletedComplaints(prev => prev.filter((c: any) => c.id !== cid));
            setPreviewComplaint(null);
        } catch (e: any) { alert(e.message || 'Restore failed'); }
    };

    const handleReviewAppeal = async (appealId: string, decision: 'APPROVED' | 'REJECTED', assignTo?: string) => {
        setLoadingReview(appealId);
        try {
            await api.reviewAppeal(appealId, decision, assignTo, 'Admin', 'ADMIN');
            setPendingAppeals(prev => prev.filter((a: any) => a.id !== appealId));
        } catch (e: any) { alert(e.message || 'Review failed'); }
        setLoadingReview(null);
    };

    const DEPARTMENTS = ['Engineering', 'Traffic', 'Ward', 'Water', 'Drainage', 'Electricity', 'Telecom'];

    const canRestore = (deletedAt: any) => {
        const days = (Date.now() - new Date(deletedAt).getTime()) / 86400000;
        return days <= 5;
    };

    const daysAgo = (date: any) => {
        const d = (Date.now() - new Date(date).getTime()) / 86400000;
        if (d < 1) return 'today';
        return `${Math.floor(d)}d ago`;
    };

    const TABS = [
        { id: 'logs', label: 'Activity Logs' },
        { id: 'deleted', label: `Deleted${deletedComplaints.length > 0 ? ` (${deletedComplaints.length})` : ''}` },
        { id: 'appeals', label: `Appeals${pendingAppeals.length > 0 ? ` (${pendingAppeals.length})` : ''}` },
    ];

    return (
        <div className="p-4 md:p-6 w-full space-y-6 animate-fade-in max-w-5xl mx-auto">
            <header>
                <h1 className="text-2xl font-bold text-rastha-primary dark:text-white">Audit Centre</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Activity logs, deleted complaint records (30 days), and department appeals.</p>
            </header>

            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-rastha-primary text-rastha-primary dark:text-white dark:border-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'logs' && (
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Timestamp</th>
                                <th className="px-6 py-4 font-medium">Action Type</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">Log ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {stats?.logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap
                                           ${log.type === 'DELETE_CASE' ? 'bg-red-100 text-red-700' :
                                             log.type === 'RESTORE_CASE' ? 'bg-green-100 text-green-700' :
                                             log.type === 'APPEAL_APPROVED' ? 'bg-blue-100 text-blue-700' :
                                             log.type === 'APPEAL_RAISED' ? 'bg-amber-100 text-amber-700' :
                                             log.type === 'REPAIR_ORDER' ? 'bg-blue-100 text-blue-700' :
                                             log.type === 'TRAFFIC_ALERT' ? 'bg-amber-100 text-amber-700' :
                                             log.type === 'LOGIN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {log.type.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 min-w-[200px]">{log.details || '-'}</td>
                                    <td className="px-6 py-4 text-gray-400 text-xs font-mono">{log.id}</td>
                                </tr>
                            ))}
                            {(!stats?.logs || stats.logs.length === 0) && (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No logs found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            )}

            {activeTab === 'deleted' && (
            <div className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Soft-deleted complaints from the last 30 days. Images remain accessible in MinIO until expiry. Only the deleting dept can restore within 5 days.</p>
                {deletedComplaints.length === 0 && (
                    <Card className="p-8 text-center text-gray-400">No deleted complaints in the last 30 days.</Card>
                )}
                {deletedComplaints.map((c: any) => (
                    <Card key={c.id} className="p-4 flex flex-col md:flex-row gap-4 items-start">
                        <button onClick={() => setPreviewComplaint(c)} className="shrink-0">
                            <img src={c.imageUrl} alt="complaint" className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-mono text-xs text-gray-500">{c.id}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">DELETED</span>
                                <span className="text-xs text-gray-400">{daysAgo(c.deletedAt)} · by {c.deletedByName} ({c.deletedByRole})</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{c.description || 'No description'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{c.address}</p>
                            {c.deleteReason && <p className="text-xs text-red-500 mt-1">Reason: {c.deleteReason}</p>}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => setPreviewComplaint(c)} className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">View Image</button>
                            <button onClick={() => handleRestoreComplaint(c.id)}
                                className="px-3 py-1.5 text-xs bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-green-700 font-medium flex items-center gap-1">
                                <RotateCcw size={12} /> Restore
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
            )}

            {activeTab === 'appeals' && (
            <div className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Departments have flagged these complaints as misrouted. Review and reassign to the correct department.</p>
                {pendingAppeals.length === 0 && <Card className="p-8 text-center text-gray-400">No pending appeals.</Card>}
                {pendingAppeals.map((appeal: any) => (
                    <Card key={appeal.id} className="p-5 space-y-3">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs text-gray-500">{appeal.complaintId}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">PENDING APPEAL</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                <span className="text-red-600 font-semibold">{appeal.fromDept}</span> dept flagged this as not theirs
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{appeal.reason}"</p>
                            <p className="text-xs text-gray-400 mt-1">Raised {new Date(appeal.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <select value={appealTargets[appeal.id] || ''} onChange={e => setAppealTargets(prev => ({ ...prev, [appeal.id]: e.target.value }))}
                                className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                <option value="">Approve & reassign to...</option>
                                {DEPARTMENTS.filter((d: string) => d !== appeal.fromDept).map((d: string) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <button disabled={!appealTargets[appeal.id] || loadingReview === appeal.id}
                                onClick={() => handleReviewAppeal(appeal.id, 'APPROVED', appealTargets[appeal.id])}
                                className="px-4 py-2 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg font-medium">
                                Approve & Reassign
                            </button>
                            <button disabled={loadingReview === appeal.id}
                                onClick={() => handleReviewAppeal(appeal.id, 'REJECTED')}
                                className="px-4 py-2 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg">
                                Reject
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
            )}

            {previewComplaint && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewComplaint(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{previewComplaint.id}</p>
                                <p className="text-xs text-red-500">Deleted {daysAgo(previewComplaint.deletedAt)} · {Math.max(0, 30 - Math.floor((Date.now() - new Date(previewComplaint.deletedAt).getTime()) / 86400000))} days until image expiry</p>
                            </div>
                            <button onClick={() => setPreviewComplaint(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={16} /></button>
                        </div>
                        <img src={previewComplaint.imageUrl} alt="deleted complaint" className="w-full object-contain max-h-72" />
                        <div className="p-5 space-y-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{previewComplaint.description}</p>
                            <p className="text-xs text-gray-500">{previewComplaint.address}</p>
                            <p className="text-xs text-red-500">Deleted by: {previewComplaint.deletedByName} ({previewComplaint.deletedByRole})</p>
                            {previewComplaint.deleteReason && <p className="text-xs text-gray-500">Reason: {previewComplaint.deleteReason}</p>}
                            <button onClick={() => handleRestoreComplaint(previewComplaint.id)}
                                className="mt-2 w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">
                                <RotateCcw size={14} /> Restore Complaint
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const AdminDataCenter = () => {
    const [downloadingReport, setDownloadingReport] = React.useState(false);
    const [downloadingAudit, setDownloadingAudit] = React.useState(false);
    const [selectedMonth, setSelectedMonth] = React.useState<string>(new Date().toISOString().slice(0, 7));
    const [reportMsg, setReportMsg] = React.useState<string | null>(null);
    const [auditMsg, setAuditMsg] = React.useState<string | null>(null);

    const handleMonthlyReport = async () => {
        setDownloadingReport(true);
        setReportMsg(null);
        try {
            await api.downloadMonthlyReport(selectedMonth);
            setReportMsg(`Report for ${selectedMonth} downloaded successfully.`);
        } catch (e: any) {
            setReportMsg(e.message || 'Download failed. Please try again.');
        }
        setDownloadingReport(false);
    };

    const handleAuditExport = async () => {
        setDownloadingAudit(true);
        setAuditMsg(null);
        try {
            await api.downloadAuditExport();
            setAuditMsg('Audit data exported successfully.');
        } catch (e: any) {
            setAuditMsg(e.message || 'Export failed. Please try again.');
        }
        setDownloadingAudit(false);
    };

    return (
        <div className="p-4 md:p-6 w-full space-y-6">
            <header>
               <h1 className="text-2xl font-bold text-rastha-primary dark:text-white">Data Center</h1>
               <p className="text-gray-500 dark:text-gray-400 text-sm">Download monthly reports and audit data exports.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Report */}
                <Card className="p-6 flex flex-col space-y-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <FileCheck size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white">Monthly Report</h3>
                            <p className="text-xs text-gray-500 mt-0.5">All complaints for selected month as CSV</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Select Month</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                max={new Date().toISOString().slice(0, 7)}
                                onChange={e => { setSelectedMonth(e.target.value); setReportMsg(null); }}
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={handleMonthlyReport}
                            disabled={downloadingReport}
                        >
                            {downloadingReport ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Download size={14} /> Download CSV</>}
                        </Button>
                        {reportMsg && (
                            <p className={`text-xs text-center ${reportMsg.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>{reportMsg}</p>
                        )}
                    </div>
                </Card>

                {/* Audit Export */}
                <Card className="p-6 flex flex-col space-y-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white">Audit Data Export</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Activity logs + deleted complaints (last 30 days)</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 rounded-lg p-3">
                            <p className="text-xs text-purple-700 dark:text-purple-300">Includes all admin/dept activity logs and a full record of soft-deleted complaints from the last 30 days.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={handleAuditExport}
                            disabled={downloadingAudit}
                        >
                            {downloadingAudit ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><Download size={14} /> Export Audit Data</>}
                        </Button>
                        {auditMsg && (
                            <p className={`text-xs text-center ${auditMsg.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>{auditMsg}</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'map' | 'main' | 'waiting' | 'community' | 'messages' | 'autorouted'>('map');
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
    const [statusFilter, setStatusFilter] = useState<string>(ComplaintStatus.AUTO_VERIFIED);
    const [showAssignMenu, setShowAssignMenu] = useState(false);
    const [notifyTraffic, setNotifyTraffic] = useState(true);
    // Fix: pendingAppeals must be declared here — it was only in AdminAudit, causing
    // a ReferenceError crash (blank white screen) whenever a complaint was selected.
    const [pendingAppeals, setPendingAppeals] = useState<any[]>([]);

    // Global notification system
    const { addNotification } = useNotifications();

    const fetchData = useCallback(async () => {
        setIsRefreshing(true);
        const data = await api.getAdminComplaints();
        setComplaints(prev => {
            const prevIds = new Set(prev.map(c => c.id));
            const newlyAutoRouted = data.filter(c =>
                c.autoRoutedDept &&
                c.status === ComplaintStatus.AUTO_VERIFIED &&
                !prevIds.has(c.id)
            );
            // Push each newly auto-routed complaint to global notification system
            newlyAutoRouted.forEach(c => {
                addNotification({
                    type: 'auto_routed',
                    title: 'Complaint auto-routed',
                    body: `${c.id} — ${c.address?.split(',')[0] || 'Unknown location'} has been routed to ${c.autoRoutedDept} dept (${(c.routingConfidence ? (c.routingConfidence * 100).toFixed(0) : '?')}% confidence)`,
                    complaintId: c.id,
                    dept: c.autoRoutedDept,
                });
            });
            return data;
        });
        setTimeout(() => setIsRefreshing(false), 500);
    }, [addNotification]);

    useEffect(() => {
        fetchData();
        // Load pending appeals so the detail panel can show appeal status per complaint
        api.getAppeals('PENDING').then(setPendingAppeals).catch(() => {});
    }, [fetchData]);

    // Pick up complaint opened via notification panel (cross-page navigation)
    useEffect(() => {
        const pending = sessionStorage.getItem('rashtra_open_complaint');
        if (pending && complaints.length > 0) {
            const c = complaints.find(x => x.id === pending);
            if (c) {
                setSelectedComplaint(c);
                setActiveTab('autorouted');
            }
            sessionStorage.removeItem('rashtra_open_complaint');
        }
    }, [complaints]);

    // Reset assign menu when selection changes
    useEffect(() => {
        setShowAssignMenu(false);
        // Reset notification check to default (true) every time we open a new complaint
        setNotifyTraffic(true);
    }, [selectedComplaint]);

    const handleAssignToDept = async (id: string, dept: DepartmentType) => {
        // 1. Assign Work Order (backend returns 409 if already assigned to another dept)
        const result = await api.assignComplaint(id, dept);

        // 2. Handle duplicate-assign conflict — ask admin to confirm override
        if (result.conflict) {
            const confirmed = window.confirm(
                `⚠️ This complaint is already assigned to the ${result.currentDept} department.\n\nAre you sure you want to reassign it to ${dept}? The previous department will receive a new notification.`
            );
            if (!confirmed) return;
            await api.assignComplaint(id, dept, true); // force override
        }

        await api.logAdminActivity('REPAIR_ORDER', `Assigned ticket ${id} to ${dept}`);
        
        // 3. Conditional Traffic Notification
        if (notifyTraffic) {
             await api.setTrafficAlert(id, true);
             await api.logAdminActivity('TRAFFIC_ALERT', `Auto-alert: Traffic Dept notified regarding work order ${id}`);
        }
        
        // Optimistic update
        const newStatus = ComplaintStatus.ASSIGNED;
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus, departments: [dept], trafficAlert: notifyTraffic } : c));
        
        if (selectedComplaint?.id === id) {
            setSelectedComplaint(prev => prev ? { ...prev, status: newStatus, departments: [dept], trafficAlert: notifyTraffic } : null);
        }
        setShowAssignMenu(false);
        
        if (notifyTraffic) {
            alert(`Work order assigned to ${dept} & Traffic Control notified automatically.`);
        } else {
            alert(`Work order assigned to ${dept}.`);
        }
    };

    // Manual Notify (Standalone)
    const handleNotifyTraffic = async (id: string) => {
        await api.setTrafficAlert(id, true);
        await api.logAdminActivity('TRAFFIC_ALERT', `Sent hazard notification to Traffic Dept for ticket ${id}`);
        
        // Optimistic update local state
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, trafficAlert: true } : c));
        
        alert("Traffic Department has been notified of the hazard. The ticket remains open for repair assignment.");
        setShowAssignMenu(false);
    };

    const handleStatusUpdate = async (id: string, newStatus: ComplaintStatus) => {
        if (newStatus === ComplaintStatus.REPAIRED) {
            await api.logAdminActivity('REPAIR_ORDER', `Closed ticket ${id} as Repaired`);
        } else if (newStatus === ComplaintStatus.AUTO_VERIFIED) {
            // Approval logic (Waiting -> Main)
            await api.logAdminActivity('REPAIR_ORDER', `Verified ticket ${id}`);
        }

        await api.updateComplaintStatus(id, newStatus);
        
        // Optimistic update
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
        if (selectedComplaint?.id === id) {
            setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null);
        }
    };

    const handleDeleteCase = async (id: string, e?: React.MouseEvent) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const reason = window.prompt("Admin Delete — provide reason (required). This action is permanently logged:");
        if (reason === null) return;
        try {
            await api.deleteComplaint(id, {
              actorId: 'admin',
              actorName: 'Admin',
              actorRole: 'ADMIN',
              reason: reason || 'No reason provided',
            });
            await api.logAdminActivity('DELETE_CASE', `[ADMIN] Deleted ticket ${id}. Reason: ${reason}`);
            setComplaints(prev => prev.filter(c => c.id !== id));
            setSelectedComplaint(null);
        } catch (e: any) {
            alert(e.message || "Failed to delete case.");
            console.error(e);
        }
    };

    // 1. First apply Time Filter
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

    // 2. Then apply Status Filter (Global) - Used primarily for Map and generic view, NOT for specific tabs
    const statusFilteredData = useMemo(() => {
        if (statusFilter === 'ALL') return timeFilteredData;
        return timeFilteredData.filter(c => c.status === statusFilter);
    }, [timeFilteredData, statusFilter]);

    // Stats calculations
    const totalCount = timeFilteredData.length;
    // Pending: Waiting List, Verified, or Submitted (not yet assigned or resolved/ignored)
    const pendingCount = timeFilteredData.filter((c: Complaint) => 
        c.status === ComplaintStatus.WAITING_LIST || 
        c.status === ComplaintStatus.AUTO_VERIFIED ||
        c.status === ComplaintStatus.SUBMITTED
    ).length;
    const inProgressCount = timeFilteredData.filter((c: Complaint) => c.status === ComplaintStatus.ASSIGNED).length;
    const repairedCount = timeFilteredData.filter((c: Complaint) => c.status === ComplaintStatus.REPAIRED).length;

    // 3. Finally apply Tab Logic for Table View
    const viewData = useMemo(() => {
        let data = [];
        if (activeTab === 'waiting') {
            data = timeFilteredData.filter(c => c.status === ComplaintStatus.WAITING_LIST);
        } else if (activeTab === 'community') {
            data = timeFilteredData.filter((c: any) => (c.communityReportCount || 0) > 0);
            return data.sort((a: any, b: any) => (b.communityReportCount || 0) - (a.communityReportCount || 0));
        } else if (activeTab === 'autorouted') {
            // All complaints that were auto-routed by AI, sorted newest first
            data = timeFilteredData.filter(c => c.autoRoutedDept);
            return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } else if (activeTab === 'main') {
            data = statusFilteredData.filter(c => 
                c.status !== ComplaintStatus.WAITING_LIST && 
                c.status !== ComplaintStatus.IGNORED
            );
        } else {
            data = statusFilteredData;
        }

        // Sort: Repaired at bottom, others descending by date
        return data.sort((a, b) => {
            const isARepaired = a.status === ComplaintStatus.REPAIRED;
            const isBRepaired = b.status === ComplaintStatus.REPAIRED;
            
            if (isARepaired && !isBRepaired) return 1;
            if (!isARepaired && isBRepaired) return -1;
            
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }, [activeTab, statusFilteredData, timeFilteredData]);

    return (
        <div className="p-4 md:p-6 w-full space-y-6 h-full flex flex-col">
                {/* Header */}
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-rastha-primary dark:text-white">Super Admin Command Center</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Central Municipal Oversight</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto space-y-6 pb-20 md:pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Complaints" value={totalCount} subtext={`Filtered by: ${timeFilter}`} icon={Activity} colorClass={COLORS.primary} bgClass="bg-blue-50 dark:bg-blue-900/20" />
                    <StatCard title="Pending Complaints" value={pendingCount} subtext="Awaiting Action" icon={AlertCircle} colorClass={COLORS.warning} bgClass="bg-yellow-50 dark:bg-yellow-900/20" />
                    <StatCard title="In Progress" value={inProgressCount} subtext="Workers Assigned" icon={HardHat} colorClass="#9333ea" bgClass="bg-purple-50 dark:bg-purple-900/20" />
                    <StatCard title="Repaired" value={repairedCount} subtext="Successfully Resolved" icon={CheckCircle2} colorClass={COLORS.secondary} bgClass="bg-green-50 dark:bg-green-900/20" />
                </div>

                <div className="flex flex-col xl:flex-row gap-6 h-full min-h-[600px] relative">
                    <div className="flex-1 space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-2 md:gap-4 justify-between items-center sticky top-0 z-10">
                            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar max-w-full">
                                <button onClick={() => setActiveTab('map')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'map' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>Live Heatmap</button>
                                <button onClick={() => setActiveTab('main')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'main' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>Main List</button>
                                <button onClick={() => setActiveTab('autorouted')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap relative ${activeTab === 'autorouted' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    <Zap size={14} className={activeTab === 'autorouted' ? 'text-blue-600 dark:text-blue-400' : ''} />
                                    Auto-Routed
                                    {timeFilteredData.filter(c => c.autoRoutedDept && c.status === ComplaintStatus.AUTO_VERIFIED).length > 0 && (
                                        <span className="bg-blue-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                            {timeFilteredData.filter(c => c.autoRoutedDept && c.status === ComplaintStatus.AUTO_VERIFIED).length}
                                        </span>
                                    )}
                                </button>
                                <button onClick={() => setActiveTab('waiting')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'waiting' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    Waiting List
                                </button>
                                <button onClick={() => setActiveTab('community')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'community' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    <Flag size={14} /> Community Reports
                                </button>
                                <button onClick={() => setActiveTab('messages')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'messages' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    <MessageSquare size={14} /> Messages
                                </button>
                            </div>
                            
                            {/* Filters Section */}
                            <div className="flex items-center gap-2 ml-auto flex-wrap sm:flex-nowrap">
                                {/* Status Filter */}
                                <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-2 md:px-3 py-1.5 border border-gray-200 dark:border-gray-600">
                                    <Filter size={14} className="text-gray-500 mr-2" />
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer w-28 md:w-auto">
                                        <option value="ALL">All Status</option>
                                        <option value={ComplaintStatus.AUTO_VERIFIED}>Verified</option>
                                        <option value={ComplaintStatus.ASSIGNED}>Workers Assigned</option>
                                        <option value={ComplaintStatus.REPAIRED}>Repaired</option>
                                    </select>
                                </div>

                                {/* Time Filter */}
                                <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-2 md:px-3 py-1.5 border border-gray-200 dark:border-gray-600">
                                    <Calendar size={14} className="text-gray-500 mr-2" />
                                    <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as any)} className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer w-20 md:w-auto">
                                        <option value="today">Today</option>
                                        <option value="week">Week</option>
                                        <option value="month">Month</option>
                                        <option value="all">All</option>
                                    </select>
                                </div>

                                <Button variant="white" onClick={fetchData} className={`text-xs py-2 px-3 ${isRefreshing ? 'opacity-70' : ''}`}>
                                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-rastha-primary' : ''} />
                                </Button>
                            </div>
                        </div>

                        {activeTab === 'messages' ? (
                            <MessagesPage
                                currentUserId="admin-superuser"
                                currentUserName="Super Admin"
                                currentDept="Admin"
                            />
                        ) : activeTab === 'map' ? (
                            <RealMap 
                                complaints={statusFilteredData} 
                                selectedId={selectedComplaint?.id}
                                onSelect={setSelectedComplaint} 
                                refreshTrigger={complaints.length} 
                            />
                        ) : activeTab === 'autorouted' ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30 overflow-hidden min-h-[500px]">
                                {/* Auto-Routed tab header */}
                                <div className="px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex items-center gap-2">
                                    <Zap size={14} className="text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">AI Auto-Routed Complaints</span>
                                    <span className="text-xs text-blue-500 dark:text-blue-400 ml-2">— assigned by system, awaiting admin confirmation</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                            <tr>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Severity</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Date</th>
                                                <th className="p-4 font-semibold text-blue-600 dark:text-blue-400">Routed To</th>
                                                <th className="p-4 font-semibold text-blue-600 dark:text-blue-400 hidden lg:table-cell">Confidence</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {viewData.length > 0 ? viewData.map((c: Complaint) => (
                                                <tr key={c.id} className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors ${selectedComplaint?.id === c.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                                    <td className="p-4 font-mono font-medium text-gray-900 dark:text-white">{c.id}</td>
                                                    <td className="p-4"><StatusBadge status={c.status} /></td>
                                                    <td className="p-4">
                                                        <span className={`font-bold ${c.severityScore >= 7.5 ? 'text-red-600' : c.severityScore >= 3.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                            {c.severityScore.toFixed(1)}/10
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                                                        {new Date(c.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                            c.autoRoutedDept === 'Engineering' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                                            c.autoRoutedDept === 'Water' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                            c.autoRoutedDept === 'Ward' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                            c.autoRoutedDept === 'Traffic' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                        }`}>
                                                            {c.autoRoutedDept || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 hidden lg:table-cell">
                                                        {c.routingConfidence ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full ${c.routingConfidence >= 0.8 ? 'bg-green-500' : c.routingConfidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-400'}`}
                                                                        style={{ width: `${c.routingConfidence * 100}%` }} />
                                                                </div>
                                                                <span className="text-xs text-gray-500">{(c.routingConfidence * 100).toFixed(0)}%</span>
                                                            </div>
                                                        ) : <span className="text-xs text-gray-400">—</span>}
                                                    </td>
                                                    <td className="p-4"><Button variant="ghost" className="text-xs" onClick={() => setSelectedComplaint(c)}>View</Button></td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={7} className="p-12 text-center">
                                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                                            <Zap size={28} className="opacity-30" />
                                                            <p className="font-medium text-sm">No auto-routed complaints</p>
                                                            <p className="text-xs">When AI assigns a complaint to a department, it will appear here</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                            <tr>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Severity</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Date</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">Dept</th>
                                                {activeTab === 'community' && (
                                                    <>
                                                        <th className="p-4 font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1"><Flag size={14}/> Community Reports</th>
                                                        <th className="p-4 font-semibold text-blue-600 dark:text-blue-400">Likes</th>
                                                    </>
                                                )}
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {viewData.length > 0 ? (
                                                viewData.map((c: Complaint) => (
                                                    <tr key={c.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${selectedComplaint?.id === c.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                                        <td className="p-4 font-mono font-medium text-gray-900 dark:text-white">{c.id}</td>
                                                        <td className="p-4"><StatusBadge status={c.status} /></td>
                                                        <td className="p-4">
                                                            <span className={`font-bold ${c.severityScore >= 7.5 ? 'text-red-600' : c.severityScore >= 3.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                {c.severityScore.toFixed(1)}/10
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                                                            {new Date(c.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="p-4 hidden lg:table-cell">
                                                            {c.autoRoutedDept || c.departments?.[0] ? (
                                                                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium">
                                                                    {c.autoRoutedDept || c.departments?.[0]}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        {activeTab === 'community' && (
                                                            <>
                                                                <td className="p-4">
                                                                    <span className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
                                                                        <Flag size={14}/> {(c as any).communityReportCount || 0}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4">
                                                                    <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                                                                        <ThumbsUp size={14}/> {c.concernCount || 0}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="p-4"><Button variant="ghost" className="text-xs" onClick={() => setSelectedComplaint(c)}>View</Button></td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={activeTab === 'community' ? 8 : 6} className="p-8 text-center text-gray-400">
                                                        {activeTab === 'community' ? 'No community-reported complaints yet.' : 'No tickets found in this list.'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DETAILS PANEL - RESPONSIVE */}
                    <div className={`
                        fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col
                        transition-transform duration-300 ease-in-out
                        ${selectedComplaint ? 'translate-y-0' : 'translate-y-full'}
                        xl:relative xl:inset-auto xl:z-auto xl:bg-transparent xl:w-96 xl:block xl:translate-y-0
                        ${!selectedComplaint ? 'xl:block hidden' : ''}
                    `}>
                        {selectedComplaint ? (
                            <Card className="p-0 border-0 xl:border xl:border-rastha-primary xl:border-t-4 xl:dark:border-rastha-secondary shadow-lg overflow-hidden h-full flex flex-col rounded-none xl:rounded-2xl">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Complaint Details</h3>
                                    <button 
                                        onClick={() => setSelectedComplaint(null)} 
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    >
                                        {/* Show chevron on mobile to indicate sliding down, X on desktop */}
                                        <span className="xl:hidden"><ChevronDown size={24} /></span>
                                        <span className="hidden xl:block"><XCircle className="text-gray-400 hover:text-red-500" size={20}/></span>
                                    </button>
                                </div>
                                <div className="overflow-y-auto flex-1 p-4 space-y-6">
                                    <img src={selectedComplaint.imageUrl} className="w-full h-48 object-cover rounded-lg bg-gray-200" alt="evidence" />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Severity Score</span>
                                            <div className={`text-sm font-bold mt-1 ${selectedComplaint.severityScore >= 7.5 ? 'text-red-600' : selectedComplaint.severityScore >= 3.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                {selectedComplaint.severityScore}/10
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Ticket ID</span>
                                            <div className="font-mono text-sm font-bold mt-1">{selectedComplaint.id}</div>
                                        </div>
                                    </div>
                                    
                                    {/* COMMUNITY INSIGHTS SECTION */}
                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Users size={16} className="text-rastha-primary dark:text-blue-400" />
                                            <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Community Insights</h4>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-blue-100 dark:border-blue-800/30">
                                            <div className="flex items-center gap-2">
                                                <ThumbsUp size={14} className="text-rastha-primary" />
                                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{selectedComplaint.concernCount}</span>
                                                <span className="text-xs text-gray-500">Concerns</span>
                                            </div>
                                            <div className="h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
                                            <div className="flex items-center gap-2">
                                                <Flag size={14} className="text-orange-500" />
                                                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                                    {(selectedComplaint as any).communityReportCount || 0}
                                                </span>
                                                <span className="text-xs text-gray-500">Also witnessed</span>
                                            </div>
                                            <div className="h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
                                            <div className="flex items-center gap-2">
                                                <Flag size={14} className="text-red-500" />
                                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                    {(selectedComplaint.reportStats?.duplicate || 0) + 
                                                     (selectedComplaint.reportStats?.fake || 0) + 
                                                     (selectedComplaint.reportStats?.wrongLocation || 0) + 
                                                     (selectedComplaint.reportStats?.fixed || 0)}
                                                </span>
                                                <span className="text-xs text-gray-500">Flags</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            {selectedComplaint.reportStats?.duplicate > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-orange-600 dark:text-orange-400 font-medium">Possible Duplicate</span>
                                                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-1.5 rounded-full font-bold">{selectedComplaint.reportStats.duplicate}</span>
                                                </div>
                                            )}
                                            {selectedComplaint.reportStats?.fake > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-red-600 dark:text-red-400 font-medium">Fake/Misleading</span>
                                                    <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 rounded-full font-bold">{selectedComplaint.reportStats.fake}</span>
                                                </div>
                                            )}
                                            {selectedComplaint.reportStats?.wrongLocation > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Wrong Location</span>
                                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 rounded-full font-bold">{selectedComplaint.reportStats.wrongLocation}</span>
                                                </div>
                                            )}
                                            {selectedComplaint.reportStats?.fixed > 0 && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-green-600 dark:text-green-400 font-medium">Citizen Verified Fixed</span>
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 rounded-full font-bold">{selectedComplaint.reportStats.fixed}</span>
                                                </div>
                                            )}
                                            {(!selectedComplaint.reportStats || (
                                                selectedComplaint.reportStats.duplicate === 0 && 
                                                selectedComplaint.reportStats.fake === 0 && 
                                                selectedComplaint.reportStats.wrongLocation === 0 && 
                                                selectedComplaint.reportStats.fixed === 0
                                            )) && (
                                                <p className="text-xs text-gray-400 text-center py-1">No negative flags reported yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold mb-2 block">Status</span>
                                        <StatusBadge status={selectedComplaint.status} />
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold mb-2 block">Reported On</span>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Clock size={14} className="text-rastha-primary" />
                                            {new Date(selectedComplaint.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    {(selectedComplaint.autoRoutedDept || selectedComplaint.departments?.[0]) && (
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase font-bold mb-2 block">Assigned Department</span>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                                                    {selectedComplaint.autoRoutedDept || selectedComplaint.departments?.[0]}
                                                </span>
                                                {selectedComplaint.autoRoutedDept && (
                                                    <span className="text-[10px] text-gray-400 italic">auto-routed</span>
                                                )}
                                            </div>
                                            {selectedComplaint.routingConfidence && isFinite(selectedComplaint.routingConfidence) && (
                                                <p className="text-[10px] text-gray-400 mt-1">Routing confidence: {(selectedComplaint.routingConfidence * 100).toFixed(0)}%</p>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold mb-2 block">Location</span>
                                        <div className="text-sm flex gap-2"><Clock size={14} className="mt-0.5 text-rastha-primary"/> {selectedComplaint.address}</div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pb-safe">
                                    <div className="space-y-2">
                                        {/* Dynamic Action Button */}
                                        {selectedComplaint.status === ComplaintStatus.WAITING_LIST ? (
                                            <>
                                                <Button className="w-full bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20" onClick={() => handleStatusUpdate(selectedComplaint.id, ComplaintStatus.AUTO_VERIFIED)}>
                                                    <CheckCircle2 size={18}/> Approve to Main List
                                                </Button>
                                                <Button variant="white" className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100" onClick={(e) => handleDeleteCase(selectedComplaint.id, e)}>
                                                    <Trash2 size={14} className="mr-1" /> Delete Request
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                {/* Dept-Owned: Admin locked out until dept files an appeal */}
                                                {(selectedComplaint.status === ComplaintStatus.ASSIGNED || selectedComplaint.status === ComplaintStatus.REPAIRED || (selectedComplaint.departments?.length > 0 && selectedComplaint.autoRoutedDept)) ? (
                                                    (() => {
                                                        const appealForThis = pendingAppeals.find((a: any) => a.complaintId === selectedComplaint.id);
                                                        return (
                                                            <div className="space-y-3">
                                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current Owner</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <HardHat size={16} className="text-rastha-primary"/>
                                                                        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                                                            {(selectedComplaint.departments ?? []).map((d: string) => d === 'Engineering' ? 'Road & Infra' : d === 'Ward' ? 'Sanitation' : d).join(', ') || 'Unknown Dept'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {appealForThis ? (
                                                                    <>
                                                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                                                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">Appeal Pending</p>
                                                                            <p className="text-xs text-amber-600 dark:text-amber-300 italic">"{appealForThis.reason}"</p>
                                                                        </div>
                                                                        <p className="text-[11px] text-gray-400 text-center">Review this in the <span className="font-semibold">Appeals</span> tab to reassign.</p>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Button className="w-full bg-gray-100 text-gray-500 border-gray-200 cursor-default hover:bg-gray-100" disabled>
                                                                            {selectedComplaint.status === ComplaintStatus.REPAIRED ? 'Case Resolved' : 'Processing in Department'}
                                                                        </Button>
                                                                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                                                            <Lock size={12} /> Dept has ownership — locked until appeal filed
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                     // ASSIGNMENT LOGIC (For Verified Items)
                                                     showAssignMenu ? (
                                                        <div className="animate-fade-in bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl relative overflow-hidden">
                                                            {/* Background Decoration */}
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rastha-primary/10 to-transparent rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>

                                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                                <div>
                                                                    <h4 className="font-bold text-gray-900 dark:text-white text-base">Select Department</h4>
                                                                    <p className="text-xs text-gray-500 mt-1">Dispatch work order or alert units</p>
                                                                </div>
                                                                <button 
                                                                    onClick={() => setShowAssignMenu(false)} 
                                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                                                >
                                                                    <X size={18}/>
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-2 relative z-10 max-h-[350px] overflow-y-auto">
                                                                
                                                                {/* NEW: Traffic Auto-Notify Toggle */}
                                                                <div className="px-1 mb-3">
                                                                    <label className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl cursor-pointer border border-blue-100 dark:border-blue-800 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30">
                                                                        <div className="relative flex items-center pt-0.5">
                                                                            <input 
                                                                                type="checkbox" 
                                                                                checked={notifyTraffic}
                                                                                onChange={(e) => setNotifyTraffic(e.target.checked)}
                                                                                className="w-5 h-5 border-gray-300 rounded text-rastha-primary focus:ring-rastha-primary"
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <span className="block font-bold text-gray-800 dark:text-gray-100 text-sm">Notify Traffic Control</span>
                                                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                                                                                Automatically send hazard alert to Traffic Dept when assigning workers.
                                                                            </span>
                                                                        </div>
                                                                        <Siren size={18} className={notifyTraffic ? "text-rastha-primary" : "text-gray-400"} />
                                                                    </label>
                                                                </div>

                                                                {/* Repair Teams Section */}
                                                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1 mt-1">Dispatch Repair Team</div>
                                                                
                                                                <button 
                                                                    onClick={() => handleAssignToDept(selectedComplaint.id, 'Engineering')}
                                                                    className="group flex items-center p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-300 text-left relative overflow-hidden"
                                                                >
                                                                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform shadow-sm">
                                                                        <Truck size={20} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className="block font-bold text-gray-800 dark:text-gray-100 text-sm group-hover:text-orange-700 dark:group-hover:text-orange-300">Road & Infrastructure</span>
                                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Potholes, Resurfacing</span>
                                                                    </div>
                                                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                                                                </button>

                                                                <button 
                                                                    onClick={() => handleAssignToDept(selectedComplaint.id, 'Ward')}
                                                                    className="group flex items-center p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800 transition-all duration-300 text-left relative overflow-hidden"
                                                                >
                                                                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform shadow-sm">
                                                                        <Trash2 size={20} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className="block font-bold text-gray-800 dark:text-gray-100 text-sm group-hover:text-green-700 dark:group-hover:text-green-300">Sanitation & Ward</span>
                                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Debris, Cleaning</span>
                                                                    </div>
                                                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-green-400 transition-colors" />
                                                                </button>
                                                                
                                                                <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

                                                                {/* Alerts Section (Manual Only) */}
                                                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Manual Alert</div>

                                                                <button 
                                                                    onClick={() => handleNotifyTraffic(selectedComplaint.id)}
                                                                    className="group flex items-center p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-all duration-300 text-left relative overflow-hidden"
                                                                >
                                                                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform shadow-sm">
                                                                        <Megaphone size={20} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className="block font-bold text-gray-800 dark:text-gray-100 text-sm group-hover:text-red-700 dark:group-hover:text-red-300">Notify Traffic Only</span>
                                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Alert without assigning workers.</span>
                                                                    </div>
                                                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-red-400 transition-colors" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                     ) : (
                                                        <>
                                                            <Button className="w-full bg-rastha-primary text-white" onClick={() => setShowAssignMenu(true)}>
                                                                <HardHat size={18}/> Manage Ticket
                                                            </Button>
                                                            <Button variant="white" className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDeleteCase(selectedComplaint.id, e)}>
                                                                <Trash2 size={14} className="mr-1" /> Delete Permanently
                                                            </Button>
                                                        </>
                                                     )
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-gray-50/50 border-dashed border-2 rounded-none xl:rounded-2xl border-0 xl:border-2">
                            <List size={32} className="opacity-50 mb-4" />
                            <h3 className="text-lg font-medium">No Selection</h3>
                            <p className="text-sm">Select a complaint to manage.</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;