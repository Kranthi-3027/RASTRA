export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum ComplaintStatus {
  SUBMITTED = 'Submitted',
  AUTO_VERIFIED = 'Auto-Verified',
  WAITING_LIST = 'Waiting List',
  ASSIGNED = 'Assigned',
  REPAIRED = 'Repaired',
  IGNORED = 'Ignored'
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