import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi.ts';
import { MOCK_USER } from '../constants';
import { Complaint } from '../types';
import { Card, StatusBadge, SeverityBadge, Button } from '../components/UI.tsx';
import { ChevronRight, X, Trash2, MapPin, AlertTriangle, Calendar } from 'lucide-react';

const ComplaintStatusPage = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchComplaints = async () => {
    const data = await api.getUserComplaints(MOCK_USER.id);
    setComplaints(data);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
        setLoading(true);
        await api.deleteComplaint(id);
        setSelectedComplaint(null);
        await fetchComplaints();
        setLoading(false);
    }
  };

  return (
    <div className="pb-20 md:pb-8 pt-6 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white mb-6">My Complaints</h1>
      
      {complaints.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <p>No complaints reported yet.</p>
          <Button variant="ghost" className="mt-4 text-rastha-primary">Start a Report</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {complaints.map(c => (
            <Card 
              key={c.id} 
              className="flex p-4 items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group hover:shadow-md border border-gray-100 dark:border-gray-700"
              onClick={() => setSelectedComplaint(c)}
            >
               <img src={c.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-gray-200 dark:bg-gray-700 shrink-0" alt="thumb" />
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-rastha-primary transition-colors">{c.id}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.description}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                    <Calendar size={10} />
                    {c.timestamp.toLocaleDateString()}
                  </p>
               </div>
               <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-rastha-primary transition-colors" size={20} />
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up sm:animate-none">
             
             {/* Modal Header/Image */}
             <div className="relative h-64 shrink-0 bg-gray-100 dark:bg-gray-700">
                <img src={selectedComplaint.imageUrl} className="w-full h-full object-cover" alt="Evidence" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <button 
                  onClick={() => setSelectedComplaint(null)} 
                  className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/60 transition-colors"
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
             <div className="p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                   <StatusBadge status={selectedComplaint.status} />
                   <SeverityBadge severity={selectedComplaint.severity} />
                </div>

                <div className="space-y-6">
                   <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl flex items-start gap-3 border border-gray-100 dark:border-gray-700">
                      <MapPin size={20} className="text-rastha-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Location</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{selectedComplaint.address}</p>
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          {selectedComplaint.latitude.toFixed(6)}, {selectedComplaint.longitude.toFixed(6)}
                        </p>
                      </div>
                   </div>
                   
                   <div>
                      <h3 className="font-semibold mb-2 dark:text-gray-200 text-sm uppercase text-gray-500">Description</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-xl">
                         {selectedComplaint.description || "No specific description provided."}
                      </p>
                   </div>
                </div>
             </div>

             {/* Modal Footer */}
             <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 pb-safe">
                <Button 
                  variant="danger" 
                  className="w-full flex items-center justify-center gap-2 py-3.5 shadow-lg shadow-red-100 dark:shadow-none"
                  onClick={() => handleDelete(selectedComplaint.id)}
                  isLoading={loading}
                >
                   <Trash2 size={18} /> 
                   Delete Complaint
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintStatusPage;