import React from 'react';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ENGINEERING = 'ENGINEERING',
  TRAFFIC = 'TRAFFIC',
  WARD_OFFICE = 'WARD_OFFICE',
  WATER_DEPT = 'WATER_DEPT',
  CONTRACTOR = 'CONTRACTOR'
}

export type DepartmentType = 'Engineering' | 'Traffic' | 'Ward' | 'Water' | 'Drainage' | 'Electricity' | 'Telecom';

export type Language = 'en' | 'mr' | 'hi';

export enum ComplaintStatus {
  SUBMITTED = 'Uploaded',
  AUTO_VERIFIED = 'Verified',
  WAITING_LIST = 'Waiting List',
  ASSIGNED = 'Workers Assigned',
  REPAIRED = 'Repaired',
  IGNORED = 'Rejected'
}

export enum Severity {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  avatarUrl?: string;
}

export interface ReportStats {
  duplicate: number;
  fake: number;
  fixed: number;
  wrongLocation: number;
}

export interface TrafficPersonnel {
  id: string;
  name: string;
  rank: 'Inspector' | 'Sub-Inspector' | 'Constable' | 'Traffic Warden (Volunteer)';
  badgeNumber: string;
  phone: string;
  status: 'Available' | 'Busy' | 'Off Duty';
  currentLocation: string;
  lastActive: string;
}

// Alias for DepartmentDashboard usage
export type Constable = TrafficPersonnel;

// --- CONTRACTOR TYPES ---
export interface WorkHistory {
    id: string;
    location: string;
    description: string;
    date: string;
    status: 'Completed' | 'In Progress';
}

export interface Contractor {
    id: string;
    name: string;
    company: string;
    specialization: string;
    rating: number;
    activeProjects: number;
    completedProjects: number;
    contact: string;
    status: 'Verified' | 'Probation' | 'Inactive';
    history: WorkHistory[];
}

export interface Complaint {
  id: string;
  userId: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  status: ComplaintStatus;
  severity: Severity;
  severityScore: number;
  description?: string;
  timestamp: Date;
  address: string;
  departments: DepartmentType[];
  comments: Comment[];
  concernCount: number;
  hasRaisedConcern: boolean;
  reportStats: ReportStats;
  trafficAlert?: boolean; 
  assignedConstable?: TrafficPersonnel;
  assignedContractorId?: string; // New: Link to contractor
  contractorAssignedDate?: Date; // New: When it was assigned
  repairEvidenceUrl?: string; // New: Proof of fix
  repairedDate?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phoneNumber?: string;
  address?: string;
}

export interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

// --- ADMIN AUDIT TYPES ---
export type AdminActivityType = 'LOGIN' | 'LOGOUT' | 'REPAIR_ORDER' | 'DELETE_CASE' | 'TRAFFIC_ALERT' | 'CONSTABLE_DISPATCH' | 'CONTRACTOR_ASSIGN' | 'ANNOUNCEMENT' | 'WORK_COMPLETE';

export interface AdminLog {
  id: string;
  type: AdminActivityType;
  timestamp: Date;
  details?: string;
}

export interface AdminStats {
  totalRepairOrders: number;
  totalDeletedCases: number;
  logs: AdminLog[];
}

// --- ANNOUNCEMENTS ---
export type AnnouncementType = 'INFO' | 'WARNING' | 'CRITICAL';
export type AnnouncementTarget = 'ALL' | 'CITIZENS' | 'OFFICIALS';

export interface Announcement {
  id: string;
  message: string;
  type: AnnouncementType;
  target: AnnouncementTarget;
  timestamp: Date;
  active: boolean;
  createdBy: string;
}