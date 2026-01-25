import React, { useEffect, useState } from 'react';
import { Card, StatusBadge, SeverityBadge, Logo } from '../components/UI.tsx';
import { api } from '../services/mockApi.ts';
import { Complaint } from '../types';
import { MapPin, Clock, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserHome = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const data = await api.getComplaints();
      setComplaints(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="pb-20 md:pb-8 pt-4 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center mb-6">
         <h1 className="text-2xl md:text-3xl font-bold text-rastha-primary dark:text-white">Community Feed</h1>
         <div className="bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 h-10 w-10 flex items-center justify-center overflow-hidden md:hidden">
           <div className="w-8 h-8 flex items-center justify-center">
             <Logo className="w-full h-full" showText={false} />
           </div>
         </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>)}
        </div>
      ) : complaints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
                <Camera size={48} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200">No Reports Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-3 mb-8">
                Be the first to report road damage in your area. Your contribution helps improve our city's infrastructure.
            </p>
            <button 
                onClick={() => navigate('/user/report')}
                className="bg-rastha-primary text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
            >
                <Camera size={20} />
                Report Damage Now
            </button>
        </div>
      )}
    </div>
  );
};

const ComplaintCard: React.FC<{ complaint: Complaint }> = ({ complaint }) => (
  <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
    <div className="relative h-48 sm:h-56">
      <img src={complaint.imageUrl} alt="Road damage" className="w-full h-full object-cover" />
      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
        <StatusBadge status={complaint.status} />
        <SeverityBadge severity={complaint.severity} />
      </div>
    </div>
    <div className="p-4 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{complaint.id}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Clock size={12} />
          {complaint.timestamp.toLocaleDateString()}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 flex-1">{complaint.description}</p>
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded mt-auto">
        <MapPin size={14} className="mr-1 text-rastha-primary dark:text-rastha-secondary shrink-0" />
        <span className="truncate">{complaint.address}</span>
      </div>
    </div>
  </Card>
);

export default UserHome;