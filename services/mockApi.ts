// =============================================================================
// RASHTRA API CLIENT — PostgreSQL Edition
// All localStorage calls replaced with real HTTP calls to Flask backend
// =============================================================================

import { Complaint, ComplaintStatus, Severity, RoadType, ROAD_TYPE_PRIORITY_BONUS, computePriorityRank, severityFromScore, AdminLog, AdminStats, DepartmentType, User, Comment, TrafficPersonnel, Contractor, Announcement, AnnouncementTarget, AnnouncementType, UserRole, EscalationLevel, AppealRequest, AppealStatus } from '../types';
import { analyzePotholes } from './model1';
import { analyzeGeneralDamage } from './model2';
import { resolveLocationFromGPS } from './locationService';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'https://backend-production-4466e.up.railway.app/api';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- COMMON HEADERS ---
const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

// --- HTTP HELPERS ---
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: JSON_HEADERS,
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json();
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: JSON_HEADERS,
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

// --- DATE REHYDRATION ---
// Backend sends ISO strings; frontend expects Date objects
function rehydrateComplaint(c: any): Complaint {
  return {
    ...c,
    timestamp: c.timestamp ? new Date(c.timestamp) : new Date(),
    contractorAssignedDate: c.contractorAssignedDate ? new Date(c.contractorAssignedDate) : undefined,
    repairedDate: c.repairedDate ? new Date(c.repairedDate) : undefined,
    slaDeadline: c.slaDeadline ? new Date(c.slaDeadline) : undefined,
    escalationLevel: c.escalationLevel || EscalationLevel.NONE,
    escalationHistory: (c.escalationHistory || []).map((e: any) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    })),
    comments: (c.comments || []).map((cmt: any) => ({
      ...cmt,
      timestamp: new Date(cmt.timestamp),
    })),
    deletedAt: c.deletedAt ? new Date(c.deletedAt) : undefined,
    communityReportCount: c.communityReportCount ?? 0,
    hasReported: c.hasReported ?? false,
    reportStats: c.reportStats ?? { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 },
  };
}

function rehydrateAppeal(a: any): AppealRequest {
  return {
    ...a,
    createdAt: new Date(a.createdAt),
    reviewedAt: a.reviewedAt ? new Date(a.reviewedAt) : undefined,
  };
}

function rehydrateAnnouncement(a: any): Announcement {
  return { ...a, timestamp: new Date(a.timestamp) };
}

function rehydrateLog(l: any): AdminLog {
  return { ...l, timestamp: new Date(l.timestamp) };
}

// =============================================================================
// API SERVICE CLASS
// Same public interface as MockApiService — drop-in replacement
// =============================================================================

class ApiService {

  // ============================================================
  // ENGINE 1: AI AUTO-ROUTING (kept in-client for offline use)
  // ============================================================
  autoRouteDepartment(description: string, aiLabel: string): {
    department: DepartmentType;
    confidence: number;
    keywords: string[];
  } {
    const text = `${description} ${aiLabel}`.toLowerCase();
    const rules: { dept: DepartmentType; keywords: string[]; weight: number }[] = [
      { dept: 'Water',       keywords: ['water','leak','pipe','burst','flood','drain','sewage','drainage','overflow','puddle','waterlogging','manhole','sewer'], weight: 1.4 },
      { dept: 'Traffic',     keywords: ['signal','traffic','light','sign','marking','divider','hazard','accident','junction','crossing','speed breaker','barrier'], weight: 1.3 },
      { dept: 'Ward',        keywords: ['garbage','waste','trash','debris','litter','dumping','stray','encroach','footpath','tree','fallen'], weight: 1.2 },
      { dept: 'Engineering', keywords: ['pothole','road','crack','surface','asphalt','tar','repair','construction','bridge','flyover','pavement','concrete','damage','broken'], weight: 1.0 },
    ];
    let bestDept: DepartmentType = 'Engineering', bestScore = 0, bestKeywords: string[] = [];
    for (const rule of rules) {
      const matched = rule.keywords.filter(kw => text.includes(kw));
      const score = matched.length * rule.weight;
      if (score > bestScore) { bestScore = score; bestDept = rule.dept; bestKeywords = matched; }
    }
    const confidence = bestKeywords.length === 0 ? 0.55 : Math.min(0.98, 0.60 + bestKeywords.length * 0.08);
    return { department: bestDept, confidence, keywords: bestKeywords };
  }

  // ============================================================
  // ENGINE 2: SLA CALCULATOR
  // ============================================================
  getSLAHours(severity: Severity, department: DepartmentType): number {
    const base: Record<Severity, number> = { [Severity.HIGH]: 24, [Severity.MEDIUM]: 48, [Severity.LOW]: 72 };
    if (department === 'Traffic') return Math.min(base[severity], 12);
    if (department === 'Water' && severity === Severity.HIGH) return 18;
    return base[severity];
  }

  // ============================================================
  // ENGINE 3: ESCALATION CHECKER
  // ============================================================
  checkAndEscalate(complaint: Complaint): Complaint {
    if (!complaint.slaDeadline) return complaint;
    if (complaint.status === ComplaintStatus.ASSIGNED || complaint.status === ComplaintStatus.REPAIRED) return complaint;
    const now = new Date();
    const slaHours = complaint.slaHours || 48;
    const ageHours = (now.getTime() - new Date(complaint.timestamp).getTime()) / (1000 * 60 * 60);
    const currentLevel = complaint.escalationLevel || EscalationLevel.NONE;
    let newLevel = currentLevel, reason = '';
    if (ageHours > slaHours && currentLevel === EscalationLevel.NONE) { newLevel = EscalationLevel.DEPT_HEAD; reason = `SLA of ${slaHours}h breached`; }
    if (ageHours > slaHours * 2 && currentLevel === EscalationLevel.DEPT_HEAD) { newLevel = EscalationLevel.COMMISSIONER; reason = `SLA breach exceeded 2×`; }
    if (ageHours > slaHours * 4 && currentLevel === EscalationLevel.COMMISSIONER) { newLevel = EscalationLevel.STATE; reason = `Critical delay`; }
    if (newLevel !== currentLevel) {
      complaint.escalationLevel = newLevel;
      complaint.escalationHistory = [...(complaint.escalationHistory || []), { level: newLevel, timestamp: now, reason }];
    }
    return complaint;
  }

  // ============================================================
  // COMPLAINTS
  // ============================================================
  async getComplaints(): Promise<Complaint[]> {
    const data = await get<any[]>('/complaints');
    return data.map(rehydrateComplaint).map(c => this.checkAndEscalate(c));
  }

  async getDeptComplaints(dept: string): Promise<Complaint[]> {
    const data = await get<any[]>(`/complaints?dept=${encodeURIComponent(dept)}&role=DEPT`);
    return data.map(rehydrateComplaint).map(c => this.checkAndEscalate(c));
  }

  async getComplaintById(id: string): Promise<Complaint> {
    const data = await get<any>(`/complaints/${id}`);
    return this.checkAndEscalate(rehydrateComplaint(data));
  }

  async getContractorComplaints(contractorId: string): Promise<Complaint[]> {
    const data = await get<any[]>(`/complaints?contractorId=${encodeURIComponent(contractorId)}`);
    return data.map(rehydrateComplaint).map(c => this.checkAndEscalate(c));
  }

  async getAdminComplaints(): Promise<Complaint[]> {
    const data = await get<any[]>('/complaints?role=ADMIN');
    return data.map(rehydrateComplaint).map(c => this.checkAndEscalate(c));
  }

  async getMessages(channel: string): Promise<any[]> {
    return await get<any[]>(`/messages?channel=${encodeURIComponent(channel)}`);
  }

  async sendMessage(payload: { channel: string; senderId: string; senderName: string; senderDept: string; text: string }): Promise<any> {
    return await post('/messages', payload);
  }

  async getMessageChannels(dept: string): Promise<string[]> {
    return await get<string[]>(`/messages/channels?dept=${encodeURIComponent(dept)}`);
  }

  async getUserComplaints(userId: string): Promise<Complaint[]> {
    const data = await get<any[]>(`/complaints?userId=${userId}`);
    return data.map(rehydrateComplaint).map(c => this.checkAndEscalate(c));
  }

  async updateComplaintStatus(id: string, status: ComplaintStatus): Promise<void> {
    await patch(`/complaints/${id}/status`, { status });
  }

  async assignComplaint(id: string, department: DepartmentType, forceReassign = false): Promise<{ conflict?: boolean; currentDept?: string }> {
    const res = await fetch(`${BASE_URL}/complaints/${id}/assign`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({ department, forceReassign }),
    });
    if (res.status === 409) {
      const data = await res.json();
      if (data.requiresConfirmation) return { conflict: true, currentDept: data.currentDept };
      throw new Error(data.error || 'Assignment conflict');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Assign failed' }));
      throw new Error(err.error || 'Assign failed');
    }
    return {};
  }

  async toggleConcern(complaintId: string, currentlyRaised: boolean): Promise<Complaint> {
    const action = currentlyRaised ? 'remove' : 'add';
    const data = await post<any>(`/complaints/${complaintId}/concern`, { action });
    return rehydrateComplaint(data);
  }

  async toggleCommunityReport(complaintId: string): Promise<void> {
    await post(`/complaints/${complaintId}/community-report`, {});
  }

  async flagComplaint(complaintId: string, reason: 'Duplicate' | 'Fake' | 'Fixed' | 'Location'): Promise<void> {
    await post(`/complaints/${complaintId}/flag`, { reason });
  }

  async addComment(complaintId: string, text: string, user: User): Promise<Comment> {
    const data = await post<any>(`/complaints/${complaintId}/comments`, {
      userId: user.id, userName: user.name, text, avatarUrl: user.avatarUrl,
    });
    return { ...data, timestamp: new Date(data.timestamp) };
  }

  async setTrafficAlert(id: string, isAlert: boolean): Promise<void> {
    await patch(`/complaints/${id}/traffic-alert`, { alert: isAlert });
  }

  async deleteComplaint(id: string, actor: { actorId: string; actorName: string; actorRole: string; reason?: string }): Promise<void> {
    const res = await fetch(`${BASE_URL}/complaints/${id}`, {
      method: 'DELETE',
      headers: JSON_HEADERS,
      body: JSON.stringify(actor),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Delete failed' }));
      throw new Error(err.error || 'Delete failed');
    }
  }

  async restoreComplaint(id: string, actor: { actorId: string; actorRole: string }): Promise<Complaint> {
    const data = await post<any>(`/complaints/${id}/restore`, actor);
    return rehydrateComplaint(data.complaint);
  }

  async getDeletedComplaints(): Promise<Complaint[]> {
    const data = await get<any[]>('/audit/deleted-complaints');
    return data.map(rehydrateComplaint);
  }

  // ============================================================
  // APPEALS
  // ============================================================
  async createAppeal(complaintId: string, fromDept: string, reason: string): Promise<AppealRequest> {
    const data = await post<any>('/appeals', { complaintId, fromDept, reason });
    return rehydrateAppeal(data);
  }

  async getAppeals(status?: string, dept?: string): Promise<AppealRequest[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (dept) params.append('dept', dept);
    const data = await get<any[]>(`/appeals${params.toString() ? '?' + params : ''}`);
    return data.map(rehydrateAppeal);
  }

  async reviewAppeal(appealId: string, decision: 'APPROVED' | 'REJECTED', assignTo?: string, reviewedBy?: string, reviewerRole = 'ADMIN'): Promise<AppealRequest> {
    const data = await post<any>(`/appeals/${appealId}/review`, { decision, assignTo, reviewedBy, reviewerRole });
    return rehydrateAppeal(data);
  }

  // ============================================================
  // TRAFFIC PERSONNEL
  // ============================================================
  async getTrafficPersonnel(): Promise<TrafficPersonnel[]> {
    return get<TrafficPersonnel[]>('/traffic-personnel');
  }

  async getConstables(): Promise<TrafficPersonnel[]> {
    return this.getTrafficPersonnel();
  }

  async assignConstable(complaintId: string, constableId: string): Promise<void> {
    await post(`/complaints/${complaintId}/assign-constable`, { constableId });
  }

  // ============================================================
  // CONTRACTORS
  // ============================================================
  async getContractors(): Promise<Contractor[]> {
    return get<Contractor[]>('/contractors');
  }

  async assignContractor(complaintId: string, contractorId: string): Promise<void> {
    await post(`/complaints/${complaintId}/assign-contractor`, { contractorId });
  }

  async completeWorkOrder(id: string, evidenceImage: File): Promise<void> {
    let evidenceUrl: string;
    // Upload evidence to MinIO; fall back to a local blob URL if MinIO is unavailable
    try {
      const formData = new FormData();
      formData.append('file', evidenceImage);
      formData.append('folder', 'evidence');
      const uploadRes = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Evidence upload failed');
      const uploadData = await uploadRes.json();
      evidenceUrl = uploadData.url;
    } catch {
      const reader = new FileReader();
      evidenceUrl = await new Promise<string>((res) => {
        reader.onloadend = () => res(reader.result as string);
        reader.readAsDataURL(evidenceImage);
      });
      console.warn('R2 unavailable for evidence upload — using base64 fallback');
    }
    await post(`/complaints/${id}/complete-work`, { evidenceUrl });
  }

  async getComplaintById(id: string): Promise<Complaint> {
    const data = await get<any>(`/complaints/${id}`);
    return rehydrateComplaint(this.checkAndEscalate(data));
  }

  async verifyRepair(id: string): Promise<void> {
    await post(`/complaints/${id}/verify-repair`, {});
  }

  async rejectRepair(id: string, reason: string, newContractorId?: string): Promise<void> {
    await post(`/complaints/${id}/reject-repair`, { reason, newContractorId });
  }

  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================
  async getAnnouncements(role: UserRole): Promise<Announcement[]> {
    const data = await get<any[]>(`/announcements?role=${role}`);
    return data.map(rehydrateAnnouncement);
  }

  async createAnnouncement(message: string, type: AnnouncementType, target: AnnouncementTarget): Promise<Announcement> {
    const data = await post<any>('/announcements', { message, type, target });
    return rehydrateAnnouncement(data);
  }

  async deactivateAnnouncement(id: string): Promise<void> {
    await patch(`/announcements/${id}/deactivate`, {});
  }

  async getActiveAnnouncementsForAdmin(): Promise<Announcement[]> {
    const data = await get<any[]>('/announcements?role=ADMIN');
    return data.map(rehydrateAnnouncement);
  }

  // ============================================================
  // ADMIN LOGS & STATS
  // ============================================================
  async logAdminActivity(type: string, details?: string): Promise<void> {
    await post('/admin/log', { type, details });
  }

  async getAdminStats(): Promise<AdminStats> {
    const data = await get<any>('/admin/stats');
    return {
      ...data,
      logs: data.logs.map(rehydrateLog),
    };
  }

  // ============================================================
  // REPORTS & EXPORT
  // ============================================================
  async downloadMonthlyReport(month?: string): Promise<void> {
    const param = month ? `?month=${month}` : '';
    const res = await fetch(`${BASE_URL}/reports/monthly${param}`, {
      headers: JSON_HEADERS,
    });
    if (!res.ok) throw new Error('Failed to generate report');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rashtra_monthly_report_${month || new Date().toISOString().slice(0,7)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async downloadAuditExport(): Promise<void> {
    const res = await fetch(`${BASE_URL}/reports/audit-export`, {
      headers: JSON_HEADERS,
    });
    if (!res.ok) throw new Error('Failed to generate audit export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0,19);
    a.download = `rashtra_audit_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // AI PIPELINE — analyzeAndReport
  // Frontend runs AI inference, then POSTs result to DB
  // ============================================================
  async analyzeAndReport(
    image: File,
    location: { lat: number, lng: number } | null,
    manualAddress: string,
    userId: string,
    userInput: { description: string, department: string },
    onStatusUpdate?: (status: string) => void
  ): Promise<Complaint> {
    console.log("--- STARTING BACKEND ANALYSIS CHAIN ---");
    onStatusUpdate?.("Uploading your evidence securely...");

    onStatusUpdate?.("Preparing your complaint...");

    let address = manualAddress;
    let finalLat = location?.lat || 0;
    let finalLng = location?.lng || 0;

    // Resolve address AND road classification in a single OSM call
    let roadType = RoadType.STREET;
    let roadTypeSource: 'osm' | 'fallback' = 'fallback';

    if (!address && location) {
      try {
        const locationInfo = await resolveLocationFromGPS(location.lat, location.lng);
        address = locationInfo.fullAddress;
        roadType = locationInfo.roadType;
        roadTypeSource = locationInfo.roadTypeSource;
      } catch {
        address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} (GPS Detected)`;
      }
    } else if (!address) {
      address = "Unknown Location";
    }

    if (finalLat === 0 && finalLng === 0) {
      finalLat = 17.6599 + (Math.random() - 0.5) * 0.08;
      finalLng = 75.9064 + (Math.random() - 0.5) * 0.08;
    }

    onStatusUpdate?.("Running damage assessment...");
    const potholeResult = await analyzePotholes(image);

    let status = ComplaintStatus.WAITING_LIST;
    let severity = Severity.LOW;
    let severityScore = 0;
    let priorityRank = 0;
    let description = userInput.description || "";
    let aiLabel = "";

    if (potholeResult.detected) {
      onStatusUpdate?.("Damage confirmed. Assessing severity...");
      status = ComplaintStatus.AUTO_VERIFIED;
      aiLabel = potholeResult.label;
      if (!description) description = potholeResult.label;
      // Score is pure confidence — road type never inflates it
      severityScore = potholeResult.severityScore;
      severity = severityFromScore(severityScore);
      // Priority rank is the internal queue sort key — adds road bonus on top
      priorityRank = computePriorityRank(severityScore, roadType);
    } else {
      onStatusUpdate?.("Performing secondary analysis...");
      const damageResult = await analyzeGeneralDamage(image);
      if (damageResult.detected) {
        onStatusUpdate?.("Issue identified. Processing report...");
        status = ComplaintStatus.AUTO_VERIFIED;
        aiLabel = damageResult.label;
        if (!description) description = damageResult.label;
        severityScore = damageResult.severityScore;
        severity = severityFromScore(severityScore);
        priorityRank = computePriorityRank(severityScore, roadType);
      } else {
        onStatusUpdate?.("Queued for departmental review...");
        status = ComplaintStatus.WAITING_LIST;
        severity = Severity.LOW;
        severityScore = 0.5;
        priorityRank = computePriorityRank(severityScore, roadType);
        if (!description) description = "No clear damage detected. Pending manual review.";
      }
    }

    console.log(`[Severity] Road: ${roadType}, Score: ${severityScore}/10, PriorityRank: ${priorityRank}, Severity: ${severity}`);

    onStatusUpdate?.("Storing evidence in secure storage...");

    // Upload complaint image to MinIO — permanent URL
    const imgForm = new FormData();
    imgForm.append('file', image);
    imgForm.append('folder', 'complaints');
    let imageUrl: string;
    try {
      const uploadRes = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        body: imgForm,
      });
      if (!uploadRes.ok) throw new Error('upload failed');
      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;
    } catch {
      const reader = new FileReader();
      imageUrl = await new Promise<string>((res) => {
        reader.onloadend = () => res(reader.result as string);
        reader.readAsDataURL(image);
      });
      console.warn('MinIO unavailable, falling back to base64');
    }

    onStatusUpdate?.("Finalising your report...");

    const complaintId = `TKN-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      id: complaintId,
      userId,
      imageUrl,
      latitude: finalLat,
      longitude: finalLng,
      status,
      severity,
      severityScore,
      priorityRank,
      description,
      address,
      aiLabel,
      roadType,
    };

    const data = await post<any>('/complaints/submit', payload);
    return rehydrateComplaint(data);
  }

  // ============================================================
  // USERS — create/upsert on login, fetch, update
  // ============================================================
  async createUser(user: { id: string; name: string; email: string; role?: string; avatarUrl?: string; phoneNumber?: string; address?: string }): Promise<User> {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(user),
    });
    // 201 = created, 200 = already existed — both are fine
    if (!res.ok) throw new Error(`createUser failed: ${res.status}`);
    return res.json();
  }

  async getUser(userId: string): Promise<User> {
    return get<User>(`/users/${userId}`);
  }

  async updateUser(userId: string, fields: { name?: string; phone?: string; address?: string; avatarUrl?: string }): Promise<User> {
    return patch<User>(`/users/${userId}`, fields);
  }

  async uploadAvatar(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'avatars');
    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    const data = await res.json();
    return data.url as string;
  }
}

export const api = new ApiService();