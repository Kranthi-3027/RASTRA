import React, { useEffect, useState } from 'react';
import { Card, StatusBadge, SeverityBadge, Logo } from '../components/UI.tsx';
import { api } from '../services/mockApi.ts';
import { Complaint } from '../types';
import { MapPin, Clock } from 'lucide-react';

const UserHome = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await api.getComplaints();
      setComplaints(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="pb-20 pt-4 px-4 max-w-2xl mx-auto space-y-4">
      <header className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-bold text-rastha-primary dark:text-white">Community Feed</h1>
         <div className="bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 h-10 w-10 flex items-center justify-center overflow-hidden">
           <div className="w-8 h-8 flex items-center justify-center">
             <Logo className="w-full h-full" showText={false} />
           </div>
         </div>
      </header>

      {loading ? (
        <div className="space-y-4">
           {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>)}
        </div>
      ) : (
        complaints.map((complaint) => (
          <ComplaintCard key={complaint.id} complaint={complaint} />
        ))
      )}
    </div>
  );
};

const ComplaintCard: React.FC<{ complaint: Complaint }> = ({ complaint }) => (
  <Card className="mb-4">
    <div className="relative">
      <img src={complaint.imageUrl} alt="Road damage" className="w-full h-56 object-cover" />
      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
        <StatusBadge status={complaint.status} />
        <SeverityBadge severity={complaint.severity} />
      </div>
    </div>
    <div className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{complaint.id}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Clock size={12} />
          {complaint.timestamp.toLocaleDateString()}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{complaint.description}</p>
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
        <MapPin size={14} className="mr-1 text-rastha-primary dark:text-rastha-secondary" />
        {complaint.address}
      </div>
    </div>
  </Card>
);

export default UserHome;