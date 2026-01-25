import { INITIAL_COMPLAINTS } from '../constants';
import { Complaint, ComplaintStatus, Severity, AdminLog, AdminActivityType, AdminStats } from '../types';
import { analyzePotholes } from './model1';
import { analyzeGeneralDamage } from './model2';

// Simulated latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockApiService {
  private complaints: Complaint[] = [...INITIAL_COMPLAINTS];
  
  // In-memory storage for admin logs (simulating database)
  // Started empty
  private adminLogs: AdminLog[] = [];

  async getComplaints(): Promise<Complaint[]> {
    await delay(800);
    return [...this.complaints];
  }

  async getUserComplaints(userId: string): Promise<Complaint[]> {
    await delay(500);
    return this.complaints.filter(c => c.userId === userId);
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
    console.log(`[Admin Log] ${type}: ${details || ''}`);
  }

  async getAdminStats(): Promise<AdminStats> {
    await delay(600);
    const totalRepairOrders = this.adminLogs.filter(l => l.type === 'REPAIR_ORDER').length;
    const totalDeletedCases = this.adminLogs.filter(l => l.type === 'DELETE_CASE').length;
    
    return {
      totalRepairOrders,
      totalDeletedCases,
      logs: [...this.adminLogs]
    };
  }

  // --- AI BACKEND PIPELINE ---
  // Now accepts an optional callback to update the UI with the exact step being executed
  async analyzeAndReport(
    image: File, 
    location: { lat: number, lng: number } | null, 
    manualAddress: string, 
    userId: string,
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

    // 2. Run Model 1 (Pothole Expert)
    onStatusUpdate?.("Running Model 1 (Pothole Expert)...");
    const potholeResult = await analyzePotholes(image);
    
    let status = ComplaintStatus.WAITING_LIST;
    let severity = Severity.LOW;
    let severityScore = 0;
    let description = "";

    if (potholeResult.detected) {
        // CASE A: Model 1 Success
        onStatusUpdate?.("Model 1 Verified: Pothole Detected!");
        console.log("Model 1 (Pothole) Success: Moving to Main List");
        status = ComplaintStatus.AUTO_VERIFIED;
        severity = potholeResult.severity;
        severityScore = potholeResult.severityScore;
        description = potholeResult.label;
    } else {
        // CASE B: Model 1 Failed -> Try Model 2
        onStatusUpdate?.("Model 1 Negative. Escalating to Model 2...");
        console.log("Model 1 Failed. Handing over to Model 2...");
        
        // 3. Run Model 2 (General Damage Expert)
        const damageResult = await analyzeGeneralDamage(image);

        if (damageResult.detected) {
            // CASE C: Model 2 Success
            onStatusUpdate?.("Model 2 Verified: General Damage Detected!");
            console.log("Model 2 (General) Success: Moving to Main List");
            status = ComplaintStatus.AUTO_VERIFIED;
            severity = damageResult.severity;
            severityScore = damageResult.severityScore;
            description = damageResult.label;
        } else {
            // CASE D: Both Models Failed
            onStatusUpdate?.("No clear damage detected. Moving to Waiting List.");
            console.log("Model 2 Failed. Moving to Waiting List.");
            status = ComplaintStatus.WAITING_LIST;
            severity = Severity.LOW;
            severityScore = 0.5;
            description = "No clear damage detected by AI systems. Pending manual review.";
        }
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
      timestamp: new Date(), // Timestamp captured here
      address: address
    };

    this.complaints.unshift(newComplaint);
    return newComplaint;
  }

  async updateComplaintStatus(id: string, status: ComplaintStatus): Promise<void> {
    await delay(500);
    const index = this.complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      this.complaints[index].status = status;
    }
  }

  async deleteComplaint(id: string): Promise<void> {
    await delay(500);
    this.complaints = this.complaints.filter(c => c.id !== id);
  }
}

export const api = new MockApiService();