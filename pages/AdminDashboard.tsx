import React, { useState, useEffect } from 'react';
import { api } from '../services/mockApi.ts';
import { Complaint, ComplaintStatus } from '../types';
import { Card, Button, StatusBadge } from '../components/UI.tsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; 
import { LayoutDashboard, List, CheckSquare, XCircle, Map as MapIcon, Filter, Clock } from 'lucide-react';

// --- VISUAL MAP COMPONENT (No external dependencies) ---
const VisualMap = ({ complaints }: { complaints: Complaint[] }) => {
  return (
    <div className="w-full h-96 bg-gray-100 rounded-xl relative overflow-hidden border border-gray-200 group">
      {/* Abstract Map Background */}
      <div className="absolute inset-0 bg-[#e5e5f7] opacity-60" style={{ backgroundImage: 'radial-gradient(#444cf7 0.5px, transparent 0.5px), radial-gradient(#444cf7 0.5px, #e5e5f7 0.5px)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
         {/* Fake Roads */}
         <div className="absolute top-1/4 left-0 w-full h-2 bg-gray-300 transform -rotate-2"></div>
         <div className="absolute top-0 left-1/3 h-full w-2 bg-gray-300 transform rotate-12"></div>
         <div className="absolute bottom-1/4 right-0 w-2/3 h-2 bg-gray-300 transform rotate-2"></div>
      </div>

      {/* Pins */}
      {complaints.map((c, i) => (
        <div 
          key={c.id} 
          className="absolute transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform cursor-pointer"
          style={{ 
            top: `${30 + (i * 15) % 60}%`, 
            left: `${20 + (i * 20) % 70}%` 
          }}
          title={c.address}
        >
          <div className={`p-2 rounded-full shadow-lg border-2 border-white ${c.status === 'Auto-Verified' ? 'bg-rastha-alert' : c.status === 'Waiting List' ? 'bg-blue-500' : 'bg-rastha-warning'}`}>
             <MapIcon size={16} className="text-white" />
          </div>
        </div>
      ))}
      
      <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow text-xs">
        <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-rastha-alert rounded-full"></span> Critical</div>
        <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> Waiting</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-rastha-warning rounded-full"></span> Warning</div>
      </div>
      
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded shadow text-sm font-semibold">
        Live Heatmap View
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'waiting'>('map');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    api.getComplaints().then(setComplaints);
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: ComplaintStatus) => {
    await api.updateComplaintStatus(id, newStatus);
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    setSelectedComplaint(null);
  };

  const waitingCount = complaints.filter(c => c.status === ComplaintStatus.WAITING_LIST).length;
  
  const filteredComplaints = activeTab === 'waiting' 
    ? complaints.filter(c => c.status === ComplaintStatus.WAITING_LIST) 
    : complaints;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT PANEL: MAIN VIEW */}
        <div className="flex-1 space-y-6">
           <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-gray-800">
               {activeTab === 'waiting' ? 'Waiting List' : 'Overview'}
             </h2>
             <div className="bg-white rounded-lg shadow-sm p-1 flex">
               <button 
                 onClick={() => setActiveTab('map')} 
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'map' ? 'bg-rastha-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
               >
                 Map View
               </button>
               <button 
                 onClick={() => setActiveTab('list')} 
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-rastha-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
               >
                 Main List
               </button>
               <button 
                 onClick={() => setActiveTab('waiting')} 
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'waiting' ? 'bg-rastha-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
               >
                 Waiting List
                 {waitingCount > 0 && (
                   <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'waiting' ? 'bg-white text-rastha-primary' : 'bg-red-100 text-red-600'}`}>
                     {waitingCount}
                   </span>
                 )}
               </button>
             </div>
           </div>

           {activeTab === 'map' ? (
             <VisualMap complaints={complaints} />
           ) : (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                {filteredComplaints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <CheckSquare size={48} className="mb-2 opacity-20" />
                    <p>No complaints found in this view.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-4 font-semibold text-gray-600">ID</th>
                        <th className="p-4 font-semibold text-gray-600">Location</th>
                        <th className="p-4 font-semibold text-gray-600">Status</th>
                        <th className="p-4 font-semibold text-gray-600">Time</th>
                        <th className="p-4 font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplaints.map(c => (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="p-4 font-mono font-medium">{c.id}</td>
                          <td className="p-4 max-w-xs truncate">{c.address}</td>
                          <td className="p-4"><StatusBadge status={c.status} /></td>
                          <td className="p-4 text-gray-500 text-xs">{c.timestamp.toLocaleDateString()}</td>
                          <td className="p-4">
                            <Button variant="ghost" className="text-rastha-primary text-xs" onClick={() => setSelectedComplaint(c)}>Review</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
             </div>
           )}
        </div>

        {/* RIGHT PANEL: DETAILS & STATS */}
        <div className="w-full md:w-96 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
             <Card className="p-4 bg-blue-50 border-blue-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('waiting')}>
               <div className="flex justify-between items-start mb-2">
                 <h3 className="text-2xl font-bold text-rastha-primary">{waitingCount}</h3>
                 <Clock size={16} className="text-blue-400" />
               </div>
               <p className="text-xs text-gray-600">Waiting for Review</p>
             </Card>
             <Card className="p-4 bg-green-50 border-green-100">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="text-2xl font-bold text-green-700">{complaints.filter(c => c.status === ComplaintStatus.REPAIRED).length}</h3>
                 <CheckSquare size={16} className="text-green-400" />
               </div>
               <p className="text-xs text-gray-600">Repaired This Week</p>
             </Card>
          </div>

          {/* Selected Complaint Detail */}
          {selectedComplaint ? (
            <Card className="p-4 sticky top-24 animate-fade-in border-rastha-primary border-2">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg">Complaint Review</h3>
                <button onClick={() => setSelectedComplaint(null)}><XCircle className="text-gray-400 hover:text-gray-600" size={20}/></button>
              </div>
              <img src={selectedComplaint.imageUrl} className="w-full h-48 object-cover rounded-lg mb-4 bg-gray-200" alt="evidence" />
              
              <div className="space-y-3 mb-6">
                <div><span className="text-xs text-gray-500 uppercase font-bold">ID</span> <div className="font-mono">{selectedComplaint.id}</div></div>
                <div><span className="text-xs text-gray-500 uppercase font-bold">Status</span> <div className="mt-1"><StatusBadge status={selectedComplaint.status} /></div></div>
                <div><span className="text-xs text-gray-500 uppercase font-bold">Description</span> <div className="text-sm">{selectedComplaint.description}</div></div>
                <div><span className="text-xs text-gray-500 uppercase font-bold">Address</span> <div className="text-sm">{selectedComplaint.address}</div></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="text-xs" 
                  onClick={() => handleStatusUpdate(selectedComplaint.id, ComplaintStatus.IGNORED)}
                >
                  Ignore
                </Button>
                {selectedComplaint.status === ComplaintStatus.WAITING_LIST ? (
                   <Button 
                     className="text-xs bg-rastha-primary text-white hover:bg-opacity-90"
                     onClick={() => handleStatusUpdate(selectedComplaint.id, ComplaintStatus.AUTO_VERIFIED)}
                   >
                     Verify & Approve
                   </Button>
                ) : (
                   <Button 
                     className="text-xs bg-rastha-secondary text-rastha-primary hover:bg-opacity-80"
                     onClick={() => handleStatusUpdate(selectedComplaint.id, ComplaintStatus.ASSIGNED)}
                   >
                     Assign Worker
                   </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-gray-400 border-dashed border-2">
               <List className="mx-auto mb-2 opacity-50" />
               <p className="text-sm">Select a complaint from the list to review details and take action.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;