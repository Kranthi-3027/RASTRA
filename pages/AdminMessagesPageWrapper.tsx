import React from 'react';
import MessagesPage from './MessagesPage.tsx';

const AdminMessagesPageWrapper = () => {
  return (
    <div className="p-4 md:p-6 w-full h-full flex flex-col space-y-4 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold text-rastha-primary dark:text-white">Interdepartmental Messaging</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Direct and group channels between all departments</p>
      </header>
      <div className="flex-1">
        <MessagesPage
          currentUserId="admin-superuser"
          currentUserName="Super Admin"
          currentDept="Admin"
        />
      </div>
    </div>
  );
};

export default AdminMessagesPageWrapper;
