import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card, StatusBadge, SeverityBadge, Logo, Button, useNavigate, useTranslation } from '../components/UI.tsx';
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

// --- COMPLAINT CARD ---
const ComplaintCard = ({ 
    complaint, 
    onOpenDrawer,
    isActive, 
    onToggleConcern,
    onDelete,
    isMenuOpen,
    onToggleMenu
}: { 
    complaint: Complaint, 
    onOpenDrawer: (tab: 'details' | 'comments') => void, 
    isActive: boolean,
    onToggleConcern: () => void,
    onDelete: () => void,
    isMenuOpen: boolean,
    onToggleMenu: () => void
}) => {
    const { t } = useTranslation();
    const isOwner = complaint.userId === MOCK_USER.id;

    // Check if complaint is locked (Assigned or Repaired)
    const isLocked = complaint.status === ComplaintStatus.ASSIGNED || complaint.status === ComplaintStatus.REPAIRED;

    return (
        <Card className={`overflow-hidden transition-all duration-300 h-full flex flex-col ${isActive ? 'ring-2 ring-rastha-primary dark:ring-rastha-secondary' : 'hover:shadow-lg'}`}>
            {/* Header / Image */}
            <div className="relative h-48 sm:h-56 bg-gray-200 dark:bg-gray-800 group cursor-pointer" onClick={() => onOpenDrawer('details')}>
                <img src={complaint.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Evidence" />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <StatusBadge status={complaint.status} />
                </div>

                {/* Menu (Delete/Share) */}
                <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                        <button 
                            onClick={onToggleMenu}
                            className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all"
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        
                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={onToggleMenu}></div>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 animate-fade-in origin-top-right">
                                    <button className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                        <Share2 size={16} /> Share Report
                                    </button>
                                    {isOwner && (
                                        isLocked ? (
                                            <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50">
                                                <Lock size={16} /> {t('deleteLocked')}
                                            </div>
                                        ) : (
                                            <button onClick={onDelete} className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                                                <Trash2 size={16} /> {t('delete')}
                                            </button>
                                        )
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-2 text-white/90 text-xs mb-1 font-medium">
                                <Clock size={12} /> {new Date(complaint.timestamp).toLocaleDateString()}
                            </div>
                            <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 drop-shadow-md">
                                {complaint.address.split(',')[0]}
                            </h3>
                        </div>
                        <SeverityBadge severity={complaint.severity} />
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-3 flex items-center justify-between bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <button 
                    onClick={onToggleConcern}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        complaint.hasRaisedConcern 
                        ? 'text-rastha-primary bg-rastha-primary/10 dark:text-rastha-secondary dark:bg-rastha-secondary/10' 
                        : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                >
                    <ThumbsUp size={18} className={complaint.hasRaisedConcern ? "fill-current" : ""} />
                    <span>{complaint.concernCount || 0}</span>
                </button>

                <button 
                    onClick={() => onOpenDrawer('comments')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 transition-all"
                >
                    <MessageCircle size={18} />
                    <span>{complaint.comments?.length || 0}</span>
                </button>

                <button 
                    onClick={() => onOpenDrawer('details')}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold text-rastha-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ml-auto"
                >
                    {t('view')} <ChevronRight size={16} />
                </button>
            </div>
        </Card>
    );
};

interface UserHomeProps {
    onLogout: () => void;
}

const UserHome: React.FC<UserHomeProps> = ({ onLogout }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  
  // State for handling dropdown menu visibility and z-index layering
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [drawerTab, setDrawerTab] = useState<'details' | 'comments'>('comments');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      setOpenMenuId(null); // Close any open menus
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
    if (window.confirm(t('confirmDelete'))) {
        try {
            await api.deleteComplaint(id);
            setComplaints(prev => prev.filter(c => c.id !== id));
            if (openMenuId === id) setOpenMenuId(null);
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
                <h1 className="text-3xl font-bold text-rastha-primary dark:text-white tracking-tight">{t('communityFeed')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('feedSubtitle')}</p>
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
                                        {t('logout')}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative isolate">
            {sortedComplaints.map((complaint) => (
                <div 
                    key={complaint.id} 
                    // Dynamic z-index: Elevated when menu is open to prevent clipping by subsequent cards
                    className={`transition-all duration-300 rounded-2xl relative ${
                        activeComplaintId === complaint.id 
                        ? 'ring-2 ring-rastha-primary shadow-xl scale-[1.01] z-40' 
                        : 'hover:shadow-lg hover:-translate-y-1'
                    } ${openMenuId === complaint.id ? 'z-50' : 'z-0'}`}
                >
                    <ComplaintCard 
                        complaint={complaint} 
                        onOpenDrawer={(tab) => openDrawer(complaint.id, tab)}
                        isActive={activeComplaintId === complaint.id}
                        onToggleConcern={() => handleToggleConcern(complaint.id)}
                        onDelete={() => handleDelete(complaint.id)}
                        isMenuOpen={openMenuId === complaint.id}
                        onToggleMenu={() => setOpenMenuId(openMenuId === complaint.id ? null : complaint.id)}
                    />
                </div>
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in min-h-[50vh]">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-full mb-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
                    <Camera size={48} className="text-rastha-primary dark:text-rastha-secondary opacity-80" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('noReports')}</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-3 mb-8 leading-relaxed">
                    {t('startReportingDesc')}
                </p>
                <Button 
                    onClick={() => navigate('/user/report')}
                    className="px-8 py-4 text-base rounded-2xl shadow-xl shadow-rastha-primary/20"
                >
                    <Camera size={20} />
                    {t('startReporting')}
                </Button>
            </div>
        )}
        </div>

        {/* DETAILS & COMMENTS DRAWER - Rendered via Portal */}
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
    const { t } = useTranslation();
    
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

    const drawerContent = (
        <>
           <div 
             className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] animate-fade-in transition-opacity duration-300" 
             onClick={onClose}
           ></div>
           
           <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-[9999] animate-slide-in-right flex flex-col border-l border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-out font-sans">
               
               {/* Header */}
               <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl sticky top-0 z-10 flex flex-col gap-4">
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
                           <Info size={16} /> {t('details')}
                       </button>
                       <button 
                         onClick={() => onTabChange('comments')}
                         className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'comments' ? 'bg-white dark:bg-gray-700 text-rastha-primary dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                       >
                           <MessageCircle size={16} /> {t('discussion')} <span className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 rounded-full">{comments.length}</span>
                       </button>
                   </div>
               </div>
               
               <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900 scroll-smooth">
                   
                   {/* === TAB: DETAILS === */}
                   {activeTab === 'details' && (
                       <div className="p-6 space-y-6 animate-fade-in">
                           {/* Image */}
                           <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group relative bg-gray-100">
                               <img src={complaint.imageUrl} className="w-full h-64 object-cover hover:scale-105 transition-transform duration-700" alt="Evidence" />
                           </div>

                           {/* Description */}
                           <div>
                               <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                   <AlertOctagon size={16} className="text-rastha-primary" /> {t('description')}
                               </h4>
                               <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-sm leading-relaxed text-gray-700 dark:text-gray-300 break-words">
                                   {complaint.description || "No specific description provided by the reporter."}
                               </div>
                           </div>

                           {/* AI Assessment */}
                           <div className="grid grid-cols-2 gap-4">
                               <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                   <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('aiSeverityScore')}</p>
                                   <div className="flex items-end gap-2">
                                       <span className={`text-2xl font-bold ${complaint.severityScore > 7 ? 'text-red-500' : 'text-yellow-500'}`}>{complaint.severityScore}</span>
                                       <span className="text-xs text-gray-400 mb-1">/ 10</span>
                                   </div>
                               </div>
                               <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                   <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('assignedUnit')}</p>
                                   <div className="font-medium text-gray-800 dark:text-white text-sm">
                                       {complaint.departments[0] || "General"}
                                   </div>
                               </div>
                           </div>

                           {/* Map Location */}
                           <div>
                               <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                   <Map size={16} className="text-rastha-primary" /> {t('locationMap')}
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
                       </div>
                   )}

                   {/* === TAB: COMMENTS === */}
                   {activeTab === 'comments' && (
                       <div className="flex flex-col h-full">
                           <div className="flex-1 p-4 space-y-4">
                               {comments.length === 0 ? (
                                   <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                                       <MessageCircle size={48} className="mb-2" />
                                       <p className="text-sm font-medium">No comments yet.</p>
                                       <p className="text-xs">Start a discussion with authorities.</p>
                                   </div>
                               ) : (
                                   comments.map((comment) => (
                                       <div key={comment.id} className={`flex gap-3 ${comment.userId === MOCK_USER.id ? 'flex-row-reverse' : ''}`}>
                                           <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0 border border-gray-100 dark:border-gray-700">
                                               <img src={comment.avatarUrl} alt="User" className="w-full h-full object-cover" />
                                           </div>
                                           <div className={`flex flex-col max-w-[80%] ${comment.userId === MOCK_USER.id ? 'items-end' : 'items-start'}`}>
                                               <div className={`px-4 py-2 rounded-2xl text-sm ${comment.userId === MOCK_USER.id ? 'bg-rastha-primary text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-none shadow-sm'}`}>
                                                   {comment.text}
                                               </div>
                                               <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                   {comment.userName} • {new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                               </span>
                                           </div>
                                       </div>
                                   ))
                               )}
                               <div ref={commentsEndRef} />
                           </div>
                           
                           {/* Comment Input */}
                           <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 sticky bottom-0">
                               <div className="flex gap-2">
                                   <input 
                                     type="text" 
                                     value={commentText}
                                     onChange={(e) => setCommentText(e.target.value)}
                                     placeholder="Type a message..."
                                     className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rastha-primary/50 text-gray-900 dark:text-white"
                                     onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                                   />
                                   <Button 
                                     disabled={!commentText.trim() || isSubmitting} 
                                     onClick={handlePostComment}
                                     className="px-0 w-10 h-10 flex items-center justify-center rounded-xl"
                                   >
                                       {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                   </Button>
                               </div>
                           </div>
                       </div>
                   )}
               </div>
           </div>
        </>
    );

    return createPortal(drawerContent, document.body);
};

export default UserHome;