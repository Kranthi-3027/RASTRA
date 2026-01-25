export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

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
export type AdminActivityType = 'LOGIN' | 'LOGOUT' | 'REPAIR_ORDER' | 'DELETE_CASE';

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