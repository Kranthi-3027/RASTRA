import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/mockApi.ts';
import { Complaint, ComplaintStatus, Severity, UserRole, DepartmentType, AdminLog, Constable, Contractor } from '../types';
import { Card, Button, StatusBadge, useLocation } from '../components/UI.tsx';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'; 
import { List, Filter, CheckCircle2, AlertCircle, HardHat, RefreshCw, Calendar, ChevronDown, XCircle, Activity, Users, ThumbsUp, Flag, Lock, Trash2, Clock, Globe, Briefcase, ClipboardList, AlertTriangle, Siren, Phone, MapPin, User, Send, BadgeCheck } from 'lucide-react';
import { COLORS } from '../constants';

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
                const roleLower = role.toLowerCase().replace('_', ' ');
                const deptLower = deptType ? deptType.toLowerCase() : "";

                // Logic:
                // 1. Action performed BY this role (e.g., "ENGINEERING Assigned...")
                // 2. Action performed ON this dept (e.g., "Assigned ticket to Engineering")
                return details.includes(roleLower) || (deptLower && details.includes(deptLower));
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'main' | 'assigned' | 'work_orders' | 'alerts'>('map');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  
  // Modals
  const [showDispatchModal, setShowDispatchModal] = useState(false); // For Traffic
  const [showContractorModal, setShowContractorModal] = useState(false); // For Engineering/Ward

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const { pathname } = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchData = async () => {
    setIsRefreshing(true);
    const allData = await api.getComplaints();
    setComplaints(allData);
    
    if (role === UserRole.TRAFFIC) {
        const cData = await api.getConstables();
        setConstables(cData);
    } else {
        const cData = await api.getContractors();
        setContractors(cData);
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
          
          setComplaints(prev => prev.map(c => 
              c.id === selectedComplaint.id 
              ? { ...c, status: ComplaintStatus.ASSIGNED, assignedContractorId: contractor.id, contractorAssignedDate: new Date() } 
              : c
          ));
          
          setSelectedComplaint(prev => prev ? { ...prev, status: ComplaintStatus.ASSIGNED, assignedContractorId: contractor.id, contractorAssignedDate: new Date() } : null);
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
    if (window.confirm("Are you sure you want to permanently delete this case?")) {
        try {
            await api.deleteComplaint(id);
            await api.logAdminActivity('DELETE_CASE', `${role} Deleted ticket ${id}`);
            setComplaints(prev => prev.filter(c => c.id !== id));
            setSelectedComplaint(null);
        } catch (e) { console.error(e); }
    }
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

      main = timeFilteredData.filter(c => c.status === ComplaintStatus.AUTO_VERIFIED || c.status === ComplaintStatus.SUBMITTED);

      if (currentDeptType) {
          assigned = timeFilteredData.filter(c => 
              c.departments.includes(currentDeptType) && 
              (c.status === ComplaintStatus.ASSIGNED || c.status === ComplaintStatus.REPAIRED)
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
                                                <td className="p-4 text-gray-500 truncate max-w-[150px]">{c.address}</td>
                                                <td className="p-4"><Button variant="ghost" className="text-xs" onClick={() => setSelectedComplaint(c)}>View</Button></td>
                                            </tr>
                                        )) : <tr><td colSpan={6} className="p-8 text-center text-gray-400">No pending complaints found.</td></tr>}
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
                                <img src={selectedComplaint.imageUrl} className="w-full h-48 object-cover rounded-lg bg-gray-200" alt="evidence" />
                                
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
                                    {role !== UserRole.TRAFFIC && (selectedComplaint.status === ComplaintStatus.AUTO_VERIFIED || selectedComplaint.status === ComplaintStatus.SUBMITTED) ? (
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" onClick={() => handleSelfDispatch(selectedComplaint.id)}>
                                            <Briefcase size={18}/> Assign Contractor / Team
                                        </Button>
                                    ) : (
                                        <>
                                            {selectedComplaint.status === ComplaintStatus.REPAIRED ? (
                                                    <Button className="w-full bg-green-600/10 text-green-700 border border-green-200 cursor-default" disabled><CheckCircle2 size={18}/> Completed</Button>
                                            ) : selectedComplaint.status === ComplaintStatus.ASSIGNED && role !== UserRole.TRAFFIC ? (
                                                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20" onClick={() => handleStatusUpdate(selectedComplaint.id, ComplaintStatus.REPAIRED)}><CheckCircle2 size={18}/> Mark Repaired</Button>
                                            ) : null}
                                            {role !== UserRole.TRAFFIC && (<Button variant="white" className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDeleteCase(selectedComplaint.id, e)}><Trash2 size={14} className="mr-1" /> Delete Task</Button>)}
                                        </>
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
            {showContractorModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-orange-50 dark:bg-orange-900/20">
                            <h3 className="font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2"><HardHat size={18} /> Assign Contractor</h3>
                            <button onClick={() => setShowContractorModal(false)} className="p-1 hover:bg-white/50 rounded-full"><XCircle size={20} className="text-orange-900 dark:text-orange-100" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-3">
                            {contractors.map(c => (
                                <button key={c.id} onClick={() => handleAssignContractor(c)} className="w-full flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all text-left group">
                                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mr-3 text-orange-600"><HardHat size={20} /></div>
                                    <div className="flex-1">
                                        <div className="flex flex-col"><p className="font-bold text-gray-900 dark:text-white text-sm">{c.company}</p><span className="text-[10px] text-gray-500">{c.name} • {c.specialization}</span></div>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{c.activeProjects} active projects</p>
                                    </div>
                                    <div className="text-yellow-500 font-bold text-sm flex items-center">{c.rating} ★</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};

export default DepartmentDashboard;