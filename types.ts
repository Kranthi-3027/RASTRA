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
  PENDING_DEPT_VERIFICATION = 'Pending Verification',
  REPAIRED = 'Repaired',
  IGNORED = 'Rejected'
}

export enum Severity {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

// Road classification for location-weighted severity scoring.
// A pothole on a national highway carries higher urgency than the same
// damage on a residential lane — this enum encodes that contract.
export enum RoadType {
  NATIONAL_HIGHWAY = 'National Highway',
  STATE_HIGHWAY    = 'State Highway / Expressway',
  MAIN_ROAD        = 'Main Road / Arterial Road',
  STREET           = 'Street / Colony Road',
  LANE             = 'Lane / Internal Road',
}

// Road bonus added to severityScore to produce an internal priority_rank.
// Never shown to users — only used to sort the repair queue.
// National Highway gets +3 boost; lanes get 0. Score itself is never touched.
export const ROAD_TYPE_PRIORITY_BONUS: Record<RoadType, number> = {
  [RoadType.NATIONAL_HIGHWAY]: 3.0,
  [RoadType.STATE_HIGHWAY]:    2.0,
  [RoadType.MAIN_ROAD]:        1.0,
  [RoadType.STREET]:           0.5,
  [RoadType.LANE]:             0.0,
};

// Derive priority_rank = severityScore + road bonus (capped at 10 for display safety).
export function computePriorityRank(severityScore: number, roadType: RoadType): number {
  return parseFloat(Math.min(10, severityScore + ROAD_TYPE_PRIORITY_BONUS[roadType]).toFixed(1));
}

// Severity derived purely from raw confidence score — road type never touches this.
export function severityFromScore(score: number): Severity {
  if (score >= 7.5) return Severity.HIGH;
  if (score >= 4.0) return Severity.MEDIUM;
  return Severity.LOW;
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

export enum EscalationLevel {
  NONE = 'NONE',
  DEPT_HEAD = 'DEPT_HEAD',      // Level 1: Escalated to Department Head
  COMMISSIONER = 'COMMISSIONER', // Level 2: Escalated to Municipal Commissioner
  STATE = 'STATE'                // Level 3: Escalated to State Authority
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
  roadType?: RoadType;         // OSM-derived road classification
  priorityRank?: number;       // internal sort key = severityScore + road bonus (never displayed as a score)
  description?: string;
  timestamp: Date;
  address: string;
  departments: DepartmentType[];
  comments: Comment[];
  concernCount: number;
  hasRaisedConcern: boolean;
  reportStats: ReportStats;
  // Community reporting (users flagging a complaint they also witnessed)
  communityReportCount: number;
  hasReported: boolean;
  trafficAlert?: boolean;
  assignedConstable?: TrafficPersonnel;
  assignedContractorId?: string;
  contractorAssignedDate?: Date;
  repairEvidenceUrl?: string;
  repairedDate?: Date;
  rejectionReason?: string;       // set by dept on reject, cleared when contractor re-submits
  // SLA & ESCALATION
  slaDeadline?: Date;
  slaHours?: number;
  escalationLevel?: EscalationLevel;
  escalationHistory?: { level: EscalationLevel; timestamp: Date; reason: string }[];
  autoRoutedDept?: DepartmentType;
  routingConfidence?: number;
  routingKeywords?: string[];
  // SOFT DELETE (only present on audit records)
  deletedAt?: Date;
  deletedBy?: string;
  deletedByName?: string;
  deletedByRole?: string;
  deleteReason?: string;
}

// --- APPEAL REQUEST ---
export type AppealStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AppealRequest {
  id: string;
  complaintId: string;
  fromDept: DepartmentType;
  reason: string;
  status: AppealStatus;
  assignedTo?: DepartmentType;
  reviewedBy?: string;
  createdAt: Date;
  reviewedAt?: Date;
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
export type AdminActivityType = 'LOGIN' | 'LOGOUT' | 'REPAIR_ORDER' | 'DELETE_CASE' | 'RESTORE_CASE' | 'APPEAL_RAISED' | 'APPEAL_APPROVED' | 'APPEAL_REJECTED' | 'TRAFFIC_ALERT' | 'CONSTABLE_DISPATCH' | 'CONTRACTOR_ASSIGN' | 'ANNOUNCEMENT' | 'WORK_COMPLETE';

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