import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/UI.tsx';
import { HardHat, Star, MapPin, Phone, Briefcase, ChevronRight, Clock, X, Users, Hammer, AlertCircle, Filter } from 'lucide-react';
import { api } from '../services/mockApi.ts';
import { Contractor, UserRole } from '../types';

interface ContractorsPageProps {
    role?: UserRole;
}

const ContractorsPage: React.FC<ContractorsPageProps> = ({ role }) => {
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await api.getContractors();
            setContractors(data);
            setLoading(false);
        };
        load();
    }, []);

    // Filter Logic
    const filteredContractors = contractors.filter(c => {
        if (!role || role === UserRole.ADMIN) return true; // Admin sees all

        const spec = c.specialization.toLowerCase();
        
        if (role === UserRole.ENGINEERING) {
            return spec.includes('road') || spec.includes('civil') || spec.includes('pavement') || spec.includes('bridge') || spec.includes('infrastructure') || spec.includes('patching');
        }
        if (role === UserRole.WARD_OFFICE) {
            return spec.includes('debris') || spec.includes('sanitation') || spec.includes('waste') || spec.includes('cleaning') || spec.includes('tree');
        }
        if (role === UserRole.WATER_DEPT) {
            return spec.includes('water') || spec.includes('drainage') || spec.includes('pipeline') || spec.includes('sewage') || spec.includes('leakage');
        }
        
        return false;
    });

    // Stats
    const totalContractors = filteredContractors.length;
    const totalActiveJobs = filteredContractors.reduce((acc, c) => acc + c.activeProjects, 0);
    const avgRating = totalContractors > 0 ? (filteredContractors.reduce((acc, c) => acc + c.rating, 0) / totalContractors).toFixed(1) : "0.0";

    return (
        <div className="p-4 md:p-6 w-full space-y-6 h-full flex flex-col max-w-6xl mx-auto animate-fade-in">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-rastha-primary dark:text-white flex items-center gap-2">
                        {role === UserRole.ADMIN ? 'Global Contractor Registry' : 'Department Contractors'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {role === UserRole.ADMIN 
                            ? 'Manage all authorized service providers across all departments.' 
                            : `Manage service providers authorized for ${role?.replace('_', ' ')} tasks.`}
                    </p>
                </div>
                {role === UserRole.ADMIN && (
                    <Button className="shadow-lg shadow-blue-500/20">
                        <Briefcase size={18} /> Add New Contractor
                    </Button>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 flex items-center justify-between border-l-4 border-l-blue-500">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approved Agencies</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalContractors}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <Users size={24} />
                    </div>
                </Card>
                <Card className="p-5 flex items-center justify-between border-l-4 border-l-orange-500">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Jobs</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalActiveJobs}</h3>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                        <Hammer size={24} />
                    </div>
                </Card>
                <Card className="p-5 flex items-center justify-between border-l-4 border-l-green-500">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Performance</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{avgRating} / 5.0</h3>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                        <Star size={24} />
                    </div>
                </Card>
            </div>

            {/* List */}
            <Card className="overflow-hidden min-h-[400px] flex flex-col">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2">
                        <Filter size={16} /> Registry List
                    </h3>
                    <span className="text-xs text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                        Showing {filteredContractors.length} results
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4">Company / Contractor</th>
                                <th className="px-6 py-4">Specialization</th>
                                <th className="px-6 py-4">Rating</th>
                                <th className="px-6 py-4 text-center">Active Work</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading registry...</td></tr>
                            ) : filteredContractors.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No contractors found for this category.</td></tr>
                            ) : filteredContractors.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{c.company}</p>
                                            <p className="text-xs text-gray-500">{c.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-600">
                                            {c.specialization}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <Star size={14} className="text-yellow-400 fill-current" />
                                            <span className="font-bold text-gray-700 dark:text-gray-200">{c.rating}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {c.activeProjects > 0 ? (
                                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-bold">
                                                {c.activeProjects} Active
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Idle</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                            c.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                                            c.status === 'Probation' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                                            'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => setSelectedContractor(c)}
                                            className="text-rastha-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full transition-colors"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* DETAILS MODAL */}
            {selectedContractor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        
                        {/* Modal Header */}
                        <div className="p-6 bg-rastha-primary text-white relative">
                            <button 
                                onClick={() => setSelectedContractor(null)}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white text-rastha-primary rounded-xl flex items-center justify-center shadow-lg">
                                    <HardHat size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedContractor.company}</h2>
                                    <p className="opacity-90 text-sm flex items-center gap-2">
                                        <Briefcase size={14} /> {selectedContractor.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-6 bg-gray-50 dark:bg-gray-800/50">
                            
                            {/* Key Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Rating</p>
                                    <div className="flex items-center justify-center gap-1 mt-1 text-yellow-500">
                                        <span className="text-xl font-bold">{selectedContractor.rating}</span> <Star size={16} fill="currentColor" />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Completed</p>
                                    <p className="text-xl font-bold text-green-600 mt-1">{selectedContractor.completedProjects}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Contact</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 flex items-center justify-center gap-1">
                                        <Phone size={12} /> Call
                                    </p>
                                </div>
                            </div>

                            {/* Work History */}
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                    <Clock size={18} className="text-gray-400" /> Recent Work History
                                </h3>
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    {selectedContractor.history.map((job, idx) => (
                                        <div key={job.id} className={`p-4 flex items-center justify-between ${idx !== selectedContractor.history.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 rounded">{job.id}</span>
                                                    <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{job.description}</p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <MapPin size={10} /> {job.location} • {job.date}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                job.status === 'Completed' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                            }`}>
                                                {job.status}
                                            </span>
                                        </div>
                                    ))}
                                    {selectedContractor.history.length === 0 && (
                                        <div className="p-6 text-center text-gray-400 text-sm">No recent history available.</div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                                <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Contractor Verification</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                        This contractor is authorized for municipal works. Specialized in {selectedContractor.specialization}.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorsPage;