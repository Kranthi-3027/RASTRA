import React, { useState, useEffect } from 'react';
import { api } from '../services/mockApi.ts';
import { Complaint, ComplaintStatus, UserRole } from '../types';
import { MOCK_CONTRACTOR_USER } from '../constants';
import { Card, Button, StatusBadge } from '../components/UI.tsx';
import { ClipboardList, Camera, MapPin, CheckCircle2, Clock, Calendar, AlertTriangle, UploadCloud, ChevronRight, X, XCircle } from 'lucide-react';

// ContractorDashboard receives the active contractorId and display name from App.
// When the demo CONTRACTOR role is used (password gate, no Firebase), we fall back
// to MOCK_CONTRACTOR_USER so the demo still works out-of-the-box.
interface ContractorDashboardProps {
  contractorId?: string;
  contractorName?: string;
}

const ContractorDashboard = ({ contractorId, contractorName }: ContractorDashboardProps) => {
    // Fall back to demo mock values so the app works without a real contractor account
    const activeId   = contractorId   || MOCK_CONTRACTOR_USER.id;
    const activeName = contractorName || MOCK_CONTRACTOR_USER.name;

    const [tasks, setTasks] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Complaint | null>(null);
    const [evidenceImage, setEvidenceImage] = useState<File | null>(null);
    const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                // Server-side filter: only this contractor's assigned complaints
                const myTasks = await api.getContractorComplaints(activeId);
                myTasks.sort((a, b) => {
                    // Rejected tasks bubble to very top — contractor needs to act on them
                    if (a.rejectionReason && !b.rejectionReason) return -1;
                    if (!a.rejectionReason && b.rejectionReason) return 1;
                    // Active work next, then awaiting verify, then fully repaired
                    const isDone = (s: ComplaintStatus) => s === ComplaintStatus.REPAIRED || s === ComplaintStatus.PENDING_DEPT_VERIFICATION;
                    if (!isDone(a.status) && isDone(b.status)) return -1;
                    if (isDone(a.status) && !isDone(b.status)) return 1;
                    // Both done: PENDING_DEPT_VERIFICATION before REPAIRED
                    if (a.status === ComplaintStatus.PENDING_DEPT_VERIFICATION && b.status === ComplaintStatus.REPAIRED) return -1;
                    if (a.status === ComplaintStatus.REPAIRED && b.status === ComplaintStatus.PENDING_DEPT_VERIFICATION) return 1;
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                });
                setTasks(myTasks);
            } catch (e) {
                console.error('[ContractorDashboard] Failed to load tasks:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [activeId]);

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
            
            // Optimistic update — status moves to Pending Verification, not Repaired yet
            setTasks(prev => prev.map(t => t.id === selectedTask.id ? { 
                ...t, 
                status: ComplaintStatus.PENDING_DEPT_VERIFICATION, 
                repairEvidenceUrl: evidencePreview || undefined
            } : t));
            
            alert("Evidence submitted! Awaiting department verification.");
            setSelectedTask(null);
            setEvidenceImage(null);
            setEvidencePreview(null);
        } catch (e) {
            console.error(e);
            alert("Failed to submit update.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Stats
    const pendingCount = tasks.filter(t => t.status !== ComplaintStatus.REPAIRED && t.status !== ComplaintStatus.PENDING_DEPT_VERIFICATION && !t.rejectionReason).length;
    const completedCount = tasks.filter(t => t.status === ComplaintStatus.REPAIRED).length;
    const awaitingVerifyCount = tasks.filter(t => t.status === ComplaintStatus.PENDING_DEPT_VERIFICATION).length;
    const rejectedCount = tasks.filter(t => !!t.rejectionReason).length;

    return (
        <div className="p-4 md:p-8 w-full max-w-6xl mx-auto animate-fade-in space-y-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-rastha-primary dark:text-white">Contractor Portal</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Welcome back, <span className="font-bold text-gray-800 dark:text-gray-200">{activeName}</span></p>
                </div>
                <div className="flex gap-4">
                    <Card className="px-5 py-3 flex items-center gap-3 border-orange-200 bg-orange-50 dark:bg-orange-900/10">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600"><AlertTriangle size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Pending</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{pendingCount}</p>
                        </div>
                    </Card>
                    <Card className="px-5 py-3 flex items-center gap-3 border-amber-200 bg-amber-50 dark:bg-amber-900/10">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600"><Clock size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Awaiting Verify</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{awaitingVerifyCount}</p>
                        </div>
                    </Card>
                    {rejectedCount > 0 && (
                        <Card className="px-5 py-3 flex items-center gap-3 border-red-200 bg-red-50 dark:bg-red-900/10">
                            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg text-red-600"><XCircle size={20} /></div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Rejected</p>
                                <p className="text-xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</p>
                            </div>
                        </Card>
                    )}
                    <Card className="px-5 py-3 flex items-center gap-3 border-green-200 bg-green-50 dark:bg-green-900/10">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600"><CheckCircle2 size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Completed</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{completedCount}</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Task List */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <ClipboardList size={20} className="text-rastha-primary"/> Assigned Work Orders
                </h2>
                
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading assignments...</div>
                ) : tasks.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white">All Caught Up!</h3>
                        <p className="text-sm text-gray-500">No pending work orders assigned to you.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tasks.map(task => (
                            <Card 
                                key={task.id} 
                                onClick={() => setSelectedTask(task)}
                                className={`group cursor-pointer hover:shadow-lg transition-all border-l-4 ${task.status === ComplaintStatus.REPAIRED ? 'border-l-green-500 opacity-80' : task.status === ComplaintStatus.PENDING_DEPT_VERIFICATION ? 'border-l-amber-400' : task.rejectionReason ? 'border-l-red-500' : 'border-l-orange-500'}`}
                            >
                                <div className="relative h-40 overflow-hidden bg-gray-200">
                                    <img src={task.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Site" />
                                    <div className="absolute top-2 right-2">
                                        <StatusBadge status={task.status} />
                                    </div>
                                    {task.rejectionReason && (
                                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <XCircle size={10}/> Rejected
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-800 dark:text-white font-mono">{task.id}</h3>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${task.severityScore > 7 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            Sev: {task.severityScore}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 h-10">{task.description}</p>
                                    
                                    <div className="space-y-2 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-rastha-primary"/> {task.address}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} /> Assigned: {task.contractorAssignedDate ? new Date(task.contractorAssignedDate).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* COMPLETION MODAL */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Work Order Details</h3>
                                <p className="text-xs text-gray-500 font-mono mt-1">{selectedTask.id}</p>
                            </div>
                            <button onClick={() => {setSelectedTask(null); setEvidenceImage(null); setEvidencePreview(null);}} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Task Info */}
                            <div className="flex gap-4">
                                <img src={selectedTask.imageUrl} className="w-1/3 h-32 object-cover rounded-xl bg-gray-200" alt="Before" />
                                <div className="flex-1 space-y-2">
                                    <h4 className="font-bold text-sm uppercase text-gray-500">Task Description</h4>
                                    <p className="text-gray-800 dark:text-white text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                        {selectedTask.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                        <MapPin size={14} /> {selectedTask.address}
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            {selectedTask.status === ComplaintStatus.REPAIRED ? (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 dark:text-green-300">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="font-bold text-green-800 dark:text-green-300 text-lg">Work Verified & Closed</h3>
                                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                        Department confirmed on {selectedTask.repairedDate?.toLocaleDateString()}
                                    </p>
                                    {selectedTask.repairEvidenceUrl && (
                                        <div className="mt-4">
                                            <p className="text-xs font-bold uppercase text-green-600 mb-2">Submitted Evidence</p>
                                            <img src={selectedTask.repairEvidenceUrl} className="h-40 mx-auto rounded-lg border border-green-200" alt="Proof" />
                                        </div>
                                    )}
                                </div>
                            ) : selectedTask.status === ComplaintStatus.PENDING_DEPT_VERIFICATION ? (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600 dark:text-amber-300">
                                        <Clock size={32} />
                                    </div>
                                    <h3 className="font-bold text-amber-800 dark:text-amber-300 text-lg">Evidence Submitted</h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Awaiting department verification</p>
                                    {selectedTask.repairEvidenceUrl && (
                                        <div className="mt-4">
                                            <p className="text-xs font-bold uppercase text-amber-600 mb-2">Your Submitted Evidence</p>
                                            <img src={selectedTask.repairEvidenceUrl} className="h-40 mx-auto rounded-lg border border-amber-200" alt="Evidence" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    {/* REJECTION BANNER — shown when dept rejected previous submission */}
                                    {selectedTask.rejectionReason && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex gap-3">
                                            <div className="shrink-0 w-9 h-9 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center text-red-600 dark:text-red-300">
                                                <XCircle size={20}/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-red-800 dark:text-red-300">Repair Rejected by Department</p>
                                                <p className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed">"{selectedTask.rejectionReason}"</p>
                                                <p className="text-[10px] text-red-500 dark:text-red-500 mt-2">Please redo the repair and submit new evidence below.</p>
                                            </div>
                                        </div>
                                    )}
                                    <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <Camera size={18} className="text-rastha-primary"/> Submit Proof of Repair
                                    </h4>
                                    
                                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${evidencePreview ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-700 hover:border-rastha-primary hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        {evidencePreview ? (
                                            <div className="relative inline-block">
                                                <img src={evidencePreview} className="h-48 rounded-lg shadow-sm" alt="Evidence" />
                                                <button 
                                                    onClick={() => { setEvidenceImage(null); setEvidencePreview(null); }}
                                                    className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer block w-full h-full">
                                                <UploadCloud size={40} className="mx-auto text-gray-400 mb-3" />
                                                <p className="font-medium text-gray-700 dark:text-gray-300">Click to Upload "After" Photo</p>
                                                <p className="text-xs text-gray-500 mt-1">Required to close the ticket</p>
                                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        )}
                                    </div>

                                    <Button 
                                        onClick={handleSubmitCompletion} 
                                        disabled={!evidenceImage || isSubmitting}
                                        className="w-full py-4 text-base bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Mark Job Complete'}
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