import { INITIAL_COMPLAINTS } from '../constants';
import { Complaint, ComplaintStatus, Severity, AdminLog, AdminActivityType, AdminStats, DepartmentType, User, Comment } from '../types';
import { analyzePotholes } from './model1';
import { analyzeGeneralDamage } from './model2';

// Simulated latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockApiService {
  private complaints: Complaint[] = [];
  private adminLogs: AdminLog[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('rashtra_complaints');
      if (stored) {
        const parsed = JSON.parse(stored, (key, value) => {
            if (key === 'timestamp') return new Date(value);
            return value;
        });
        // Backfill new fields for existing data
        this.complaints = parsed.map((c: any) => ({
            ...c,
            departments: c.departments || ['Engineering'],
            concernCount: c.concernCount || Math.floor(Math.random() * 20), // Random starting count for demo
            hasRaisedConcern: c.hasRaisedConcern || false,
            // Initialize reportStats if not present
            reportStats: c.reportStats || { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 },
            comments: (c.comments || []).map((cmt: any) => ({
              ...cmt,
              timestamp: new Date(cmt.timestamp) // Ensure comment timestamps are Dates
            }))
        }));
      } else {
        this.complaints = INITIAL_COMPLAINTS.map(c => ({
            ...c,
            concernCount: Math.floor(Math.random() * 10),
            hasRaisedConcern: false,
            reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 }
        }));
      }
      
      const storedLogs = localStorage.getItem('rashtra_logs');
      if (storedLogs) {
          this.adminLogs = JSON.parse(storedLogs, (key, value) => {
            if (key === 'timestamp') return new Date(value);
            return value;
        });
      }
    } catch (e) {
      console.error("Failed to load from storage", e);
      this.complaints = [...INITIAL_COMPLAINTS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('rashtra_complaints', JSON.stringify(this.complaints));
      localStorage.setItem('rashtra_logs', JSON.stringify(this.adminLogs));
    } catch (e) {
      console.error("Failed to save to storage", e);
    }
  }

  // Helper to simulate network serialization/deserialization preventing reference sharing
  private deepCopy<T>(data: T): T {
    return JSON.parse(JSON.stringify(data), (key, value) => {
        if (key === 'timestamp') return new Date(value);
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
      // Very short delay for like/toggle interactions to feel responsive
      await delay(100);
      const index = this.complaints.findIndex(c => c.id === complaintId);
      if (index === -1) throw new Error("Complaint not found");

      const complaint = this.complaints[index];
      
      // Toggle logic
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
    
    // Ensure object exists
    if (!complaint.reportStats) {
        complaint.reportStats = { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 };
    }

    // Increment specific counter
    switch (reason) {
        case 'Duplicate':
            complaint.reportStats.duplicate += 1;
            break;
        case 'Fake':
            complaint.reportStats.fake += 1;
            break;
        case 'Fixed':
            complaint.reportStats.fixed += 1;
            break;
        case 'Location':
            complaint.reportStats.wrongLocation += 1;
            break;
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
    // Return a copy to ensure no reference leaks
    return this.deepCopy(newComment);
  }

  // --- ADMIN LOGGING ---
  async logAdminActivity(type: AdminActivityType, details?: string): Promise<void> {
    const newLog: AdminLog = {
      id: `log-${Date.now()}`,
      type,
      timestamp: new Date(),
      details
    };
    this.adminLogs.unshift(newLog); // Add to beginning
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
    userInput: { description: string, department: string }, // Updated signature
    onStatusUpdate?: (status: string) => void
  ): Promise<Complaint> {
    console.log("--- STARTING BACKEND ANALYSIS CHAIN ---");
    onStatusUpdate?.("Initializing Analysis Pipeline...");
    
    // 1. Determine Address Strategy
    let address = manualAddress;
    let finalLat = location?.lat || 0;
    let finalLng = location?.lng || 0;

    if (!address && location) {
        // Mock reverse geocode for GPS
        address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} (GPS Detected)`;
    } else if (!address) {
        address = "Unknown Location";
    }

    // 2. AUTO-GEOCODING MOCK (Updated to Solapur Coordinates)
    if (finalLat === 0 && finalLng === 0) {
        // Solapur Center approx: 17.6599, 75.9064
        finalLat = 17.6599 + (Math.random() - 0.5) * 0.08;
        finalLng = 75.9064 + (Math.random() - 0.5) * 0.08;
        console.log(`[Mock GeoCoding] Assigned coordinates for text address: ${finalLat}, ${finalLng}`);
    }

    // 3. Run Model 1 (Pothole Expert)
    onStatusUpdate?.("Running Model 1 (Pothole Expert)...");
    const potholeResult = await analyzePotholes(image);
    
    let status = ComplaintStatus.WAITING_LIST;
    let severity = Severity.LOW;
    let severityScore = 0;
    
    // Use user description if provided, otherwise fallback to AI logic later
    let description = userInput.description || "";

    if (potholeResult.detected) {
        // CASE A: Model 1 Success
        onStatusUpdate?.("Model 1 Verified: Pothole Detected!");
        status = ComplaintStatus.AUTO_VERIFIED;
        severity = potholeResult.severity;
        severityScore = potholeResult.severityScore;
        // Append AI finding if user didn't be specific
        if (!description) description = potholeResult.label;
    } else {
        // CASE B: Model 1 Failed -> Try Model 2
        onStatusUpdate?.("Model 1 Negative. Escalating to Model 2...");
        
        // 4. Run Model 2 (General Damage Expert)
        const damageResult = await analyzeGeneralDamage(image);

        if (damageResult.detected) {
            // CASE C: Model 2 Success
            onStatusUpdate?.("Model 2 Verified: General Damage Detected!");
            status = ComplaintStatus.AUTO_VERIFIED;
            severity = damageResult.severity;
            severityScore = damageResult.severityScore;
            if (!description) description = damageResult.label;
        } else {
            // CASE D: Both Models Failed
            onStatusUpdate?.("No clear damage detected. Moving to Waiting List.");
            status = ComplaintStatus.WAITING_LIST;
            severity = Severity.LOW;
            severityScore = 0.5;
            if (!description) description = "No clear damage detected by AI systems. Pending manual review.";
        }
    }

    // Department Assignment Logic
    // Prioritize user selection
    const departments: DepartmentType[] = [];
    if (userInput.department) {
        departments.push(userInput.department as DepartmentType);
    } else {
        // Fallback Logic if no user department (though UI enforces it)
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
      reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 }
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

  async deleteComplaint(id: string): Promise<void> {
    await delay(500);
    this.complaints = this.complaints.filter(c => c.id !== id);
    this.saveToStorage();
  }
}

export const api = new MockApiService();