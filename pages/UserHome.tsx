import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, StatusBadge, SeverityBadge, Logo, Button, useNavigate } from '../components/UI.tsx';
import { api } from '../services/mockApi.ts';
import { Complaint, Comment, ComplaintStatus } from '../types';
import { MapPin, Clock, Camera, MessageCircle, Send, User, X, Loader2, MoreHorizontal, ThumbsUp, Trash2, Copy, Share2, Info, Flag, AlertOctagon, CheckCircle2, ChevronRight, ChevronLeft, Map, Lock, LogOut } from 'lucide-react';
import { MOCK_USER } from '../constants';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';

// Fix for React Leaflet types
const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;
const CircleMarkerAny = CircleMarker as any;

// Component to force Leaflet to resize correctly
const MapRefresher = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

interface UserHomeProps {
    onLogout: () => void;
}

const UserHome: React.FC<UserHomeProps> = ({ onLogout }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'comments'>('comments');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const data = await api.getComplaints();
      setComplaints(data);
      setLoading(false);
    };
    fetch();
  }, []);

  // Sort complaints: Repaired at bottom, others by date descending
  const sortedComplaints = useMemo(() => {
      return [...complaints].sort((a, b) => {
          const isARepaired = a.status === ComplaintStatus.REPAIRED;
          const isBRepaired = b.status === ComplaintStatus.REPAIRED;
          
          if (isARepaired && !isBRepaired) return 1;
          if (!isARepaired && isBRepaired) return -1;
          
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [complaints]);

  const activeComplaint = complaints.find(c => c.id === activeComplaintId);

  const openDrawer = (id: string, tab: 'details' | 'comments' = 'comments') => {
      setActiveComplaintId(id);
      setDrawerTab(tab);
  };

  const handleCommentAdded = (complaintId: string, newComment: Comment) => {
     setComplaints(current => current.map(c => {
         if (c.id === complaintId) {
             return { ...c, comments: [...(c.comments || []), newComment] };
         }
         return c;
     }));
  };

  const handleToggleConcern = async (complaintId: string) => {
      setComplaints(current => current.map(c => {
          if (c.id === complaintId) {
              const isRaising = !c.hasRaisedConcern;
              return { 
                  ...c, 
                  hasRaisedConcern: isRaising,
                  concernCount: isRaising ? c.concernCount + 1 : Math.max(0, c.concernCount - 1)
              };
          }
          return c;
      }));
      try {
          await api.toggleConcern(complaintId);
      } catch (error) {
          console.error("Failed to toggle concern", error);
      }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
        try {
            await api.deleteComplaint(id);
            setComplaints(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            console.error(e);
            alert("Failed to delete complaint");
        }
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="pb-24 md:pb-12 pt-6 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center z-20 relative">
            <div>
                <h1 className="text-3xl font-bold text-rastha-primary dark:text-white tracking-tight">Community Feed</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time updates from your neighborhood</p>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 h-12 w-12 flex items-center justify-center md:hidden">
                     <Logo className="w-8 h-8" showText={false} />
                </div>

                {/* Profile Dropdown */}
                <div className="relative z-50">
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-md hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-rastha-primary/50 relative"
                    >
                        <img src={MOCK_USER.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    </button>

                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                            <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in origin-top-right ring-1 ring-black/5">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                                            <img src={MOCK_USER.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{MOCK_USER.name}</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{MOCK_USER.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700 text-center select-all">
                                        {MOCK_USER.email}
                                    </p>
                                </div>
                                <div className="p-2">
                                    <button 
                                        onClick={() => { setShowProfileMenu(false); onLogout(); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium group"
                                    >
                                        <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-colors">
                                            <LogOut size={14} />
                                        </div>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>)}
            </div>
        ) : sortedComplaints.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            {sortedComplaints.map((complaint) => (
                <div 
                    key={complaint.id} 
                    className={`transition-all duration-300 rounded-2xl ${
                        activeComplaintId === complaint.id 
                        ? 'ring-2 ring-rastha-primary shadow-xl scale-[1.01] z-10' 
                        : 'hover:shadow-lg hover:-translate-y-1'
                    }`}
                >
                    <ComplaintCard 
                        complaint={complaint} 
                        onOpenDrawer={(tab) => openDrawer(complaint.id, tab)}
                        isActive={activeComplaintId === complaint.id}
                        onToggleConcern={() => handleToggleConcern(complaint.id)}
                        onDelete={() => handleDelete(complaint.id)}
                    />
                </div>
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in min-h-[50vh]">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-full mb-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
                    <Camera size={48} className="text-rastha-primary dark:text-rastha-secondary opacity-80" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">No Reports Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-3 mb-8 leading-relaxed">
                    Be the first to report road damage. Your contribution directly improves our city's infrastructure.
                </p>
                <Button 
                    onClick={() => navigate('/user/report')}
                    className="px-8 py-4 text-base rounded-2xl shadow-xl shadow-rastha-primary/20"
                >
                    <Camera size={20} />
                    Start Reporting
                </Button>
            </div>
        )}
        </div>

        {/* DETAILS & COMMENTS DRAWER */}
        <ComplaintDetailsDrawer 
            complaint={activeComplaint || null} 
            activeTab={drawerTab}
            onTabChange={setDrawerTab}
            onClose={() => setActiveComplaintId(null)} 
            onCommentAdded={handleCommentAdded}
        />
    </div>
  );
};

// --- COMPLAINT DETAILS DRAWER (TABS: DETAILS | COMMENTS) ---
const ComplaintDetailsDrawer = ({ 
    complaint, 
    activeTab, 
    onTabChange,
    onClose, 
    onCommentAdded 
}: { 
    complaint: Complaint | null, 
    activeTab: 'details' | 'comments',
    onTabChange: (t: 'details' | 'comments') => void,
    onClose: () => void, 
    onCommentAdded: (id: string, c: Comment) => void 
}) => {
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);
    
    // Scroll to bottom when new comments arrive
    useEffect(() => {
        if (complaint && activeTab === 'comments') {
            setTimeout(() => {
                commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    }, [complaint?.comments?.length, complaint, activeTab]);

    if (!complaint) return null;

    const comments = complaint.comments || [];

    const handlePostComment = async () => {
        if (!commentText.trim()) return;
        setIsSubmitting(true);
        try {
            const newComment = await api.addComment(complaint.id, commentText, MOCK_USER);
            onCommentAdded(complaint.id, newComment);
            setCommentText("");
        } catch (e) {
            console.error(e);
            alert("Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
           <div 
             className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90] animate-fade-in transition-opacity duration-300" 
             onClick={onClose}
           ></div>
           
           <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-[100] animate-slide-in-right flex flex-col border-l border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-out">
               
               {/* Header */}
               <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl sticky top-0 z-10 flex flex-col gap-4">
                   <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                                {complaint.id}
                                <StatusBadge status={complaint.status} />
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reported on {new Date(complaint.timestamp).toLocaleDateString()}</p>
                        </div>
                        <button 
                                onClick={onClose} 
                                className="p-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-all group"
                        >
                            <X size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white" />
                        </button>
                   </div>

                   {/* Tabs */}
                   <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                       <button 
                         onClick={() => onTabChange('details')}
                         className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'details' ? 'bg-white dark:bg-gray-700 text-rastha-primary dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                       >
                           <Info size={16} /> Details
                       </button>
                       <button 
                         onClick={() => onTabChange('comments')}
                         className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'comments' ? 'bg-white dark:bg-gray-700 text-rastha-primary dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                       >
                           <MessageCircle size={16} /> Discussion <span className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 rounded-full">{comments.length}</span>
                       </button>
                   </div>
               </div>
               
               <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900 scroll-smooth">
                   
                   {/* === TAB: DETAILS === */}
                   {activeTab === 'details' && (
                       <div className="p-6 space-y-6 animate-fade-in">
                           {/* Image */}
                           <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group">
                               <img src={complaint.imageUrl} className="w-full h-64 object-cover hover:scale-105 transition-transform duration-700" alt="Evidence" />
                           </div>

                           {/* Description */}
                           <div>
                               <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                   <AlertOctagon size={16} className="text-rastha-primary" /> Description
                               </h4>
                               <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                   {complaint.description || "No specific description provided by the reporter."}
                               </div>
                           </div>

                           {/* AI Assessment */}
                           <div className="grid grid-cols-2 gap-4">
                               <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                   <p className="text-xs text-gray-500 uppercase font-bold mb-1">AI Severity Score</p>
                                   <div className="flex items-end gap-2">
                                       <span className={`text-2xl font-bold ${complaint.severityScore > 7 ? 'text-red-500' : 'text-yellow-500'}`}>{complaint.severityScore}</span>
                                       <span className="text-xs text-gray-400 mb-1">/ 10</span>
                                   </div>
                               </div>
                               <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                   <p className="text-xs text-gray-500 uppercase font-bold mb-1">Assigned Unit</p>
                                   <div className="font-medium text-gray-800 dark:text-white text-sm">
                                       {complaint.departments[0] || "General"}
                                   </div>
                               </div>
                           </div>

                           {/* Map Location */}
                           <div>
                               <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                   <Map size={16} className="text-rastha-primary" /> Location Map
                               </h4>
                               <div className="h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0">
                                    <MapContainerAny 
                                        center={[complaint.latitude, complaint.longitude]} 
                                        zoom={14} 
                                        scrollWheelZoom={false}
                                        style={{ height: "100%", width: "100%" }}
                                        zoomControl={false}
                                    >
                                        <MapRefresher />
                                        <TileLayerAny url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <CircleMarkerAny center={[complaint.latitude, complaint.longitude]} pathOptions={{color: 'red'}} radius={10} />
                                    </MapContainerAny>
                                    <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-1 rounded text-xs font-mono border border-gray-200 dark:border-gray-700 z-[400]">
                                        {complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}
                                    </div>
                               </div>
                               <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                   <MapPin size={12}/> {complaint.address}
                               </p>
                           </div>

                           {/* Status History (Mock) */}
                           <div>
                               <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3">Status History</h4>
                               <div className="space-y-4 border-l-2 border-gray-200 dark:border-gray-700 ml-2 pl-4 relative">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900"></div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white">{complaint.status}</p>
                                        <p className="text-xs text-gray-500">Latest update</p>
                                    </div>
                                    <div className="relative opacity-70">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-900"></div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Issue Reported</p>
                                        <p className="text-xs text-gray-500">{new Date(complaint.timestamp).toLocaleString()}</p>
                                    </div>
                               </div>
                           </div>
                       </div>
                   )}

                   {/* === TAB: COMMENTS === */}
                   {activeTab === 'comments' && (
                       <div className="p-6 space-y-6">
                           {comments.length === 0 ? (
                               <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                                   <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full">
                                       <MessageCircle size={32} className="text-gray-400" />
                                   </div>
                                   <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">No comments yet</p>
                                        <p className="text-xs text-gray-500">Start the conversation about this report.</p>
                                   </div>
                               </div>
                           ) : (
                               comments.map((c, index) => {
                                   const isMe = c.userId === MOCK_USER.id;
                                   return (
                                       <div key={c.id || index} className={`flex gap-3 animate-fade-in ${isMe ? 'flex-row-reverse' : ''}`}>
                                           <div className="flex-shrink-0">
                                               {c.avatarUrl ? (
                                                   <img src={c.avatarUrl} className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-gray-800" alt={c.userName} />
                                               ) : (
                                                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                                       <User size={14} className="text-gray-500 dark:text-gray-400"/>
                                                   </div>
                                               )}
                                           </div>
                                           <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                                               <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{c.userName}</span>
                                                    <span className="text-[10px] text-gray-400">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                               </div>
                                               <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                   isMe 
                                                   ? 'bg-rastha-primary text-white rounded-tr-none' 
                                                   : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                                               }`}>
                                                    {c.text}
                                               </div>
                                           </div>
                                       </div>
                                   )
                               })
                           )}
                           <div ref={commentsEndRef} />
                       </div>
                   )}
               </div>
               
               {/* Footer Input Area (Only for Comments Tab) */}
               {activeTab === 'comments' && (
                   <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 sticky bottom-0">
                      <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-3xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-rastha-primary/20 focus-within:border-rastha-primary/50 transition-all shadow-sm">
                            <textarea 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handlePostComment();
                                    }
                                }}
                                placeholder="Write a comment..."
                                rows={1}
                                className="flex-1 max-h-32 min-h-[44px] py-3 px-4 bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-800 dark:text-gray-100 resize-none placeholder-gray-400 scrollbar-hide w-full"
                                style={{ height: 'auto' }}
                            />
                            <button 
                                onClick={handlePostComment}
                                disabled={isSubmitting || !commentText.trim()}
                                className="mb-1 p-2.5 rounded-full bg-rastha-primary text-white hover:bg-rastha-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex-shrink-0"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} className={commentText.trim() ? "ml-0.5" : ""} />}
                            </button>
                      </div>
                      <p className="text-[10px] text-center text-gray-400 mt-2">Press Enter to send • Shift + Enter for new line</p>
                   </div>
               )}
           </div>
           
           <style>{`
               @keyframes slideInRight {
                   from { transform: translateX(100%); }
                   to { transform: translateX(0); }
               }
               .animate-slide-in-right {
                   animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
               }
           `}</style>
        </>
    )
}

interface ComplaintCardProps { 
    complaint: Complaint; 
    onOpenDrawer: (tab: 'details' | 'comments') => void; 
    isActive?: boolean; 
    onToggleConcern: () => void;
    onDelete: () => void;
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, onOpenDrawer, isActive, onToggleConcern, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportSubmenu, setShowReportSubmenu] = useState(false);
  
  const isConcernRaised = complaint.hasRaisedConcern;
  const isOwner = MOCK_USER.id === complaint.userId;
  const isLocked = complaint.status === ComplaintStatus.ASSIGNED || complaint.status === ComplaintStatus.REPAIRED;
  const canDelete = isOwner && !isLocked;

  // -- Handlers --
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onOpenDrawer('details');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    // Copy ID Logic - Primary action requested by user
    const textToCopy = `${complaint.id}`;
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        alert(`Complaint ID ${complaint.id} copied to clipboard!`);
    } catch (err) {
        console.error("Failed to copy", err);
        // Fallback or silently fail if clipboard API not available
    }
  };

  const handleReport = async (reason: 'Duplicate' | 'Fake' | 'Fixed' | 'Location') => {
      setShowMenu(false);
      setShowReportSubmenu(false);
      try {
          await api.flagComplaint(complaint.id, reason);
          alert(`Report submitted as "${reason}". Thank you for helping verify this issue.`);
      } catch (e) {
          console.error(e);
          alert("Failed to submit report.");
      }
  };

  // Reset submenu when closing main menu
  useEffect(() => {
      if (!showMenu) setShowReportSubmenu(false);
  }, [showMenu]);

  return (
    <Card className={`flex flex-col h-full border overflow-visible ${isActive ? 'border-rastha-primary/30 dark:border-rastha-primary/30' : 'border-gray-100 dark:border-gray-700'}`}>
      <div className="relative h-56 sm:h-64 overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer rounded-t-2xl" onClick={() => onOpenDrawer('details')}>
        <img 
            src={complaint.imageUrl} 
            alt="Road damage" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-80"></div>
        
        <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-800 flex items-center gap-1.5 shadow-sm">
                <Clock size={10} className="text-rastha-primary"/>
                {new Date(complaint.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          <StatusBadge status={complaint.status} />
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-2">
                 <SeverityBadge severity={complaint.severity} />
            </div>
            <p className="text-xs font-medium opacity-90 flex items-center gap-1 mb-1 text-gray-200">
                <MapPin size={12} className="text-rastha-secondary" /> {complaint.address}
            </p>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-b-2xl">
        <div className="flex justify-between items-start mb-3 relative">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white font-mono tracking-tight group-hover:text-rastha-primary transition-colors cursor-pointer" onClick={() => onOpenDrawer('details')}>
              {complaint.id}
          </h3>
          
          <div className="relative">
            <button 
                className={`p-1 rounded-full transition-colors ${showMenu ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            >
                <MoreHorizontal size={18} />
            </button>
            
            {/* RICH DROPDOWN MENU */}
            {showMenu && (
                <>
                <div className="fixed inset-0 z-10 cursor-default" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}></div>
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden animate-fade-in origin-top-right ring-1 ring-black/5">
                    
                    {!showReportSubmenu ? (
                        // MAIN MENU
                        <div className="py-1">
                            <button onClick={handleViewDetails} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3">
                                <Info size={16} className="text-gray-400"/> View Details
                            </button>
                            
                            <button onClick={handleShare} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700/50">
                                <Share2 size={16} className="text-gray-400"/> Share Complaint
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); handleReport('Duplicate'); }} className="w-full text-left px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 flex items-center gap-3">
                                <Copy size={16} /> Report as Duplicate
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); setShowReportSubmenu(true); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3"><Flag size={16} /> Report Issue</div>
                                <ChevronRight size={14} />
                            </button>

                            {isOwner && (
                                isLocked ? (
                                    <div className="w-full text-left px-4 py-3 text-xs text-gray-400 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700 cursor-not-allowed bg-gray-50/50 dark:bg-gray-800/50">
                                        <Lock size={14} /> Deletion Locked (Processing)
                                    </div>
                                ) : (
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700">
                                        <Trash2 size={16} /> Delete My Report
                                    </button>
                                )
                            )}
                        </div>
                    ) : (
                        // SUBMENU: REPORT ISSUES
                        <div className="py-1 bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="px-4 py-2 flex items-center gap-2 text-xs font-bold text-gray-400 border-b border-gray-100 dark:border-gray-700 mb-1">
                                <button onClick={(e) => { e.stopPropagation(); setShowReportSubmenu(false); }} className="hover:text-rastha-primary"><ChevronLeft size={12} /></button>
                                REPORT REASON
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleReport('Fake'); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                                <AlertOctagon size={14} className="text-red-400"/> Fake/Misleading
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleReport('Location'); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                                <MapPin size={14} className="text-red-400"/> Wrong Location
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleReport('Fixed'); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/10 flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-green-500"/> Already Fixed
                            </button>
                        </div>
                    )}
                </div>
                </>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-5 line-clamp-2 leading-relaxed flex-1">
            {complaint.description || "No description provided."}
        </p>

        {/* Action Bar */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex items-center justify-between gap-4">
           {/* Raise Concern Button */}
           <button 
             onClick={(e) => { e.stopPropagation(); onToggleConcern(); }}
             className={`flex items-center gap-2 text-sm font-medium transition-all py-2 px-3 rounded-lg flex-1 justify-center active:scale-95 duration-200
               ${isConcernRaised 
                  ? 'bg-rastha-primary/10 text-rastha-primary border border-rastha-primary/20 dark:bg-rastha-primary/20 dark:text-white dark:border-rastha-primary/30' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-700/30 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200 border border-transparent'
               }`}
           >
             <ThumbsUp size={18} className={`transition-transform duration-300 ${isConcernRaised ? 'fill-current scale-110' : ''}`} />
             <span className="whitespace-nowrap">
                {isConcernRaised ? 'Concern Raised' : 'Raise Concern'}
                {complaint.concernCount > 0 && <span className="ml-1 opacity-80">({complaint.concernCount})</span>}
             </span>
           </button>

           {/* Comment Button */}
           <button 
             onClick={() => onOpenDrawer('comments')}
             className={`flex items-center gap-2 text-sm font-medium transition-all py-2 px-3 rounded-lg flex-1 justify-center ${
                 isActive 
                 ? 'bg-rastha-primary/10 text-rastha-primary dark:bg-rastha-primary/20 dark:text-rastha-secondary' 
                 : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
             }`}
           >
             <MessageCircle size={18} className={isActive ? "fill-current" : ""} />
             <span>
                {complaint.comments?.length > 0 ? `${complaint.comments.length}` : 'Comment'}
             </span>
           </button>
        </div>
      </div>
    </Card>
  );
};

export default UserHome;