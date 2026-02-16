import React, { useState, useEffect } from 'react';
import { Card, StatusBadge, Button } from '../components/UI.tsx';
import { api } from '../services/mockApi.ts';
import { Complaint, DepartmentType, ComplaintStatus } from '../types';
import { Truck, Siren, Trash2, Zap, ArrowRight, Building2, ChevronDown, CheckCircle2, Activity, BarChart3, Users, Clock, Droplets } from 'lucide-react';

const DEPARTMENTS = [
    { id: 'Engineering', name: 'Road & Infrastructure', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', gradient: 'from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800' },
    { id: 'Water', name: 'Water Supply', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', gradient: 'from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800' },
    { id: 'Ward', name: 'Sanitation & Ward', icon: Trash2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', gradient: 'from-green-50 to-white dark:from-green-900/20 dark:to-gray-800' },
    { id: 'Traffic', name: 'Traffic Control', icon: Siren, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', gradient: 'from-red-50 to-white dark:from-red-900/20 dark:to-gray-800' },
];

const AdminDepartmentsPage = () => {
    const [activeDept, setActiveDept] = useState<DepartmentType | null>(null);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await api.getComplaints();
            setComplaints(data);
            setLoading(false);
        };
        load();
    }, []);

    // Filter complaints for the selected department
    const deptComplaints = activeDept 
        ? complaints.filter(c => c.departments.includes(activeDept) && (c.status === ComplaintStatus.ASSIGNED || c.status === ComplaintStatus.REPAIRED))
        : [];

    // Calculate total active across all depts for "System Health"
    const totalActive = complaints.filter(c => c.status === ComplaintStatus.ASSIGNED).length;

    return (
        <div className="p-4 md:p-8 w-full space-y-8 h-full flex flex-col max-w-[1600px] mx-auto animate-fade-in bg-gray-50/50 dark:bg-gray-900">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-rastha-primary dark:text-white tracking-tight">
                        Department Command Center
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                        <Activity size={16} className="text-green-500" />
                        System Status: <span className="font-bold text-gray-700 dark:text-gray-300">Operational</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-2"></span>
                        <span className="text-gray-500">{totalActive} Active Operations</span>
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Cycle</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-white">{new Date().toLocaleDateString()}</span>
                </div>
            </div>

            {/* Department Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {DEPARTMENTS.map((dept, index) => {
                    const count = complaints.filter(c => c.departments.includes(dept.id as DepartmentType) && c.status === ComplaintStatus.ASSIGNED).length;
                    const isActive = activeDept === dept.id;
                    const workloadPercent = Math.min((count / 10) * 100, 100); // Mock capacity calculation
                    
                    return (
                        <button 
                            key={dept.id} 
                            onClick={() => setActiveDept(isActive ? null : dept.id as DepartmentType)}
                            className={`
                                relative overflow-hidden rounded-2xl text-left transition-all duration-300 group
                                ${isActive 
                                    ? 'ring-2 ring-rastha-primary shadow-xl scale-[1.02] z-10' 
                                    : 'hover:shadow-lg hover:-translate-y-1 border border-gray-200 dark:border-gray-700'
                                }
                            `}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${dept.gradient} opacity-50 dark:opacity-10 transition-opacity`}></div>
                            
                            <div className="p-6 relative z-10 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm h-full flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${dept.bg} ${dept.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                        <dept.icon size={24} />
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded-full border ${isActive ? 'bg-rastha-primary text-white border-rastha-primary' : 'bg-white dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600'}`}>
                                        {isActive ? 'MONITORING' : 'VIEW'}
                                    </div>
                                </div>
                                
                                <div className="mt-auto space-y-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{dept.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <Clock size={10} /> Avg. Response: 24h
                                        </p>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div className="space-y-1 w-full">
                                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                                                <span>Workload</span>
                                                <span>{count} Tasks</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${count > 5 ? 'bg-red-500' : 'bg-rastha-primary'}`} 
                                                    style={{ width: `${workloadPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="transition-all duration-500 ease-in-out">
                {activeDept ? (
                    <div className="animate-slide-up space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 flex items-center gap-3">
                                <span className="bg-rastha-primary text-white p-1.5 rounded-lg">
                                    <Building2 size={18} />
                                </span>
                                Active Task List: {activeDept}
                            </h3>
                            <div className="flex gap-2">
                                <Button variant="white" className="text-xs h-9">Export CSV</Button>
                                <Button variant="ghost" onClick={() => setActiveDept(null)} className="text-xs h-9 text-gray-500">Close View</Button>
                            </div>
                        </div>
                        
                        <Card className="overflow-hidden border-0 shadow-xl shadow-gray-100/50 dark:shadow-none ring-1 ring-gray-100 dark:ring-gray-700">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 pl-8">Complaint ID</th>
                                            <th className="px-6 py-4">Location & Priority</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Assigned Resource</th>
                                            <th className="px-6 py-4">Timeline</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                        {deptComplaints.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center text-gray-400">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
                                                            <CheckCircle2 size={32} className="text-green-500" />
                                                        </div>
                                                        <p className="font-medium">All Caught Up!</p>
                                                        <p className="text-xs max-w-xs mx-auto">No pending active assignments found for {activeDept}.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            deptComplaints.map(c => (
                                                <tr key={c.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                                    <td className="px-6 py-4 pl-8">
                                                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-700">
                                                            {c.id}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{c.address}</span>
                                                            <span className={`text-[10px] font-bold uppercase mt-1 ${c.severityScore > 7 ? 'text-red-500' : 'text-yellow-500'}`}>
                                                                Severity: {c.severityScore}/10
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                                                    <td className="px-6 py-4">
                                                        {c.assignedContractorId ? (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                                                                    C
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200">Contractor</span>
                                                                    <span className="text-[10px] text-gray-500 font-mono">#{c.assignedContractorId}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-xs font-bold">
                                                                    In
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200">Internal Team</span>
                                                                    <span className="text-[10px] text-gray-500">Municipal Staff</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={12} />
                                                            {c.contractorAssignedDate ? new Date(c.contractorAssignedDate).toLocaleDateString() : 'Pending'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                ) : (
                    // EMPTY STATE / DASHBOARD SUMMARY
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                        <div className="md:col-span-2 bg-gradient-to-r from-rastha-primary to-blue-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold mb-2">System Overview</h2>
                                <p className="opacity-80 max-w-md text-sm mb-6">
                                    All departments are operating within expected parameters. Select a department module above to drill down into specific active tasks and contractor assignments.
                                </p>
                                <div className="flex gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                        <div className="text-3xl font-bold">{complaints.length}</div>
                                        <div className="text-[10px] uppercase tracking-wider opacity-70">Total Logged</div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                        <div className="text-3xl font-bold">{complaints.filter(c => c.status === ComplaintStatus.REPAIRED).length}</div>
                                        <div className="text-[10px] uppercase tracking-wider opacity-70">Resolutions</div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative Background Circles */}
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 right-20 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-orange-600 mb-4">
                                <BarChart3 size={32} />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Efficiency Metrics</h3>
                            <p className="text-xs text-gray-500 mt-2 mb-4">
                                Average resolution time across all departments is currently <strong>3.2 days</strong>.
                            </p>
                            <Button variant="ghost" className="text-xs w-full">View Detailed Report</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDepartmentsPage;