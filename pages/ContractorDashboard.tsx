import React, { useState, useEffect } from 'react';
import { api } from '../services/mockApi.ts';
import { Complaint, ComplaintStatus } from '../types';
import { MOCK_CONTRACTOR_USER } from '../constants';
import { Card, Button, StatusBadge } from '../components/UI.tsx';
import { ClipboardList, Camera, MapPin, CheckCircle2, Clock, Calendar, AlertTriangle, UploadCloud, ChevronRight, X, Briefcase, Activity, CheckSquare, RefreshCw } from 'lucide-react';

const ContractorDashboard = () => {
    const [tasks, setTasks] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Complaint | null>(null);
    const [evidenceImage, setEvidenceImage] = useState<File | null>(null);
    const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const fetchTasks = async () => {
        setLoading(true);
        const allComplaints = await api.getComplaints();
        // Filter: Assigned to this contractor OR Completed by this contractor
        const myTasks = allComplaints.filter(c => 
            c.assignedContractorId === MOCK_CONTRACTOR_USER.id
        ).sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setTasks(myTasks);
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setEvidenceImage(file);
            setEvidencePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitCompletion = async () => {
        if (!selectedTask || !evidenceImage) return;
        setIsSubmitting(true);
        try {
            await api.completeWorkOrder(selectedTask.id, evidenceImage);
            
            alert("Work Order Completed Successfully!");
            setSelectedTask(null);
            setEvidenceImage(null);
            setEvidencePreview(null);
            await fetchTasks(); // Refresh list
        } catch (e) {
            console.error(e);
            alert("Failed to submit update.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Derived Lists
    const activeTasks = tasks.filter(t => t.status !== ComplaintStatus.REPAIRED);
    const historyTasks = tasks.filter(t => t.status === ComplaintStatus.REPAIRED);

    // Stats
    const pendingCount = activeTasks.length;
    const completedCount = historyTasks.length;
    const totalCount = tasks.length;

    return (
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fade-in space-y-8 min-h-screen flex flex-col">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-xl text-purple-600 dark:text-purple-400">
                            <Briefcase size={28} />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Contractor Portal</h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">Welcome back, <span className="font-bold text-gray-800 dark:text-gray-200">{MOCK_CONTRACTOR_USER.name}</span></p>
                </div>
                
                <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center min-w-[100px]">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending</p>
                        <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center min-w-[100px]">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Completed</p>
                        <p className="text-2xl font-bold text-green-500">{completedCount}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-center min-w-[100px]">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-2xl font-bold text-blue-500">{totalCount}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col space-y-6">
                
                {/* Tabs */}
                <div className="flex items-center justify-between">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('active')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <Activity size={16} /> Active Tasks <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs">{pendingCount}</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <CheckSquare size={16} /> Work History <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">{completedCount}</span>
                        </button>
                    </div>
                    
                    <Button variant="white" onClick={fetchTasks} className="h-10 w-10 p-0 flex items-center justify-center rounded-xl">
                        <RefreshCw size={18} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
                    </Button>
                </div>

                {/* Task Grid */}
                {loading ? (
                    <div className="p-20 text-center text-gray-400">Loading assignments...</div>
                ) : (activeTab === 'active' ? activeTasks : historyTasks).length === 0 ? (
                    <Card className="p-16 text-center border-dashed flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            {activeTab === 'active' ? <CheckCircle2 size={40} /> : <Clock size={40} />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No {activeTab === 'active' ? 'Active Tasks' : 'History'} Found</h3>
                        <p className="text-gray-500 max-w-sm">
                            {activeTab === 'active' ? "You're all caught up! No pending work orders assigned to you." : "No completed jobs recorded yet."}
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(activeTab === 'active' ? activeTasks : historyTasks).map(task => (
                            <Card 
                                key={task.id} 
                                onClick={() => setSelectedTask(task)}
                                className={`group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 ${task.status === ComplaintStatus.REPAIRED ? 'border-l-green-500' : 'border-l-orange-500'}`}
                            >
                                <div className="relative h-48 overflow-hidden bg-gray-200">
                                    <img src={task.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Site" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute top-3 right-3">
                                        <StatusBadge status={task.status} />
                                    </div>
                                    <div className="absolute bottom-3 left-3 text-white">
                                        <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Complaint ID</p>
                                        <p className="font-mono font-bold text-lg">{task.id}</p>
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col gap-4">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide ${task.severityScore > 7 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                Severity: {task.severityScore}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock size={12} /> {task.contractorAssignedDate ? new Date(task.contractorAssignedDate).toLocaleDateString() : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 font-medium leading-relaxed">
                                            {task.description || "No specific description provided."}
                                        </p>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            <MapPin size={16} className="text-rastha-primary shrink-0"/> 
                                            <span className="truncate">{task.address}</span>
                                        </div>
                                        <Button 
                                            variant={task.status === ComplaintStatus.REPAIRED ? 'outline' : 'primary'} 
                                            className="w-full justify-between group-hover:bg-opacity-90"
                                        >
                                            {task.status === ComplaintStatus.REPAIRED ? 'View Details' : 'Open Work Order'}
                                            <ChevronRight size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* COMPLETION / DETAILS MODAL */}
            {selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Work Order Details</h3>
                                <p className="text-xs text-gray-500 font-mono mt-1 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded w-fit">{selectedTask.id}</p>
                            </div>
                            <button onClick={() => {setSelectedTask(null); setEvidenceImage(null); setEvidencePreview(null);}} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Task Context */}
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="w-full sm:w-1/3 shrink-0">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Reported Issue</p>
                                    <img src={selectedTask.imageUrl} className="w-full h-40 object-cover rounded-xl bg-gray-200 shadow-sm border border-gray-100 dark:border-gray-700" alt="Before" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Description</p>
                                        <p className="text-gray-800 dark:text-white text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 leading-relaxed">
                                            {selectedTask.description}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Location</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                            <MapPin size={16} className="text-rastha-primary" /> {selectedTask.address}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            {selectedTask.status === ComplaintStatus.REPAIRED ? (
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400 shadow-sm">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="font-bold text-green-800 dark:text-green-300 text-xl mb-2">Job Completed</h3>
                                    <p className="text-sm text-green-700 dark:text-green-400 mb-6">
                                        Submitted on <span className="font-bold">{selectedTask.repairedDate?.toLocaleDateString()}</span>
                                    </p>
                                    {selectedTask.repairEvidenceUrl && (
                                        <div className="max-w-xs mx-auto">
                                            <p className="text-xs font-bold uppercase text-green-700 dark:text-green-400 mb-2">Proof of Repair</p>
                                            <img src={selectedTask.repairEvidenceUrl} className="w-full h-48 object-cover rounded-xl border-2 border-green-200 dark:border-green-800 shadow-sm" alt="Proof" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-rastha-primary text-white p-2 rounded-lg">
                                            <Camera size={20} />
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                            Submit Proof of Repair
                                        </h4>
                                    </div>
                                    
                                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${evidencePreview ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-700 hover:border-rastha-primary hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        {evidencePreview ? (
                                            <div className="relative inline-block">
                                                <img src={evidencePreview} className="h-56 rounded-xl shadow-md" alt="Evidence" />
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEvidenceImage(null); setEvidencePreview(null); }}
                                                    className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                                <p className="mt-4 text-green-600 font-bold text-sm flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Image Ready</p>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer block w-full h-full py-4">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:text-rastha-primary group-hover:bg-white transition-colors shadow-sm">
                                                    <UploadCloud size={32} />
                                                </div>
                                                <p className="font-bold text-gray-700 dark:text-gray-300 text-lg">Click to Upload Photo</p>
                                                <p className="text-sm text-gray-500 mt-2">Please ensure the repair is clearly visible.</p>
                                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        )}
                                    </div>

                                    <Button 
                                        onClick={handleSubmitCompletion} 
                                        disabled={!evidenceImage || isSubmitting}
                                        className="w-full py-4 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20 rounded-xl"
                                    >
                                        {isSubmitting ? 'Submitting Update...' : 'Mark Job Complete'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorDashboard;