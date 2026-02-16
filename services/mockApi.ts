import { INITIAL_COMPLAINTS } from '../constants';
import { Complaint, ComplaintStatus, Severity, AdminLog, AdminActivityType, AdminStats, DepartmentType, User, Comment, TrafficPersonnel, Contractor, Announcement, AnnouncementTarget, AnnouncementType, UserRole } from '../types';
import { analyzePotholes } from './model1';
import { analyzeGeneralDamage } from './model2';

// Simulated latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_TRAFFIC_PERSONNEL: TrafficPersonnel[] = [
    { id: 'TP-001', name: 'Rajesh Deshmukh', rank: 'Inspector', badgeNumber: 'MH-13-101', phone: '+91 98900 11111', status: 'Available', currentLocation: 'Control Room HQ', lastActive: '2 mins ago' },
    { id: 'TP-002', name: 'Suresh Patil', rank: 'Constable', badgeNumber: 'MH-13-442', phone: '+91 98900 22222', status: 'Busy', currentLocation: 'Saat Rasta Junction', lastActive: 'Just now' },
    { id: 'TP-003', name: 'Amit Shinde', rank: 'Constable', badgeNumber: 'MH-13-550', phone: '+91 98900 33333', status: 'Available', currentLocation: 'Ashok Chowk', lastActive: '5 mins ago' },
    { id: 'TP-004', name: 'Vijay Kulkarni', rank: 'Traffic Warden (Volunteer)', badgeNumber: 'VOL-088', phone: '+91 98900 44444', status: 'Busy', currentLocation: 'Siddheshwar Temple', lastActive: '10 mins ago' },
    { id: 'TP-005', name: 'Priya Pawar', rank: 'Sub-Inspector', badgeNumber: 'MH-13-202', phone: '+91 98900 55555', status: 'Off Duty', currentLocation: 'Home', lastActive: '4 hours ago' },
    { id: 'TP-006', name: 'Rahul Jadhav', rank: 'Traffic Warden (Volunteer)', badgeNumber: 'VOL-092', phone: '+91 98900 66666', status: 'Available', currentLocation: 'Market Yard', lastActive: '1 min ago' },
    { id: 'TP-007', name: 'Anil Kale', rank: 'Constable', badgeNumber: 'MH-13-610', phone: '+91 98900 77777', status: 'Busy', currentLocation: 'Hotgi Road', lastActive: 'Just now' },
    { id: 'TP-008', name: 'Sunita Mane', rank: 'Constable', badgeNumber: 'MH-13-615', phone: '+91 98900 88888', status: 'Available', currentLocation: 'VIP Road', lastActive: '15 mins ago' }
];

const MOCK_CONTRACTORS: Contractor[] = [
    // ENGINEERING (Roads)
    { id: "C-101", name: "Rajesh Kumar", company: "BuildWell Infra", specialization: "Road Resurfacing", rating: 4.8, activeProjects: 3, completedProjects: 142, contact: "+91 98220 12345", status: 'Verified', history: [] },
    { id: "C-102", name: "Amit Deshmukh", company: "CityFix Solutions", specialization: "Civil Works", rating: 4.2, activeProjects: 1, completedProjects: 89, contact: "+91 94235 67890", status: 'Verified', history: [] },
    { id: "C-105", name: "Anjali Mehta", company: "Anjali Constructions", specialization: "Pavement & Walkways", rating: 4.6, activeProjects: 2, completedProjects: 110, contact: "+91 99887 77665", status: 'Verified', history: [] },
    { id: "C-106", name: "Kabir Khan", company: "Solapur Roadways", specialization: "Heavy Road Works", rating: 4.9, activeProjects: 4, completedProjects: 520, contact: "+91 98765 00001", status: 'Verified', history: [] },
    { id: "C-111", name: "Vikram Construction", company: "Vikram Roads", specialization: "Pothole Patching", rating: 4.1, activeProjects: 6, completedProjects: 200, contact: "+91 91122 33445", status: 'Verified', history: [] },
    
    // WARD (Sanitation/Debris)
    { id: "C-103", name: "Suresh Patil", company: "Green Earth Sanitation", specialization: "Debris Removal", rating: 4.9, activeProjects: 5, completedProjects: 310, contact: "+91 88888 55555", status: 'Verified', history: [] },
    { id: "C-112", name: "CleanCity Group", company: "CleanCity Services", specialization: "Waste Management", rating: 4.5, activeProjects: 2, completedProjects: 85, contact: "+91 88000 99000", status: 'Verified', history: [] },
    { id: "C-113", name: "Urban Greenery", company: "Urban Greenery Ltd", specialization: "Tree Cutting & Cleaning", rating: 4.7, activeProjects: 1, completedProjects: 120, contact: "+91 88776 65544", status: 'Verified', history: [] },
    
    // WATER (Drainage/Pipeline)
    { id: "C-110", name: "Ramesh Pawar", company: "AquaPure Networks", specialization: "Water & Drainage", rating: 4.3, activeProjects: 3, completedProjects: 150, contact: "+91 99223 34455", status: 'Verified', history: [] },
    { id: "C-114", name: "PipeMasters", company: "PipeMasters Ltd", specialization: "Pipeline Repair", rating: 4.8, activeProjects: 4, completedProjects: 300, contact: "+91 99881 12233", status: 'Verified', history: [] },
    { id: "C-115", name: "FlowTech", company: "FlowTech Solutions", specialization: "Sewage Treatment", rating: 4.6, activeProjects: 2, completedProjects: 95, contact: "+91 99555 44333", status: 'Verified', history: [] },
    { id: "C-116", name: "HydroFix", company: "HydroFix Engineers", specialization: "Leakage Repair", rating: 4.2, activeProjects: 1, completedProjects: 45, contact: "+91 99111 22233", status: 'Probation', history: [] },

    // OTHER
    { id: "C-104", name: "Vijay Singh", company: "Bright Spark Electricals", specialization: "Street Lights", rating: 3.5, activeProjects: 0, completedProjects: 45, contact: "+91 77777 22222", status: 'Probation', history: [] },
];

class MockApiService {
  private complaints: Complaint[] = [];
  private adminLogs: AdminLog[] = [];
  private contractors: Contractor[] = [];
  private announcements: Announcement[] = [];

  constructor() {
    this.contractors = [...MOCK_CONTRACTORS];
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('rashtra_complaints_v2'); // New key to reset data
      if (stored) {
        const parsed = JSON.parse(stored, (key, value) => {
            if (key === 'timestamp' || key === 'contractorAssignedDate' || key === 'repairedDate') return new Date(value);
            return value;
        });
        // Backfill new fields for existing data
        this.complaints = parsed.map((c: any) => ({
            ...c,
            departments: c.departments || ['Engineering'],
            concernCount: c.concernCount || 0,
            hasRaisedConcern: c.hasRaisedConcern || false,
            reportStats: c.reportStats || { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 },
            trafficAlert: c.trafficAlert || false,
            assignedConstable: c.assignedConstable || undefined,
            assignedContractorId: c.assignedContractorId || undefined,
            contractorAssignedDate: c.contractorAssignedDate ? new Date(c.contractorAssignedDate) : undefined,
            repairEvidenceUrl: c.repairEvidenceUrl || undefined,
            repairedDate: c.repairedDate ? new Date(c.repairedDate) : undefined,
            comments: (c.comments || []).map((cmt: any) => ({
              ...cmt,
              timestamp: new Date(cmt.timestamp)
            }))
        }));
      } else {
        this.complaints = [...INITIAL_COMPLAINTS];
      }
      
      const storedLogs = localStorage.getItem('rashtra_logs_v2');
      if (storedLogs) {
          this.adminLogs = JSON.parse(storedLogs, (key, value) => {
            if (key === 'timestamp') return new Date(value);
            return value;
        });
      }

      const storedAnnouncements = localStorage.getItem('rashtra_announcements_v2');
      if (storedAnnouncements) {
          this.announcements = JSON.parse(storedAnnouncements, (key, value) => {
              if (key === 'timestamp') return new Date(value);
              return value;
          });
      } else {
          // Default welcome announcement
          this.announcements = [{
              id: 'ann-init',
              message: 'Welcome to the new Rashtra Digital Portal. Report responsibly.',
              type: 'INFO',
              target: 'ALL',
              timestamp: new Date(),
              active: true,
              createdBy: 'System'
          }];
      }

    } catch (e) {
      console.error("Failed to load from storage", e);
      this.complaints = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('rashtra_complaints_v2', JSON.stringify(this.complaints));
      localStorage.setItem('rashtra_logs_v2', JSON.stringify(this.adminLogs));
      localStorage.setItem('rashtra_announcements_v2', JSON.stringify(this.announcements));
    } catch (e) {
      console.error("Failed to save to storage", e);
    }
  }

  private deepCopy<T>(data: T): T {
    return JSON.parse(JSON.stringify(data), (key, value) => {
        if (key === 'timestamp' || key === 'contractorAssignedDate' || key === 'repairedDate') return new Date(value);
        return value;
    });
  }

  async getComplaints(): Promise<Complaint[]> {
    await delay(800);
    return this.deepCopy(this.complaints);
  }

  async getUserComplaints(userId: string): Promise<Complaint[]> {
    await delay(500);
    return this.deepCopy(this.complaints.filter(c => c.userId === userId));
  }

  async toggleConcern(complaintId: string): Promise<Complaint> {
      await delay(100);
      const index = this.complaints.findIndex(c => c.id === complaintId);
      if (index === -1) throw new Error("Complaint not found");

      const complaint = this.complaints[index];
      
      if (complaint.hasRaisedConcern) {
          complaint.concernCount = Math.max(0, complaint.concernCount - 1);
          complaint.hasRaisedConcern = false;
      } else {
          complaint.concernCount += 1;
          complaint.hasRaisedConcern = true;
      }

      this.saveToStorage();
      return this.deepCopy(complaint);
  }

  async flagComplaint(complaintId: string, reason: 'Duplicate' | 'Fake' | 'Fixed' | 'Location'): Promise<void> {
    await delay(300);
    const index = this.complaints.findIndex(c => c.id === complaintId);
    if (index === -1) throw new Error("Complaint not found");
    
    const complaint = this.complaints[index];
    
    if (!complaint.reportStats) {
        complaint.reportStats = { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 };
    }

    switch (reason) {
        case 'Duplicate': complaint.reportStats.duplicate += 1; break;
        case 'Fake': complaint.reportStats.fake += 1; break;
        case 'Fixed': complaint.reportStats.fixed += 1; break;
        case 'Location': complaint.reportStats.wrongLocation += 1; break;
    }

    this.saveToStorage();
  }

  async addComment(complaintId: string, text: string, user: User): Promise<Comment> {
    await delay(400);
    const index = this.complaints.findIndex(c => c.id === complaintId);
    if (index === -1) throw new Error("Complaint not found");

    const newComment: Comment = {
      id: `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`, 
      userId: user.id,
      userName: user.name,
      text: text,
      timestamp: new Date(),
      avatarUrl: user.avatarUrl
    };

    if (!this.complaints[index].comments) {
      this.complaints[index].comments = [];
    }
    
    this.complaints[index].comments.push(newComment);
    this.saveToStorage();
    return this.deepCopy(newComment);
  }

  // --- TRAFFIC DEPT METHODS ---
  async getTrafficPersonnel(): Promise<TrafficPersonnel[]> {
      await delay(600);
      return this.deepCopy(MOCK_TRAFFIC_PERSONNEL);
  }

  async getConstables(): Promise<TrafficPersonnel[]> {
      return this.getTrafficPersonnel();
  }

  async assignConstable(complaintId: string, constableId: string): Promise<void> {
      await delay(400);
      const index = this.complaints.findIndex(c => c.id === complaintId);
      if (index === -1) throw new Error("Complaint not found");
      
      const constable = MOCK_TRAFFIC_PERSONNEL.find(p => p.id === constableId);
      if (!constable) throw new Error("Constable not found");

      this.complaints[index].assignedConstable = constable;
      this.complaints[index].trafficAlert = true; 
      this.saveToStorage();
  }

  // --- CONTRACTOR METHODS ---
  async getContractors(): Promise<Contractor[]> {
      await delay(500);
      return this.deepCopy(this.contractors);
  }

  async assignContractor(complaintId: string, contractorId: string): Promise<void> {
      await delay(400);
      const index = this.complaints.findIndex(c => c.id === complaintId);
      if (index === -1) throw new Error("Complaint not found");

      const contractorIndex = this.contractors.findIndex(c => c.id === contractorId);
      if (contractorIndex === -1) throw new Error("Contractor not found");

      // Update Complaint
      this.complaints[index].status = ComplaintStatus.ASSIGNED;
      this.complaints[index].assignedContractorId = contractorId;
      this.complaints[index].contractorAssignedDate = new Date();

      // Update Contractor Stats
      this.contractors[contractorIndex].activeProjects += 1;
      this.contractors[contractorIndex].history.unshift({
          id: complaintId,
          location: this.complaints[index].address,
          description: this.complaints[index].description || "Assigned Work",
          date: new Date().toISOString().split('T')[0],
          status: 'In Progress'
      });

      this.saveToStorage();
  }

  async completeWorkOrder(id: string, evidenceImage: File): Promise<void> {
      await delay(1000); // Simulate upload time
      const index = this.complaints.findIndex(c => c.id === id);
      if (index === -1) throw new Error("Complaint not found");

      // In a real app, upload image to storage and get URL. Here we mock it.
      const evidenceUrl = URL.createObjectURL(evidenceImage);

      this.complaints[index].status = ComplaintStatus.REPAIRED;
      this.complaints[index].repairedDate = new Date();
      this.complaints[index].repairEvidenceUrl = evidenceUrl;

      // Update contractor stats if applicable
      const contractorId = this.complaints[index].assignedContractorId;
      if (contractorId) {
          const cIndex = this.contractors.findIndex(c => c.id === contractorId);
          if (cIndex !== -1) {
              this.contractors[cIndex].activeProjects = Math.max(0, this.contractors[cIndex].activeProjects - 1);
              this.contractors[cIndex].completedProjects += 1;
              
              // Update history status
              const histIndex = this.contractors[cIndex].history.findIndex(h => h.id === id);
              if (histIndex !== -1) {
                  this.contractors[cIndex].history[histIndex].status = 'Completed';
              }
          }
      }

      this.saveToStorage();
      await this.logAdminActivity('WORK_COMPLETE', `Contractor completed work on ${id}`);
  }

  // --- ANNOUNCEMENT METHODS ---
  async getAnnouncements(role: UserRole): Promise<Announcement[]> {
      const isOfficial = role !== UserRole.USER;
      
      return this.announcements.filter(a => {
          if (!a.active) return false;
          if (role === UserRole.ADMIN) return true; // Admin sees all active to monitor
          
          if (a.target === 'ALL') return true;
          if (isOfficial && a.target === 'OFFICIALS') return true;
          if (!isOfficial && a.target === 'CITIZENS') return true;
          
          return false;
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createAnnouncement(message: string, type: AnnouncementType, target: AnnouncementTarget): Promise<Announcement> {
      await delay(300);
      const newAnnouncement: Announcement = {
          id: `ann-${Date.now()}`,
          message,
          type,
          target,
          timestamp: new Date(),
          active: true,
          createdBy: 'Admin'
      };
      this.announcements.unshift(newAnnouncement);
      this.saveToStorage();
      return this.deepCopy(newAnnouncement);
  }

  async deactivateAnnouncement(id: string): Promise<void> {
      await delay(200);
      const index = this.announcements.findIndex(a => a.id === id);
      if (index !== -1) {
          this.announcements[index].active = false;
          this.saveToStorage();
      }
  }

  async getActiveAnnouncementsForAdmin(): Promise<Announcement[]> {
      return this.deepCopy(this.announcements.filter(a => a.active));
  }

  // --- ADMIN LOGGING ---
  async logAdminActivity(type: AdminActivityType, details?: string): Promise<void> {
    const newLog: AdminLog = {
      id: `log-${Date.now()}`,
      type,
      timestamp: new Date(),
      details
    };
    this.adminLogs.unshift(newLog);
    this.saveToStorage();
    console.log(`[Admin Log] ${type}: ${details || ''}`);
  }

  async getAdminStats(): Promise<AdminStats> {
    await delay(600);
    const totalRepairOrders = this.adminLogs.filter(l => l.type === 'REPAIR_ORDER').length;
    const totalDeletedCases = this.adminLogs.filter(l => l.type === 'DELETE_CASE').length;
    
    return this.deepCopy({
      totalRepairOrders,
      totalDeletedCases,
      logs: [...this.adminLogs]
    });
  }

  // --- AI BACKEND PIPELINE ---
  async analyzeAndReport(
    image: File, 
    location: { lat: number, lng: number } | null, 
    manualAddress: string, 
    userId: string, 
    userInput: { description: string, department: string },
    onStatusUpdate?: (status: string) => void
  ): Promise<Complaint> {
    console.log("--- STARTING BACKEND ANALYSIS CHAIN ---");
    onStatusUpdate?.("Initializing Analysis Pipeline...");
    
    let address = manualAddress;
    let finalLat = location?.lat || 0;
    let finalLng = location?.lng || 0;

    if (!address && location) {
        address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} (GPS Detected)`;
    } else if (!address) {
        address = "Unknown Location";
    }

    if (finalLat === 0 && finalLng === 0) {
        finalLat = 17.6599 + (Math.random() - 0.5) * 0.08;
        finalLng = 75.9064 + (Math.random() - 0.5) * 0.08;
        console.log(`[Mock GeoCoding] Assigned coordinates for text address: ${finalLat}, ${finalLng}`);
    }

    onStatusUpdate?.("Scanning road surface for defects...");
    const potholeResult = await analyzePotholes(image);
    
    let status = ComplaintStatus.WAITING_LIST;
    let severity = Severity.LOW;
    let severityScore = 0;
    
    let description = userInput.description || "";

    if (potholeResult.detected) {
        onStatusUpdate?.("Pothole detected. Assessing severity...");
        status = ComplaintStatus.AUTO_VERIFIED;
        severity = potholeResult.severity;
        severityScore = potholeResult.severityScore;
        if (!description) description = potholeResult.label;
    } else {
        onStatusUpdate?.("Analyzing surface texture and integrity...");
        
        const damageResult = await analyzeGeneralDamage(image);

        if (damageResult.detected) {
            onStatusUpdate?.("Surface damage detected. Assessing severity...");
            status = ComplaintStatus.AUTO_VERIFIED;
            severity = damageResult.severity;
            severityScore = damageResult.severityScore;
            if (!description) description = damageResult.label;
        } else {
            onStatusUpdate?.("Analysis complete. Pending manual review.");
            status = ComplaintStatus.WAITING_LIST;
            severity = Severity.LOW;
            severityScore = 0.5;
            if (!description) description = "No clear damage detected by AI systems. Pending manual review.";
        }
    }

    const departments: DepartmentType[] = [];
    if (userInput.department) {
        departments.push(userInput.department as DepartmentType);
    } else {
        departments.push('Engineering'); 
    }

    const newComplaint: Complaint = {
      id: `TKN-${Math.floor(1000 + Math.random() * 9000)}`,
      userId,
      imageUrl: URL.createObjectURL(image),
      latitude: finalLat,
      longitude: finalLng,
      status,
      severity,
      severityScore,
      description,
      timestamp: new Date(), 
      address: address,
      departments: departments,
      comments: [],
      concernCount: 0,
      hasRaisedConcern: false,
      reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 },
      trafficAlert: false
    };

    this.complaints.unshift(newComplaint);
    this.saveToStorage();
    return this.deepCopy(newComplaint);
  }

  async updateComplaintStatus(id: string, status: ComplaintStatus): Promise<void> {
    await delay(500);
    const index = this.complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      this.complaints[index].status = status;
      this.saveToStorage();
    }
  }

  async assignComplaint(id: string, department: DepartmentType): Promise<void> {
    await delay(500);
    const index = this.complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      this.complaints[index].status = ComplaintStatus.ASSIGNED;
      this.complaints[index].departments = [department];
      this.saveToStorage();
    }
  }

  async setTrafficAlert(id: string, isAlert: boolean): Promise<void> {
    await delay(300);
    const index = this.complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      this.complaints[index].trafficAlert = isAlert;
      this.saveToStorage();
    }
  }

  async deleteComplaint(id: string): Promise<void> {
    await delay(500);
    this.complaints = this.complaints.filter(c => c.id !== id);
    this.saveToStorage();
  }
}

export const api = new MockApiService();