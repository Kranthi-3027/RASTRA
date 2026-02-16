import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/UI.tsx';
import { api } from '../services/mockApi.ts';
import { TrafficPersonnel } from '../types';
import { Siren, Shield, MapPin, Phone, Search, Circle, Clock, User, X, Users, BadgeCheck } from 'lucide-react';

const TrafficPersonnelPage = () => {
    const [personnel, setPersonnel] = useState<TrafficPersonnel[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPerson, setSelectedPerson] = useState<TrafficPersonnel | null>(null);
    const [filter, setFilter] = useState<'All' | 'Officers' | 'Volunteers' | 'Active'>('All');

    useEffect(() => {
        const loadData = async () => {
            const data = await api.getTrafficPersonnel();
            setPersonnel(data);
            setLoading(false);
        };
        loadData();
    }, []);

    // Filter Logic
    const filteredPersonnel = personnel.filter(p => {
        if (filter === 'All') return true;
        if (filter === 'Active') return p.status !== 'Off Duty';
        if (filter === 'Volunteers') return p.rank.includes('Volunteer');
        if (filter === 'Officers') return !p.rank.includes('Volunteer');
        return true;
    });

    const stats = {
        total: personnel.length,
        officers: personnel.filter(p => !p.rank.includes('Volunteer')).length,
        volunteers: personnel.filter(p => p.rank.includes('Volunteer')).length,
        active: personnel.filter(p => p.status !== 'Off Duty').length
    };

    return (
        <div className="p-4 md:p-6 w-full space-y-6 h-full flex flex-col max-w-6xl mx-auto animate-fade-in">
            
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-rastha-primary dark:text-white flex items-center gap-2">
                    <Siren size={24} className="text-red-600" /> Force Roster
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Manage Traffic Police and Civilian Volunteers.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Police Officers</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.officers}</h3>
                    </div>
                    <BadgeCheck className="text-blue-500 opacity-20" size={32} />
                </Card>
                <Card className="p-4 border-l-4 border-l-yellow-500 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Volunteers</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.volunteers}</h3>
                    </div>
                    <Users className="text-yellow-500 opacity-20" size={32} />
                </Card>
                <Card className="p-4 border-l-4 border-l-green-500 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Currently Active</p>
                        <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.active}</h3>
                    </div>
                    <Circle className="text-green-500 opacity-20" size={32} />
                </Card>
                <Card className="p-4 border-l-4 border-l-gray-500 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Total Force</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.total}</h3>
                    </div>
                    <Shield className="text-gray-500 opacity-20" size={32} />
                </Card>
            </div>

            {/* List & Filters */}
            <Card className="overflow-hidden min-h-[400px] flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600 shadow-sm">
                        {(['All', 'Officers', 'Volunteers', 'Active'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    filter === f 
                                    ? 'bg-rastha-primary text-white shadow-sm' 
                                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative text-gray-400">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Search name or badge..." 
                            className="pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-rastha-primary/50 w-48 md:w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4">Name / ID</th>
                                <th className="px-6 py-4">Rank & Role</th>
                                <th className="px-6 py-4">Current Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading roster...</td></tr>
                            ) : filteredPersonnel.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${p.rank.includes('Volunteer') ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                                                <p className="text-xs text-gray-500 font-mono">{p.badgeNumber}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${
                                            p.rank.includes('Volunteer') 
                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' 
                                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                        }`}>
                                            {p.rank}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-gray-400" />
                                            {p.currentLocation}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Circle size={8} className={`fill-current ${
                                                p.status === 'Available' ? 'text-green-500 animate-pulse' : 
                                                p.status === 'Busy' ? 'text-red-500' : 'text-gray-300'
                                            }`} />
                                            <span className={`font-medium text-xs ${p.status === 'Off Duty' ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" className="text-xs h-8 px-3 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSelectedPerson(p)}>
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* DETAIL MODAL */}
            {selectedPerson && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Shield size={18} className="text-rastha-primary"/> Personnel Details
                            </h3>
                            <button onClick={() => setSelectedPerson(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg ${selectedPerson.rank.includes('Volunteer') ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                                    {selectedPerson.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPerson.name}</h2>
                                    <p className="text-sm font-medium text-rastha-primary dark:text-blue-400">{selectedPerson.rank}</p>
                                    <p className="text-xs text-gray-500">{selectedPerson.badgeNumber}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                                    <p className={`font-bold mt-1 ${
                                        selectedPerson.status === 'Available' ? 'text-green-600' : 
                                        selectedPerson.status === 'Busy' ? 'text-red-600' : 'text-gray-500'
                                    }`}>
                                        {selectedPerson.status}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Last Active</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-1 flex items-center gap-1">
                                        <Clock size={14} className="text-gray-400" /> {selectedPerson.lastActive}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <MapPin size={20} className="text-rastha-primary" />
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold">Current Location</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedPerson.currentLocation}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <Phone size={20} className="text-rastha-primary" />
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold">Contact Number</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedPerson.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                            <Button className="w-full shadow-lg" onClick={() => { alert(`Calling ${selectedPerson.name}...`); }}>
                                <Phone size={16} /> Contact {selectedPerson.rank.includes('Volunteer') ? 'Volunteer' : 'Officer'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrafficPersonnelPage;