import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi.ts';
import { MOCK_USER } from '../constants';
import { Complaint } from '../types';
import { Card, StatusBadge } from '../components/UI.tsx';
import { ChevronRight } from 'lucide-react';

const ComplaintStatusPage = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    api.getUserComplaints(MOCK_USER.id).then(setComplaints);
  }, []);

  return (
    <div className="pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-rastha-primary dark:text-white mb-6">My Complaints</h1>
      
      {complaints.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
          No complaints reported yet.
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(c => (
            <Card key={c.id} className="flex p-4 items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
               <img src={c.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-gray-200 dark:bg-gray-700" alt="thumb" />
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{c.id}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{c.description}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">{c.timestamp.toLocaleDateString()}</p>
               </div>
               <ChevronRight className="text-gray-300 dark:text-gray-600" size={20} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintStatusPage;