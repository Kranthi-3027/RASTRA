import { INITIAL_COMPLAINTS } from '../constants';
import { Complaint, ComplaintStatus, Severity } from '../types';

// Simulated latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockApiService {
  private complaints: Complaint[] = [...INITIAL_COMPLAINTS];

  async getComplaints(): Promise<Complaint[]> {
    await delay(800);
    return [...this.complaints];
  }

  async getUserComplaints(userId: string): Promise<Complaint[]> {
    await delay(500);
    return this.complaints.filter(c => c.userId === userId);
  }

  // --- AI PIPELINE SIMULATION ---
  async analyzeAndReport(image: File, location: { lat: number, lng: number }, userId: string): Promise<Complaint> {
    console.log("Starting Sequential AI Pipeline...");
    
    // Step 1: Upload simulation
    await delay(1000); 

    // Step 2: Primary Detection
    console.log("Running Primary AI Detection...");
    await delay(1500); // Simulate processing time

    // Randomize result for demo purposes
    const isPothole = Math.random() > 0.3;
    let status = ComplaintStatus.WAITING_LIST;
    let severity = Severity.LOW;
    let description = "Potential road damage detected.";

    if (isPothole) {
      console.log("Pothole Detected!");
      status = ComplaintStatus.AUTO_VERIFIED;
      severity = Severity.HIGH;
      description = "Heavy damage detected.";
    } else {
      console.log("No pothole. Running Secondary Verification...");
      // Step 3: Secondary Verification
      await delay(1500);
      const isOtherDamage = Math.random() > 0.4;
      
      if (isOtherDamage) {
        console.log("Other Road Damage Detected!");
        status = ComplaintStatus.AUTO_VERIFIED;
        severity = Severity.MEDIUM;
        description = "Road crack/uneven surface detected.";
      } else {
        console.log("No clear damage detected by AI. Moving to Waiting List.");
        status = ComplaintStatus.WAITING_LIST;
        description = "No clear damage detected. Pending manual review.";
      }
    }

    const newComplaint: Complaint = {
      id: `TKN-${Math.floor(1000 + Math.random() * 9000)}`,
      userId,
      imageUrl: URL.createObjectURL(image), // In real app, this is a cloud URL
      latitude: location.lat,
      longitude: location.lng,
      status,
      severity,
      description,
      timestamp: new Date(),
      address: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` // Mock reverse geocode
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
}

export const api = new MockApiService();