import React, { useState, useEffect } from 'react';
import { api } from '../services/mockApi.ts';
import { Complaint, ComplaintStatus, Severity, AdminStats } from '../types';
import { Card, Button, StatusBadge } from '../components/UI.tsx';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'; 
import { List, XCircle, Clock, BarChart3, AlertCircle, CheckCircle2, HardHat, RefreshCw, Calendar, Siren, Trash2, FileCheck, History, Download, Lock, Database } from 'lucide-react';
import { COLORS } from '../constants';

// --- HELPER COMPONENTS ---

// Severity Color Logic for OSM Dots
// RED = Critical (High)
// ORANGE = Warning (Medium)
// GREEN = Safe/Low (Low)
const getMarkerColor = (score: number) => {
  if (score >= 7.5) return COLORS.alert; // Red
  if (score >= 3.5) return COLORS.warning; // Orange
  return COLORS.secondary; // Green
};

const MapRefresher = ({ timestamp }: { timestamp: number }) => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [timestamp, map]);
    return null;
};

// OpenStreetMap Component
const RealMap = ({ complaints, onSelect, selectedId, refreshTrigger }: { complaints: Complaint[], onSelect: (c: Complaint) => void, selectedId?: string, refreshTrigger: number }) => {
  const center: [number, number] = [17.3850, 78.4867]; 

  return (
    <div className="w-full h-[500px] md:h-[600px] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0 shadow-inner group">
        <MapContainer center={center} zoom={11} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
            <MapRefresher timestamp={refreshTrigger} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="map-tiles"
            />
            {complaints.map(c => (
                <CircleMarker 
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
                </CircleMarker>
            ))}
        </MapContainer>
        
        {/* Visual Legend for Admin */}
        <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4 rounded-xl shadow-xl text-xs border border-gray-100 dark:border-gray-700 z-[400] hidden sm:block">
            <div className="font-bold mb-3 text-gray-700 dark:text-gray-200 uppercase tracking-wider">Severity Indicators</div>
            <div className="flex items-center gap-3 mb-2">
                <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{background: COLORS.alert}}></span> 
                <span className="text-gray-600 dark:text-gray-300 font-medium">Critical (Score 7.5+)</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
                <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{background: COLORS.warning}}></span> 
                <span className="text-gray-600 dark:text-gray-300 font-medium">Medium (Score 3.5+)</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{background: COLORS.secondary}}></span> 
                <span className="text-gray-600 dark:text-gray-300 font-medium">Low Priority</span>
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
    const [stats, setStats] = useState<AdminStats | null>(null);

    useEffect(() => {
        api.getAdminStats().then(setStats);
    }, []);

    const handleDownloadAudit = () => {
        alert("Downloading Audit Log PDF...");
    };

    return (
        <div className="p-6 w-full space-y-6 animate-fade-in max-w-5xl mx-auto">
             <header>
                <h1 className="text-2xl font-bold text-rastha-primary dark:text-white">Activity Audit</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Monitor system access and critical administrative actions.</p>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-3 mb-2">
                        <FileCheck className="text-blue-500" />
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Total Repair Orders</h3>
                    </div>
                    <p className="text-3xl font-bold">{stats?.totalRepairOrders || 0}</p>
                    <p className="text-xs text-gray-400">Authorized by Admin</p>
                </Card>
                <Card className="p-6 border-l-4 border-l-red-500">
                    <div className="flex items-center gap-3 mb-2">
                        <Trash2 className="text-red-500" />
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Deleted Cases</h3>
                    </div>
                    <p className="text-3xl font-bold">{stats?.totalDeletedCases || 0}</p>
                    <p className="text-xs text-gray-400">Permanently removed</p>
                </Card>
             </div>

             <Card className="p-0 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <History size={18} />
                        Activity Log
                    </h3>
                    <Button variant="outline" className="text-xs" onClick={handleDownloadAudit}>
                        <Download size={14} /> Export Log PDF
                    </Button>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white dark:bg-gray-900 sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Timestamp</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Action Type</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {stats?.logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                                        {log.timestamp.toLocaleDateString()} <span className="text-gray-400">{log.timestamp.toLocaleTimeString()}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            log.type === 'LOGIN' ? 'bg-blue-100 text-blue-700' :
                                            log.type === 'LOGOUT' ? 'bg-gray-100 text-gray-600' :
                                            log.type === 'DELETE_CASE' ? 'bg-red-100 text-red-700' :
                                            'bg-purple-100 text-purple-700'
                                        }`}>
                                            {log.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-300">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(!stats?.logs || stats.logs.length === 0) && (
                        <div className="p-8 text-center text-gray-400">No activity recorded.</div>
                    )}
                </div>
             </Card>
             <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                 <Lock size={12} />
                 Audit logs are read-only and cannot be modified or deleted.
             </div>
        </div>
    );
};

export const AdminDataCenter = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [timeRange, setTimeRange] = useState('all');

    const handleExport = () => {
        setIsExporting(true);
        setTimeout(() => {
            alert(`Complaints history (${timeRange}) downloaded successfully.`);
            setIsExporting(false);
        }, 1500);
    };

    return (
        <div className="p-6 w-full space-y-6 animate-fade-in max-w-2xl mx-auto">
            <header>
                <h1 className="text-2xl font-bold text-rastha-primary dark:text-white">Data Center</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Download system reports and historical data.</p>
            </header>

            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Database size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Complaints History</h3>
                        <p className="text-sm text-gray-500">Export complaint records for offline analysis.</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <Clock size={16} /> Select Time Range
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {[
                                { id: 'today', label: 'Today' },
                                { id: 'week', label: 'Past 1 Week' },
                                { id: 'month', label: 'Past 1 Month' },
                                { id: 'year', label: 'Past 1 Year' },
                                { id: 'all', label: 'All Time Records' }
                            ].map((option) => (
                                <label key={option.id} className={`
                                    relative flex items-center p-3 rounded-lg border cursor-pointer transition-all
                                    ${timeRange === option.id 
                                        ? 'border-rastha-primary bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500' 
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700'}
                                `}>
                                    <input 
                                        type="radio" 
                                        name="timeRange" 
                                        value={option.id}
                                        checked={timeRange === option.id}
                                        onChange={(e) => setTimeRange(e.target.value)}
                                        className="w-4 h-4 text-rastha-primary border-gray-300 focus:ring-rastha-primary"
                                    />
                                    <span className={`ml-3 text-sm font-medium ${timeRange === option.id ? 'text-rastha-primary dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button 
                                onClick={handleExport} 
                                disabled={isExporting}
                                className="w-full sm:w-auto min-w-[200px]"
                            >
                                {isExporting ? (
                                    <>Preparing Download...</>
                                ) : (
                                    <><Download size={18} /> Download CSV Report</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const AdminDashboard = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'map' | 'list' | 'waiting'>('map');
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');

    const fetchData = async () => {
        setIsRefreshing(true);
        const data = await api.getComplaints();
        setComplaints(data);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: ComplaintStatus) => {
        if (newStatus === ComplaintStatus.ASSIGNED) {
            await api.logAdminActivity('REPAIR_ORDER', `Assigned workers to ticket ${id}`);
        }
        await api.updateComplaintStatus(id, newStatus);
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
        if (selectedComplaint?.id === id) {
            setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null);
        }
    };

    const handleDeleteCase = async (id: string) => {
        if (window.confirm("Are you sure you want to permanently delete this case? This action will be logged.")) {
            await api.deleteComplaint(id);
            await api.logAdminActivity('DELETE_CASE', `Deleted ticket ${id}`);
            setComplaints(prev => prev.filter(c => c.id !== id));
            setSelectedComplaint(null);
        }
    };

    const getFilteredComplaints = () => {
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
    };

    const filteredData = getFilteredComplaints();
    const pending = filteredData.filter((c: Complaint) => c.status === ComplaintStatus.WAITING_LIST).length;
    const critical = filteredData.filter((c: Complaint) => c.severity === Severity.HIGH).length;
    const repaired = filteredData.filter((c: Complaint) => c.status === ComplaintStatus.REPAIRED).length;
    const totalCount = filteredData.length;

    const viewData = activeTab === 'waiting' 
        ? filteredData.filter((c: Complaint) => c.status === ComplaintStatus.WAITING_LIST) 
        : filteredData;

    return (
        <div className="p-6 w-full space-y-6 h-full flex flex-col">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-rastha-primary dark:text-white">Command Center</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Municipal Road Maintenance Dashboard</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Reports" value={totalCount} subtext={`Filtered by: ${timeFilter}`} icon={BarChart3} colorClass={COLORS.primary} bgClass="bg-blue-50 dark:bg-blue-900/20" />
                    <StatCard title="Critical Damage" value={critical} subtext="High Severity Issues" icon={Siren} colorClass={COLORS.alert} bgClass="bg-red-50 dark:bg-red-900/20" />
                    <StatCard title="Pending Verification" value={pending} subtext="Requires manual review" icon={AlertCircle} colorClass="#FBC531" bgClass="bg-yellow-50 dark:bg-yellow-900/20" />
                    <StatCard title="Repaired Roads" value={repaired} subtext="Verified completions" icon={CheckCircle2} colorClass={COLORS.secondary} bgClass="bg-green-50 dark:bg-green-900/20" />
                </div>

                <div className="flex flex-col xl:flex-row gap-6 h-full min-h-[600px]">
                    <div className="flex-1 space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center">
                            <div className="flex gap-2">
                                <button onClick={() => setActiveTab('map')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'map' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>Live Map</button>
                                <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>All List</button>
                                <button onClick={() => setActiveTab('waiting')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'waiting' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    Waiting List {pending > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pending}</span>}
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-1.5 border border-gray-200 dark:border-gray-600">
                                    <Calendar size={14} className="text-gray-500 mr-2" />
                                    <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as any)} className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer">
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                        <option value="all">All Time</option>
                                    </select>
                                </div>
                                <Button variant="white" onClick={fetchData} className={`text-xs py-2 ${isRefreshing ? 'opacity-70' : ''}`}>
                                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-rastha-primary' : ''} />
                                </Button>
                            </div>
                        </div>

                        {activeTab === 'map' ? (
                            <RealMap 
                                complaints={filteredData} 
                                selectedId={selectedComplaint?.id}
                                onSelect={setSelectedComplaint} 
                                refreshTrigger={complaints.length} 
                            />
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                            <tr>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Location</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Severity</th>
                                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {viewData.map((c: Complaint) => (
                                                <tr key={c.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${selectedComplaint?.id === c.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                                    <td className="p-4 font-mono font-medium">{c.id}</td>
                                                    <td className="p-4 truncate max-w-xs">{c.address}</td>
                                                    <td className="p-4"><StatusBadge status={c.status} /></td>
                                                    <td className="p-4">
                                                        <span className={`font-bold ${c.severityScore >= 7.5 ? 'text-red-600' : c.severityScore >= 3.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                            {c.severityScore.toFixed(1)}/10
                                                        </span>
                                                    </td>
                                                    <td className="p-4"><Button variant="ghost" className="text-xs" onClick={() => setSelectedComplaint(c)}>View</Button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full xl:w-96 space-y-4 shrink-0">
                        {selectedComplaint ? (
                            <Card className="p-0 sticky top-6 animate-fade-in border-rastha-primary border-t-4 dark:border-rastha-secondary shadow-lg overflow-hidden h-full max-h-[600px] flex flex-col">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Complaint Details</h3>
                                    <button onClick={() => setSelectedComplaint(null)}><XCircle className="text-gray-400 hover:text-red-500 transition-colors" size={20}/></button>
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
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold mb-2 block">Status</span>
                                        <StatusBadge status={selectedComplaint.status} />
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold mb-2 block">Location</span>
                                        <div className="text-sm flex gap-2"><Clock size={14} className="mt-0.5 text-rastha-primary"/> {selectedComplaint.address}</div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                    <div className="space-y-2">
                                        {selectedComplaint.status === ComplaintStatus.WAITING_LIST && (
                                            <Button className="w-full" onClick={() => handleStatusUpdate(selectedComplaint.id, ComplaintStatus.AUTO_VERIFIED)}>Verify & Accept</Button>
                                        )}
                                        {selectedComplaint.status === ComplaintStatus.AUTO_VERIFIED && (
                                            <Button className="w-full bg-rastha-secondary text-rastha-primary" onClick={() => handleStatusUpdate(selectedComplaint.id, ComplaintStatus.ASSIGNED)}><HardHat size={18}/> Assign Workers</Button>
                                        )}
                                        {selectedComplaint.status === ComplaintStatus.ASSIGNED && (
                                            <Button className="w-full bg-green-600 text-white" onClick={() => handleStatusUpdate(selectedComplaint.id, ComplaintStatus.REPAIRED)}>Verify & Close</Button>
                                        )}
                                        <Button variant="white" className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteCase(selectedComplaint.id)}>
                                            <Trash2 size={14} className="mr-1" /> Delete Permanently
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-gray-50/50 border-dashed border-2">
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