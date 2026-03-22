import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card, StatusBadge, SeverityBadge, Logo, Button, useNavigate, useTranslation } from '../components/UI.tsx';
import { api } from '../services/mockApi.ts';
import { Complaint, Comment, ComplaintStatus } from '../types';
import { MapPin, Clock, Camera, MessageCircle, Send, User, X, Loader2, MoreHorizontal, ThumbsUp, Trash2, Copy, Share2, Info, Flag, AlertOctagon, CheckCircle2, ChevronRight, ChevronLeft, Map, Lock, LogOut, AlertTriangle, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { useCurrentUser } from '../context/UserContext';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';

// Fix for React Leaflet types
const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;

// ── Avatar with initials fallback ─────────────────────────────────────────────
const AvatarImg = ({ src, name, className }: { src?: string; name?: string; className?: string }) => {
    const initials = (name || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const [broken, setBroken] = useState(!src);
    if (!broken && src) {
        return <img src={src} alt={name || 'User'} className={className} onError={() => setBroken(true)} />;
    }
    return (
        <div className={`flex items-center justify-center bg-rastha-primary text-white font-bold text-xs select-none ${className}`}>
            {initials}
        </div>
    );
};
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
    onToggleCommunityReport,
    onDelete,
    isMenuOpen,
    onToggleMenu
}: { 
    complaint: Complaint, 
    onOpenDrawer: (tab: 'details' | 'comments') => void, 
    isActive: boolean,
    onToggleConcern: () => void,
    onToggleCommunityReport: () => void,
    onDelete: () => void,
    isMenuOpen: boolean,
    onToggleMenu: () => void
}) => {
    const { t } = useTranslation();
    const currentUser = useCurrentUser();
    const isOwner = complaint.userId === currentUser.id;
    const [showFlagMenu, setShowFlagMenu] = useState(false);
    const [flagged, setFlagged] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}#/user/status?id=${complaint.id}`;
        const shareData = {
            title: `RASHTRA — Complaint ${complaint.id}`,
            text: `Road damage reported at ${complaint.address}. Status: ${complaint.status}. Track it on RASHTRA.`,
            url: shareUrl,
        };
        try {
            if (navigator.share && navigator.canShare?.(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2500);
            }
        } catch {
            // User cancelled or error — copy as fallback
            try {
                await navigator.clipboard.writeText(shareUrl);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2500);
            } catch {}
        }
        onToggleMenu();
    };

    // User can delete if complaint is Uploaded or Verified (pre-assignment)
    const deletableStatuses = [ComplaintStatus.SUBMITTED, ComplaintStatus.AUTO_VERIFIED];
    const isLocked = !deletableStatuses.includes(complaint.status);

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

                {/* Community report count badge */}
                {(complaint.communityReportCount > 0) && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2">
                        <div className="flex items-center gap-1 bg-orange-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-[10px] font-bold">
                            <AlertTriangle size={10} /> {complaint.communityReportCount} also saw this
                        </div>
                    </div>
                )}

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
                                <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 animate-fade-in origin-top-right">
                                    <button className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200" onClick={handleShare}>
                                        {shareCopied ? <CheckCircle2 size={16} className="text-green-500" /> : <Share2 size={16} />}
                                        {shareCopied ? 'Link copied!' : 'Share Report'}
                                    </button>
                                    {!isOwner && (
                                      <div className="border-t border-gray-100 dark:border-gray-700">
                                        <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Report this complaint</p>
                                        {([
                                          { reason: 'Fake' as const,      label: 'Report as Fake',       icon: AlertOctagon, color: 'text-red-500' },
                                          { reason: 'Duplicate' as const, label: 'Mark as Duplicate',    icon: Copy,         color: 'text-orange-500' },
                                          { reason: 'Fixed' as const,     label: 'Already Fixed',        icon: CheckCircle2, color: 'text-green-600' },
                                          { reason: 'Location' as const,  label: 'Wrong Location',       icon: MapPin,       color: 'text-blue-500' },
                                        ]).map(({ reason, label, icon: Icon, color }) => (
                                          <button
                                            key={reason}
                                            onClick={async () => {
                                              if (flagged) return;
                                              try {
                                                await api.flagComplaint(complaint.id, reason);
                                                setFlagged(true);
                                                onToggleMenu();
                                              } catch {}
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${color} ${flagged ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          >
                                            <Icon size={14} /> {flagged ? 'Reported' : label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    {isOwner && (
                                        isLocked ? (
                                            <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                                                <Lock size={16} /> {t('deleteLocked')}
                                            </div>
                                        ) : (
                                            <button onClick={onDelete} className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400 font-medium border-t border-gray-100 dark:border-gray-700">
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
                {/* Concern/Like */}
                <button 
                    onClick={onToggleConcern}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                        complaint.hasRaisedConcern 
                        ? 'text-rastha-primary bg-rastha-primary/10 dark:text-rastha-secondary dark:bg-rastha-secondary/10' 
                        : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                    title="I'm concerned about this"
                >
                    <ThumbsUp size={16} className={complaint.hasRaisedConcern ? "fill-current" : ""} />
                    <span>{complaint.concernCount || 0}</span>
                </button>

                {/* Community Report — "I've seen this too" */}
                {!isOwner && (
                    <button 
                        onClick={onToggleCommunityReport}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                            complaint.hasReported
                            ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20'
                            : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-orange-900/20'
                        }`}
                        title="I've seen this damage too — report to boost priority"
                    >
                        <Flag size={16} className={complaint.hasReported ? "fill-current" : ""} />
                        <span>{complaint.communityReportCount || 0}</span>
                    </button>
                )}

                {/* Comments */}
                <button 
                    onClick={() => onOpenDrawer('comments')}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 transition-all"
                >
                    <MessageCircle size={16} />
                    <span>{complaint.comments?.length || 0}</span>
                </button>

                <button 
                    onClick={() => onOpenDrawer('details')}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-bold text-rastha-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ml-auto"
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
  const currentUser = useCurrentUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  
  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // State for handling dropdown menu visibility and z-index layering
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [drawerTab, setDrawerTab] = useState<'details' | 'comments'>('comments');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchComplaints = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    const data = await api.getComplaints();
    setComplaints(data);
    setLoading(false);
    if (showRefreshSpinner) setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    fetchComplaints();
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

  // Apply search + filter on top of sorted list
  const filteredComplaints = useMemo(() => {
      return sortedComplaints.filter(c => {
          const q = searchQuery.toLowerCase().trim();
          if (q && !c.address?.toLowerCase().includes(q) && !c.description?.toLowerCase().includes(q) && !c.id?.toLowerCase().includes(q)) return false;
          if (filterStatus !== 'all' && c.status !== filterStatus) return false;
          if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
          return true;
      });
  }, [sortedComplaints, searchQuery, filterStatus, filterSeverity]);

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
      const current_complaint = complaints.find(c => c.id === complaintId);
      const wasRaised = current_complaint?.hasRaisedConcern ?? false;
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
          await api.toggleConcern(complaintId, wasRaised);
      } catch (error) {
          console.error("Failed to toggle concern", error);
      }
  };

  const handleToggleCommunityReport = async (complaintId: string) => {
      const complaint = complaints.find(c => c.id === complaintId);
      if (!complaint || complaint.userId === currentUser.id) return; // can't report own
      if (complaint.hasReported) return; // already reported — one-time action
      
      setComplaints(current => current.map(c => {
          if (c.id === complaintId) {
              return { ...c, hasReported: true, communityReportCount: (c.communityReportCount || 0) + 1 };
          }
          return c;
      }));
      try {
          await api.toggleCommunityReport(complaintId);
      } catch (error) {
          console.error("Failed to submit community report", error);
          // Rollback
          setComplaints(current => current.map(c => {
              if (c.id === complaintId) {
                  return { ...c, hasReported: false, communityReportCount: Math.max(0, (c.communityReportCount || 1) - 1) };
              }
              return c;
          }));
      }
  };
  const handleDelete = async (id: string) => {
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return;
    const deletableStatuses = [ComplaintStatus.SUBMITTED, ComplaintStatus.AUTO_VERIFIED];
    if (!deletableStatuses.includes(complaint.status)) {
      alert("This complaint cannot be deleted once workers have been assigned or it has been further processed.");
      return;
    }
    if (window.confirm(t('confirmDelete'))) {
        try {
            await api.deleteComplaint(id, {
              actorId: currentUser.id,
              actorName: currentUser.name,
              actorRole: 'USER',
              reason: 'Withdrawn by citizen',
            });
            setComplaints(prev => prev.filter(c => c.id !== id));
            if (openMenuId === id) setOpenMenuId(null);
        } catch (e: any) {
            alert(e.message || "Failed to delete complaint");
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
                        <AvatarImg src={currentUser.avatarUrl} name={currentUser.name} className="w-full h-full object-cover" />
                    </button>

                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                            <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in origin-top-right ring-1 ring-black/5">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                                            <AvatarImg src={currentUser.avatarUrl} name={currentUser.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{currentUser.name}</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{currentUser.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700 text-center select-all">
                                        {currentUser.email}
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

        {/* ── Search + Filter Bar ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by address, description, or ID..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-rastha-primary/40 text-gray-900 dark:text-white"
                />
            </div>
            {/* Filter Toggle */}
            <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters ? 'bg-rastha-primary text-white border-rastha-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
                <SlidersHorizontal size={16} /> Filters
                {(filterStatus !== 'all' || filterSeverity !== 'all') && (
                    <span className="w-2 h-2 rounded-full bg-rastha-secondary inline-block"></span>
                )}
            </button>
            {/* Refresh */}
            <button
                onClick={() => fetchComplaints(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-60"
                title="Refresh feed"
            >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
            </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
            <div className="flex flex-wrap gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 animate-fade-in">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</label>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rastha-primary/40"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Uploaded">Submitted</option>
                        <option value="Verified">AI Verified</option>
                        <option value="Workers Assigned">Assigned</option>
                        <option value="Repaired">Repaired</option>
                        <option value="Waiting List">Waiting List</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Severity</label>
                    <select
                        value={filterSeverity}
                        onChange={e => setFilterSeverity(e.target.value)}
                        className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rastha-primary/40"
                    >
                        <option value="all">All Severities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                {(filterStatus !== 'all' || filterSeverity !== 'all') && (
                    <button
                        onClick={() => { setFilterStatus('all'); setFilterSeverity('all'); }}
                        className="self-end text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        )}

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>)}
            </div>
        ) : filteredComplaints.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative isolate">
            {filteredComplaints.map((complaint) => (
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
                        onToggleCommunityReport={() => handleToggleCommunityReport(complaint.id)}
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
                    {(searchQuery || filterStatus !== 'all' || filterSeverity !== 'all')
                        ? <Search size={48} className="text-gray-400 opacity-80" />
                        : <Camera size={48} className="text-rastha-primary dark:text-rastha-secondary opacity-80" />
                    }
                </div>
                {(searchQuery || filterStatus !== 'all' || filterSeverity !== 'all') ? (
                    <>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">No matching complaints</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-3 mb-8 leading-relaxed">
                            Try adjusting your search or filters to see more results.
                        </p>
                        <Button variant="ghost" onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterSeverity('all'); }}>
                            Clear all filters
                        </Button>
                    </>
                ) : (
                    <>
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
                    </>
                )}
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
    const [sentFlash, setSentFlash] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const currentUser = useCurrentUser();
    
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
            const newComment = await api.addComment(complaint.id, commentText, currentUser);
            onCommentAdded(complaint.id, newComment);
            setCommentText("");
            setSentFlash(true);
            setTimeout(() => setSentFlash(false), 1500);
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

                           {/* Community Stats */}
                           <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                               <p className="text-xs text-gray-500 uppercase font-bold mb-3">Community Activity</p>
                               <div className="flex items-center gap-4">
                                   <div className="flex items-center gap-2">
                                       <ThumbsUp size={14} className="text-rastha-primary" />
                                       <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{complaint.concernCount}</span>
                                       <span className="text-xs text-gray-500">Concerns</span>
                                   </div>
                                   <div className="h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
                                   <div className="flex items-center gap-2">
                                       <Flag size={14} className="text-orange-500" />
                                       <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{complaint.communityReportCount || 0}</span>
                                       <span className="text-xs text-gray-500">Also saw this</span>
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
                       <div className="flex flex-col" style={{ minHeight: '400px' }}>
                           <div className="flex-1 p-4 space-y-4 min-h-[300px]">
                               {comments.length === 0 ? (
                                   <div className="flex flex-col items-center justify-center text-center p-8 opacity-50 mt-8">
                                       <MessageCircle size={48} className="mb-2" />
                                       <p className="text-sm font-medium">No comments yet.</p>
                                       <p className="text-xs">Start a discussion with authorities.</p>
                                   </div>
                               ) : (
                                   comments.map((comment) => (
                                       <div key={comment.id} className={`flex gap-3 ${comment.userId === currentUser.id ? 'flex-row-reverse' : ''}`}>
                                           <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0 border border-gray-100 dark:border-gray-700">
                                               <AvatarImg src={comment.avatarUrl} name={comment.userName} className="w-full h-full object-cover" />
                                           </div>
                                           <div className={`flex flex-col max-w-[80%] ${comment.userId === currentUser.id ? 'items-end' : 'items-start'}`}>
                                               <div className={`px-4 py-2 rounded-2xl text-sm ${comment.userId === currentUser.id ? 'bg-rastha-primary text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-none shadow-sm'}`}>
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
                           
                           {/* Sent flash */}
                           {sentFlash && (
                               <div className="mx-4 mb-2 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs font-semibold py-1.5 rounded-xl animate-fade-in">
                                   <CheckCircle2 size={14} /> Comment posted!
                               </div>
                           )}

                           {/* Comment Input */}
                           <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 sticky bottom-0">
                               <div className="flex gap-2">
                                   <input 
                                     type="text" 
                                     value={commentText}
                                     onChange={(e) => setCommentText(e.target.value)}
                                     placeholder="Type a message..."
                                     className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rastha-primary/50 text-gray-900 dark:text-white"
                                     onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
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