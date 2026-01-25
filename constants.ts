import { Complaint, ComplaintStatus, Severity, User, UserRole } from './types';

export const APP_NAME = 'RASHTRA';

export const COLORS = {
  primary: '#0A3D62',
  secondary: '#1DD1A1',
  alert: '#EE5253',
  warning: '#FBC531',
  white: '#FFFFFF',
  dark: '#121212'
};

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Rohan Sharma',
  email: 'rohan@example.com',
  role: UserRole.USER,
  avatarUrl: 'https://picsum.photos/100/100',
  phoneNumber: '+91 98765 43210',
  address: 'Jubilee Hills, Hyderabad'
};

export const MOCK_ADMIN: User = {
  id: 'a1',
  name: 'Municipal Admin',
  email: 'admin@hyd-municipal.gov.in',
  role: UserRole.ADMIN,
  avatarUrl: 'https://picsum.photos/101/101',
  phoneNumber: '+91 40 2322 2111',
  address: 'GHMC Head Office'
};

// Start with an empty list for production-like behavior
export const INITIAL_COMPLAINTS: Complaint[] = [];